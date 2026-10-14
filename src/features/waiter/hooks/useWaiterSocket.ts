import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import {
  createWaiterSocketController,
  type WaiterEvent,
} from "../services/waiterSocketService";

type Options = {
  url: string;
  getToken: () => Promise<string | null>;
  onEvent: (event: WaiterEvent) => void;
  enabled?: boolean;
};

export function useWaiterSocket({
  url,
  getToken,
  onEvent,
  enabled = true,
}: Options) {
  const controllerRef = useRef<ReturnType<
    typeof createWaiterSocketController
  > | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const controller = createWaiterSocketController({ url, getToken, onEvent });
    controllerRef.current = controller;
    void controller.connect();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && controller.getReadyState() !== WebSocket.OPEN) {
        void controller.connect();
      }
    });

    return () => {
      sub.remove();
      controller.close();
    };
  }, [enabled, url, getToken, onEvent]);

  useEffect(() => {
    if (!controllerRef.current) return;
    controllerRef.current.setOnEvent(onEvent);
  }, [onEvent]);

  useEffect(() => {
    const current = controllerRef.current;
    if (!current) return;
    return () => {
      current.close();
    };
  }, []);
}
