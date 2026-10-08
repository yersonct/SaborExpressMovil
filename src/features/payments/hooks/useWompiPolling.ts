import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { paymentService } from "../services/paymentService";
import { PaymentStatus } from "../types/payment.types";

const INTERVAL_MS = 2500;
const MAX_WAIT_MS = 5 * 60 * 1000;

interface PollJob {
  paymentId: number;
  deadline: number;
  checking: boolean;
  onResolved: (finalStatus: PaymentStatus) => void;
  onTimeout?: () => void;
}

export function useWompiPolling() {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [polling, setPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const jobRef = useRef<PollJob | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    jobRef.current = null;
    setPolling(false);
  }, []);

  const check = useCallback(async () => {
    const job = jobRef.current;
    if (!job || job.checking) return;
    job.checking = true;
    try {
      const payment = await paymentService.syncWompi(job.paymentId);
      if (jobRef.current !== job) return; // ya se detuvo o empezó otro
      if (
        payment.status === PaymentStatus.Completed ||
        payment.status === PaymentStatus.Failed
      ) {
        setStatus(payment.status);
        stopPolling();
        job.onResolved(payment.status);
        return;
      }
    } catch {
      // silencioso: reintenta en el próximo ciclo
    } finally {
      job.checking = false;
    }

    if (jobRef.current === job && Date.now() > job.deadline) {
      stopPolling();
      job.onTimeout?.();
    }
  }, [stopPolling]);

  const startPolling = useCallback(
    (
      paymentId: number,
      onResolved: (finalStatus: PaymentStatus) => void,
      onTimeout?: () => void,
    ) => {
      stopPolling();
      jobRef.current = {
        paymentId,
        deadline: Date.now() + MAX_WAIT_MS,
        checking: false,
        onResolved,
        onTimeout,
      };
      setPolling(true);
      setStatus(PaymentStatus.Pending);
      intervalRef.current = setInterval(check, INTERVAL_MS);
    },
    [check, stopPolling],
  );

  // Al volver de la pasarela de Wompi (app a primer plano) se consulta de inmediato.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => sub.remove();
  }, [check]);

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    [],
  );

  return { status, polling, startPolling, stopPolling };
}
