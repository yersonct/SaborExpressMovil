import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePublicBranches } from "../hooks/usePublicBranches";
import type { PublicBranch } from "../types/branch.types";
import { useDeliveryRoute } from "../hooks/useDeliveryRoute";
import { LeafletMap, type MapMarker } from "./LeafletMap";
import type { MapCircle } from "./leafletShared";
import { useDeliveryCoverage } from "../hooks/useDeliveryCoverage";
import { haversineKm } from "@/features/orders/utils/orderBreakdown";
import { useClientPreferences } from "@/features/userPreferences/context/ClientPreferencesContext";
import { branchAvailabilityLabel, branchHoursLabel, branchIsUnavailable } from "../utils/branchAvailability";
import { showAppAlert } from "@/features/shared/services/alertEvents";
import { translateMobileCopy } from "../../../locales/mobileCopy";
import { deferEffect } from "@/features/shared/utils/deferEffect";

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
  const { colors, t, language } = useClientPreferences();
  const { branches, loading } = usePublicBranches(visible);
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

  // Consulta el radio real de cada sede.
  const { radii, loading: coverageLoading } = useDeliveryCoverage(located, visible);

  // Al abrir, conserva la sede activa; si aún no hay selección, usa la más cercana.
  useEffect(() => deferEffect(() => {
    if (visible) setSelectedId(selectedBranchId ?? nearestBranchId ?? null);
  }), [visible, nearestBranchId, selectedBranchId]);

  const selectedBranch = useMemo(
    () => located.find((b) => b.id === selectedId) ?? null,
    [located, selectedId],
  );

  const branchCoords = useMemo(
    () => selectedBranch
      ? {
          latitude: selectedBranch.latitude as number,
          longitude: selectedBranch.longitude as number,
        }
      : null,
    [selectedBranch],
  );

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
    branchCoords,
    userLocation,
  ]);

  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = located.map((b) => ({
      id: `b${b.id}`,
      latitude: b.latitude as number,
      longitude: b.longitude as number,
      title: b.name,
      description: `${b.address ?? ""} · ${branchAvailabilityLabel(b, language)} · ${branchHoursLabel(b, language)}`,
      color: branchIsUnavailable(b) ? "#94A3B8" : b.id === selectedId ? "#10B981" : "#E61C24",
      alwaysShowLabel: true,
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
  }, [located, selectedId, userLocation, t, language]);

  const circles = useMemo<MapCircle[]>(() => located.flatMap((b) => {
    const radius = radii[b.id];
    if (radius == null || radius <= 0) return [];
    return [{
      latitude: Number(b.latitude), longitude: Number(b.longitude),
      radiusKm: radius,
      color: b.id === selectedId ? "#10B981" : "#E61C24",
    }];
  }), [located, radii, selectedId]);

  // No cambia al tocar otra sede; así el mapa conserva el foco que eligió el usuario.
  const fitKey = visible
    ? `open-${located.length}-${userLocation ? 1 : 0}-${selectedBranchId ?? nearestBranchId ?? 0}-${located.map((b) => radii[b.id] ?? "n").join("-")}`
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
                circles={circles}
                fitCircles
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
                      ? translateMobileCopy(
                          "{{branch}}: {{distance}} km por calles · ~{{minutes}} min",
                          {
                            branch: selectedBranch.name,
                            distance: distanceKm.toFixed(1),
                            minutes: durationMin ?? "",
                          },
                        )
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
                    <Text style={{ fontWeight: "700", fontSize: 12, marginTop: 5,
                      color: branchIsUnavailable(b) ? "#DC2626" : "#16A34A" }}>
                      {branchAvailabilityLabel(b, language)}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                      {branchHoursLabel(b, language)}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                      {coverageLoading
                          ? translateMobileCopy("Consultando radio de entrega...")
                        : radii[b.id] == null
                          ? translateMobileCopy("Radio no disponible")
                          : translateMobileCopy("Radio:") + " " + radii[b.id] + " km" + (userLocation
                              ? " · " + haversineKm(userLocation.latitude, userLocation.longitude, Number(b.latitude), Number(b.longitude)).toFixed(1)
                                + translateMobileCopy(" km en línea recta · ") + (haversineKm(userLocation.latitude, userLocation.longitude, Number(b.latitude), Number(b.longitude)) <= radii[b.id]!
                                ? translateMobileCopy("Dentro de cobertura") : translateMobileCopy("Fuera de cobertura"))
                            : "")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            {selectedBranch && onSelectBranch && (
              <TouchableOpacity
                onPress={() => {
                  if (branchIsUnavailable(selectedBranch)) {
                    showAppAlert("Sede cerrada", selectedBranch.unavailableReason ||
                      branchHoursLabel(selectedBranch, language));
                    return;
                  }
                  if (coverageLoading || radii[selectedBranch.id] == null) {
                    Alert.alert(translateMobileCopy("Radio no disponible"), translateMobileCopy("No se pudo verificar el radio de entrega de esta sede."));
                    return;
                  }
                  if (userLocation && haversineKm(userLocation.latitude, userLocation.longitude,
                        Number(selectedBranch.latitude), Number(selectedBranch.longitude)) > radii[selectedBranch.id]!) {
                    Alert.alert(translateMobileCopy("Fuera de cobertura"), translateMobileCopy("La dirección elegida está fuera del radio de entrega de {{branch}}. Elige otra sede o dirección.", { branch: selectedBranch.name }));
                    return;
                  }
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
                  backgroundColor: branchIsUnavailable(selectedBranch) ? "#94A3B8" : colors.accent,
                }}
                accessibilityRole="button"
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>
                  {branchIsUnavailable(selectedBranch)
                    ? branchAvailabilityLabel(selectedBranch, language)
                    : t("useThisBranch")}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}
