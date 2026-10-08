import { useEffect, useState } from "react";

type Coords = { latitude: number; longitude: number };

export function useDeliveryRoute(from: Coords | null, to: Coords | null) {
  const [route, setRoute] = useState<Coords[]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!from || !to) {
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
          `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
          `?overview=full&geometries=geojson`;
        const res = await fetch(url);
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
  }, [from?.latitude, from?.longitude, to?.latitude, to?.longitude]);

  return { route, distanceKm, durationMin, loading, failed };
}
