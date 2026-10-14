import { useEffect, useState } from "react";
import * as Location from "expo-location";

type Coords = { latitude: number; longitude: number };

// Sigue la posición del repartidor mientras el mapa está abierto.
export function useDriverLocation(enabled: boolean) {
  const [location, setLocation] = useState<Coords | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || cancelled) return;

      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 50,
          timeInterval: 15000,
        },
        (pos) =>
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
      );
      if (cancelled) sub.remove();
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [enabled]);

  return { location };
}
