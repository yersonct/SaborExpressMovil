import {
  reportNetworkAvailable,
  toUserFacingNetworkError,
} from "@/features/shared/services/networkStatus";

export type WaiterEvent = { type: string; payload?: unknown };

export type WaiterSocketOptions = {
  url: string;
  getToken: () => Promise<string | null>;
  onEvent: (event: WaiterEvent) => void;
};

export function createWaiterSocketController({
  url,
  getToken,
  onEvent,
}: WaiterSocketOptions) {
  let ws: WebSocket | null = null;
  let retry = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let closedByUs = false;
  const onEventRef = { current: onEvent };

  onEventRef.current = onEvent;

  const connect = async () => {
    const token = await getToken();
    if (!token) return;

    ws = new WebSocket(`${url}?token=${encodeURIComponent(token)}`);

    ws.onopen = () => {
      retry = 0;
      reportNetworkAvailable();
    };

    ws.onmessage = (msg) => {
      try {
        onEventRef.current(JSON.parse(msg.data));
      } catch {
        // mensaje no JSON, se ignora
      }
    };

    ws.onclose = (event) => {
      if (closedByUs) return;
      if (event.code === 1006) {
        toUserFacingNetworkError(new Error("WebSocket connection lost"));
      }
      const delay = Math.min(1000 * 2 ** retry, 30000);
      retry += 1;
      timer = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      if (!closedByUs) {
        toUserFacingNetworkError(new Error("WebSocket network request failed"));
      }
      ws?.close();
    };
  };

  return {
    connect,
    getReadyState: () => ws?.readyState ?? WebSocket.CLOSED,
    close: () => {
      closedByUs = true;
      if (timer) clearTimeout(timer);
      ws?.close();
    },
    setOnEvent: (nextOnEvent: (event: WaiterEvent) => void) => {
      onEventRef.current = nextOnEvent;
    },
  };
}
