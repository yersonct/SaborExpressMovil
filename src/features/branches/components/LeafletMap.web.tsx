import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { LEAFLET_HTML, type LeafletMapProps } from "./leafletShared";

export type { MapMarker } from "./leafletShared";

export function LeafletMap({
  markers,
  circles,
  fitCircles,
  route,
  fitKey,
  focus,
  onPress,
  onMarkerDragEnd,
}: LeafletMapProps) {
  const frameRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const lastFitKey = useRef<string | undefined>(undefined);

  // Los callbacks se guardan en refs para no tener que re-suscribir el listener.
  const onPressRef = useRef(onPress);
  const onDragRef = useRef(onMarkerDragEnd);
  useEffect(() => {
    onPressRef.current = onPress;
    onDragRef.current = onMarkerDragEnd;
  }, [onPress, onMarkerDragEnd]);

  const send = (msg: object) =>
    frameRef.current?.contentWindow?.postMessage(JSON.stringify(msg), "*");

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow) return;
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "ready") setReady(true);
        else if (msg.type === "tap")
          onPressRef.current?.({ latitude: msg.lat, longitude: msg.lng });
        else if (msg.type === "drag")
          onDragRef.current?.(msg.id, {
            latitude: msg.lat,
            longitude: msg.lng,
          });
      } catch {
        // mensaje inválido: se ignora
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const fit = lastFitKey.current !== fitKey;
    lastFitKey.current = fitKey;
    send({
      cmd: "update",
      payload: { markers, circles: circles ?? [], fitCircles: fitCircles ?? false, route: route ?? [], fit },
    });
  }, [ready, markers, circles, fitCircles, route, fitKey]);

  useEffect(() => {
    if (!ready || !focus) return;
    send({ cmd: "focus", lat: focus.latitude, lng: focus.longitude });
  }, [ready, focus]);

  return (
    <View style={{ flex: 1 }}>
      {React.createElement("iframe", {
        ref: frameRef,
        srcDoc: LEAFLET_HTML,
        title: "Mapa de sedes",
        style: { border: 0, width: "100%", height: "100%" },
      })}
    </View>
  );
}
