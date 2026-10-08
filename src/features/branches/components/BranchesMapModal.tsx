import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePublicBranches } from "../hooks/usePublicBranches";
import { useDeliveryRoute } from "../hooks/useDeliveryRoute";
import { LeafletMap, type MapMarker } from "./LeafletMap";

type Props = {
  visible: boolean;
  onClose: () => void;
  nearestBranchId?: number | null;
  userLocation?: { latitude: number; longitude: number } | null;
};

export function BranchesMapModal({
  visible,
  onClose,
  nearestBranchId,
  userLocation,
}: Props) {
  const { branches, loading } = usePublicBranches();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [focus, setFocus] = useState<{
    latitude: number;
    longitude: number;
    nonce: number;
  } | null>(null);

  // Solo sedes que tengan coordenadas válidas
  const located = useMemo(
    () =>
      branches.filter(
        (b) =>
          b.latitude != null &&
          b.longitude != null &&
          !(b.latitude === 0 && b.longitude === 0),
      ),
    [branches],
  );

  // Cada vez que se abre el modal, la sede seleccionada vuelve a ser la más cercana.
  useEffect(() => {
    if (visible) setSelectedId(nearestBranchId ?? null);
  }, [visible, nearestBranchId]);

  const selectedBranch = useMemo(
    () => located.find((b) => b.id === selectedId) ?? null,
    [located, selectedId],
  );

  const branchCoords = selectedBranch
    ? {
        latitude: selectedBranch.latitude as number,
        longitude: selectedBranch.longitude as number,
      }
    : null;

  const {
    route,
    distanceKm,
    durationMin,
    loading: loadingRoute,
    failed,
  } = useDeliveryRoute(
    visible ? branchCoords : null,
    visible ? (userLocation ?? null) : null,
  );

  // Si no se pudo calcular por calles, se dibuja una línea recta.
  const lineToDraw = useMemo(() => {
    if (route.length > 0) return route;
    if (failed && branchCoords && userLocation)
      return [branchCoords, userLocation];
    return [];
  }, [
    route,
    failed,
    branchCoords?.latitude,
    branchCoords?.longitude,
    userLocation?.latitude,
    userLocation?.longitude,
  ]);

  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = located.map((b) => ({
      id: `b${b.id}`,
      latitude: b.latitude as number,
      longitude: b.longitude as number,
      title: b.name,
      description: b.address ?? undefined,
      color: b.id === selectedId ? "#10B981" : "#E61C24",
    }));
    if (userLocation) {
      list.push({
        id: "me",
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        title: "Tu dirección de entrega",
        color: "#2563EB",
      });
    }
    return list;
  }, [located, selectedId, userLocation?.latitude, userLocation?.longitude]);

  // Solo depende de la sede más cercana (no de la seleccionada): así, al tocar
  // otra sede, el mapa no se vuelve a encuadrar solo; se centra en esa sede.
  const fitKey = visible
    ? `open-${located.length}-${userLocation ? 1 : 0}-${nearestBranchId ?? 0}`
    : "closed";

  const focusBranch = (lat: number, lng: number) =>
    setFocus((prev) => ({
      latitude: lat,
      longitude: lng,
      nonce: (prev?.nonce ?? 0) + 1,
    }));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#FFF" }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 16,
            paddingTop: 48,
            backgroundColor: "#1E293B",
          }}
        >
          <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "bold" }}>
            Nuestras sedes
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#E61C24" />
          </View>
        ) : located.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", padding: 32 }}>
            <Text style={{ textAlign: "center", color: "#64748B" }}>
              Las sedes todavía no tienen ubicación registrada.
            </Text>
          </View>
        ) : (
          <>
            <View style={{ flex: 1 }}>
              <LeafletMap
                markers={markers}
                route={lineToDraw}
                fitKey={fitKey}
                focus={focus}
              />
            </View>

            {/* Resumen de la ruta hacia la sede seleccionada */}
            {selectedBranch && userLocation && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  backgroundColor: "#EFF6FF",
                }}
              >
                <Ionicons name="navigate" size={18} color="#2563EB" />
                <Text style={{ flex: 1, color: "#1E293B", fontSize: 13 }}>
                  {loadingRoute
                    ? "Calculando ruta..."
                    : distanceKm != null
                      ? `${selectedBranch.name}: ${distanceKm.toFixed(1)} km · ~${durationMin} min`
                      : `${selectedBranch.name} (no se pudo calcular la ruta por calles)`}
                </Text>
              </View>
            )}

            {/* Lista de sedes */}
            <View style={{ maxHeight: 190, backgroundColor: "#FFF" }}>
              <ScrollView contentContainerStyle={{ padding: 12 }}>
                {located.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => {
                      setSelectedId(b.id);
                      focusBranch(b.latitude as number, b.longitude as number);
                    }}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      marginBottom: 8,
                      borderWidth: 2,
                      borderColor:
                        b.id === selectedId ? "#10B981" : "transparent",
                      backgroundColor:
                        b.id === selectedId ? "#ECFDF5" : "#F8FAFC",
                    }}
                  >
                    <Text style={{ fontWeight: "700", color: "#1E293B" }}>
                      {b.name}
                      {b.id === nearestBranchId ? "  · Tu sede" : ""}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#64748B" }}>
                      {b.address}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}
