import React, { useEffect, useRef, useState } from "react";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
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
  const webRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const lastFitKey = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!ready) return;
    const fit = lastFitKey.current !== fitKey;
    lastFitKey.current = fitKey;
    const payload = { markers, circles: circles ?? [], fitCircles: fitCircles ?? false, route: route ?? [], fit };
    webRef.current?.injectJavaScript(
      `window.updateMap(${JSON.stringify(payload)}); true;`,
    );
  }, [ready, markers, circles, fitCircles, route, fitKey]);

  useEffect(() => {
    if (!ready || !focus) return;
    webRef.current?.injectJavaScript(
      `map.setView([${focus.latitude}, ${focus.longitude}], 16); true;`,
    );
  }, [ready, focus]);

  const handleMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === "ready") setReady(true);
      else if (msg.type === "tap")
        onPress?.({ latitude: msg.lat, longitude: msg.lng });
      else if (msg.type === "drag")
        onMarkerDragEnd?.(msg.id, { latitude: msg.lat, longitude: msg.lng });
    } catch {
      // mensaje inválido: se ignora
    }
  };

  return (
    <WebView
      ref={webRef}
      style={{ flex: 1 }}
      originWhitelist={["*"]}
      // El baseUrl da un "Referer" válido: OpenStreetMap bloquea teselas
      // pedidas sin él.
      source={{ html: LEAFLET_HTML, baseUrl: "https://saborexpress.app" }}
      onMessage={handleMessage}
      javaScriptEnabled
      domStorageEnabled
      mixedContentMode="always"
      setSupportMultipleWindows={false}
    />
  );
}
