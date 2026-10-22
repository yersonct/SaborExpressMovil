import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { paymentService } from "../services/paymentService";
import { PaymentStatus } from "../types/payment.types";
import { useRealtimeEvents } from "@/features/shared/hooks/useRealtimeEvents";

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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jobRef = useRef<PollJob | null>(null);

  const stopPolling = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
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
      const job: PollJob = {
        paymentId,
        deadline: Date.now() + MAX_WAIT_MS,
        checking: false,
        onResolved,
        onTimeout,
      };
      jobRef.current = job;
      setPolling(true);
      setStatus(PaymentStatus.Pending);
      timeoutRef.current = setTimeout(() => {
        if (jobRef.current !== job) return;
        stopPolling();
        job.onTimeout?.();
      }, MAX_WAIT_MS);
    },
    [stopPolling],
  );

  // Wompi informa al backend por webhook/sincronización. El backend publica
  // PaymentsChanged y aquí consultamos el resultado una sola vez por evento.
  useRealtimeEvents(["PaymentsChanged", "RealtimeConnected"], () => {
    void check();
  });

  // Al volver de la pasarela de Wompi (app a primer plano) se consulta de inmediato.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => sub.remove();
  }, [check]);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  return { status, polling, startPolling, stopPolling };
}
