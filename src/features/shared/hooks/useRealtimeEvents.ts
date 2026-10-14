import { useEffect, useRef } from "react";
import { subscribeRealtimeEvent } from "../services/realtimeEvents";

export function useRealtimeEvents(
  eventNames: string[],
  callback: (eventName: string, ...args: unknown[]) => void,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const eventsKey = [...new Set(eventNames)].sort().join("|");

  useEffect(() => {
    if (!eventsKey) return;
    const unsubscribe = eventsKey
      .split("|")
      .map((eventName) =>
        subscribeRealtimeEvent(eventName, (...args) =>
          callbackRef.current(eventName, ...args),
        ),
      );
    return () => unsubscribe.forEach((stop) => stop());
  }, [eventsKey]);
}
