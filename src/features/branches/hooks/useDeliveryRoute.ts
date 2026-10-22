import { useEffect, useState } from "react";
import { fetchWithNetworkHandling } from "@/features/shared/services/networkStatus";
import { deferEffect } from "@/features/shared/utils/deferEffect";

type Coords = { latitude: number; longitude: number };

export function useDeliveryRoute(from: Coords | null, to: Coords | null) {
  const fromLatitude = from?.latitude;
  const fromLongitude = from?.longitude;
  const toLatitude = to?.latitude;
  const toLongitude = to?.longitude;
  const [route, setRoute] = useState<Coords[]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => deferEffect(() => {
    if (
      fromLatitude == null ||
      fromLongitude == null ||
      toLatitude == null ||
      toLongitude == null
    ) {
      setRoute([]);
      setDistanceKm(null);
      setDurationMin(null);
      setFailed(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setFailed(false);
      try {
        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${fromLongitude},${fromLatitude};${toLongitude},${toLatitude}` +
          `?overview=full&geometries=geojson`;
        const res = await fetchWithNetworkHandling(url);
        const json = await res.json();
        const r = json?.routes?.[0];
        if (!r) throw new Error("Sin ruta");
        if (cancelled) return;

        setRoute(
          r.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
            latitude: lat,
            longitude: lng,
          })),
        );
        setDistanceKm(r.distance / 1000);
        setDurationMin(Math.round(r.duration / 60));
      } catch {
        if (!cancelled) {
          setRoute([]);
          setDistanceKm(null);
          setDurationMin(null);
          setFailed(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }), [fromLatitude, fromLongitude, toLatitude, toLongitude]);

  return { route, distanceKm, durationMin, loading, failed };
}
