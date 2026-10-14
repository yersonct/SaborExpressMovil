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
import type { PublicBranch } from "../types/branch.types";
import { useDeliveryRoute } from "../hooks/useDeliveryRoute";
import { LeafletMap, type MapMarker } from "./LeafletMap";
import { useClientPreferences } from "@/features/userPreferences/context/ClientPreferencesContext";

type Props = {
  visible: boolean;
  onClose: () => void;
  nearestBranchId?: number | null;
  selectedBranchId?: number | null;
  userLocation?: { latitude: number; longitude: number } | null;
  onSelectBranch?: (branch: PublicBranch) => void;
};

export function BranchesMapModal({
  visible,
  onClose,
  nearestBranchId,
  selectedBranchId,
  userLocation,
  onSelectBranch,
}: Props) {
  const { colors, t } = useClientPreferences();
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

  // Al abrir, conserva la sede activa; si aún no hay selección, usa la más cercana.
  useEffect(() => {
    if (visible) setSelectedId(selectedBranchId ?? nearestBranchId ?? null);
  }, [visible, nearestBranchId, selectedBranchId]);

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
        title: t("yourDeliveryAddress"),
        color: "#2563EB",
      });
    }
    return list;
  }, [located, selectedId, userLocation?.latitude, userLocation?.longitude, t]);

  // No cambia al tocar otra sede; así el mapa conserva el foco que eligió el usuario.
  const fitKey = visible
    ? `open-${located.length}-${userLocation ? 1 : 0}-${selectedBranchId ?? nearestBranchId ?? 0}`
    : "closed";

  const focusBranch = (lat: number, lng: number) =>
    setFocus((prev) => ({
      latitude: lat,
      longitude: lng,
      nonce: (prev?.nonce ?? 0) + 1,
    }));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 16,
            paddingTop: 48,
            backgroundColor: colors.surface,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
            {t("branchLocations")}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : located.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", padding: 32 }}>
            <Text style={{ textAlign: "center", color: colors.muted }}>
              {t("branchesNoLocation")}
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
                  backgroundColor: colors.elevated,
                }}
              >
                <Ionicons name="navigate" size={18} color={colors.accent} />
                <Text style={{ flex: 1, color: colors.text, fontSize: 13 }}>
                  {loadingRoute
                    ? t("routeCalculating")
                    : distanceKm != null
                      ? `${selectedBranch.name}: ${distanceKm.toFixed(1)} km · ~${durationMin} min`
                      : `${selectedBranch.name} (${t("routeNoStreet")})`}
                </Text>
              </View>
            )}

            {/* Lista de sedes */}
            <View style={{ maxHeight: 190, backgroundColor: colors.surface }}>
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
                      backgroundColor: b.id === selectedId ? colors.elevated : colors.background,
                    }}
                  >
                    <Text style={{ fontWeight: "700", color: colors.text }}>
                      {b.name}
                      {b.id === nearestBranchId ? `  · ${t("nearBranch")}` : ""}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted }}>
                      {b.address}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            {selectedBranch && onSelectBranch && (
              <TouchableOpacity
                onPress={() => {
                  onSelectBranch(selectedBranch);
                  onClose();
                }}
                style={{
                  marginHorizontal: 16,
                  marginTop: 10,
                  marginBottom: 16,
                  minHeight: 48,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.accent,
                }}
                accessibilityRole="button"
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>
                  {t("useThisBranch")}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}
