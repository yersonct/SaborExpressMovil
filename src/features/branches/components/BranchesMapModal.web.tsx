import React, { useEffect, useMemo, useState } from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useClientPreferences } from "@/features/userPreferences/context/ClientPreferencesContext";
import { usePublicBranches } from "../hooks/usePublicBranches";
import { useDeliveryCoverage } from "../hooks/useDeliveryCoverage";
import type { PublicBranch } from "../types/branch.types";
import { branchAvailabilityLabel, branchHoursLabel, branchIsUnavailable } from "../utils/branchAvailability";
import { LeafletMap, type MapMarker } from "./LeafletMap";
import { showAppAlert } from "@/features/shared/services/alertEvents";
import { haversineKm } from "@/features/orders/utils/orderBreakdown";
import { deferEffect } from "@/features/shared/utils/deferEffect";

type Props = {
  visible: boolean;
  onClose: () => void;
  nearestBranchId?: number | null;
  selectedBranchId?: number | null;
  userLocation?: { latitude: number; longitude: number } | null;
  onSelectBranch?: (branch: PublicBranch) => void;
};

// El navegador utiliza el mapa Leaflet ya existente del proyecto.
export function BranchesMapModal({
  visible, onClose, nearestBranchId, selectedBranchId, userLocation, onSelectBranch,
}: Props) {
  const { colors, t, language } = useClientPreferences();
  const { branches, loading } = usePublicBranches(visible);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [focus, setFocus] = useState<{ latitude: number; longitude: number; nonce: number } | null>(null);

  useEffect(() => deferEffect(() => {
    if (visible) setSelectedId(selectedBranchId ?? nearestBranchId ?? null);
  }), [visible, selectedBranchId, nearestBranchId]);

  const located = useMemo(() => branches.filter(b =>
    b.latitude != null && b.longitude != null &&
    !(b.latitude === 0 && b.longitude === 0)), [branches]);
  const selected = located.find(b => b.id === selectedId) ?? null;
  const { radii, loading: coverageLoading } = useDeliveryCoverage(located, visible);
  const markers = useMemo<MapMarker[]>(() => {
    const pins: MapMarker[] = located.map(b => ({
      id: `b${b.id}`,
      title: b.name,
      description: `${b.address ?? ""} · ${branchAvailabilityLabel(b, language)} · ${branchHoursLabel(b, language)}`,
      latitude: Number(b.latitude),
      longitude: Number(b.longitude),
      color: branchIsUnavailable(b) ? "#94A3B8" : b.id === selectedId ? "#10B981" : "#E61C24",
      alwaysShowLabel: true,
    }));
    if (userLocation) pins.push({
      id: "me", latitude: userLocation.latitude, longitude: userLocation.longitude,
      title: t("yourDeliveryAddress"), color: "#2563EB",
    });
    return pins;
  }, [located, selectedId, userLocation, language, t]);

  const choose = () => {
    if (!selected || !onSelectBranch) return;
    if (branchIsUnavailable(selected)) {
      showAppAlert("Sede cerrada", selected.unavailableReason || branchHoursLabel(selected, language));
      return;
    }
    const radius = radii[selected.id];
    if (coverageLoading || radius == null) {
      showAppAlert("Radio no disponible", "No se pudo verificar el radio de entrega de esta sede.");
      return;
    }
    if (userLocation && haversineKm(userLocation.latitude, userLocation.longitude,
      Number(selected.latitude), Number(selected.longitude)) > radius) {
      showAppAlert("Fuera de cobertura", "Esta dirección está fuera del radio de la sede seleccionada.");
      return;
    }
    onSelectBranch(selected);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          padding: 16, backgroundColor: colors.surface }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>{t("branchLocations")}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={onClose}>
            <Ionicons name="close" color={colors.text} size={26} />
          </TouchableOpacity>
        </View>
        {loading && located.length === 0 ? (
          <ActivityIndicator style={{ flex: 1 }} color={colors.accent} size="large" />
        ) : (
          <>
            <View style={{ flex: 1, minHeight: 220 }}>
              <LeafletMap markers={markers} fitKey={`web-${located.length}-${userLocation ? 1 : 0}`}
                fitCircles={false} focus={focus} />
            </View>
            <ScrollView style={{ maxHeight: 240, backgroundColor: colors.surface }}
              contentContainerStyle={{ padding: 12 }}>
              {located.length === 0 && (
                <Text style={{ color: colors.muted, padding: 12 }}>{t("branchesNoLocation")}</Text>
              )}
              {located.map(b => (
                <TouchableOpacity key={b.id} accessibilityRole="button" onPress={() => {
                  setSelectedId(b.id);
                  setFocus(previous => ({ latitude: Number(b.latitude), longitude: Number(b.longitude),
                    nonce: (previous?.nonce ?? 0) + 1 }));
                }} style={{ padding: 12, borderRadius: 10, marginBottom: 8,
                  borderWidth: b.id === selectedId ? 2 : 1,
                  borderColor: b.id === selectedId ? colors.accent : colors.border,
                  backgroundColor: colors.background }}>
                  <Text style={{ fontWeight: "800", color: colors.text }}>{b.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>{b.address}</Text>
                  <Text style={{ marginTop: 5, fontSize: 12, fontWeight: "700",
                    color: branchIsUnavailable(b) ? "#DC2626" : "#16A34A" }}>
                    {branchAvailabilityLabel(b, language)}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>{branchHoursLabel(b, language)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {selected && onSelectBranch && (
              <TouchableOpacity accessibilityRole="button" onPress={choose}
                style={{ margin: 16, borderRadius: 12, padding: 14, alignItems: "center",
                  backgroundColor: branchIsUnavailable(selected) ? "#94A3B8" : colors.accent }}>
                <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>
                  {branchIsUnavailable(selected) ? branchAvailabilityLabel(selected, language) : t("useThisBranch")}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}
