import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { usePublicBranches } from "../hooks/usePublicBranches";
import { LeafletMap, type MapMarker } from "./LeafletMap";
import { useClientPreferences } from "@/features/userPreferences/context/ClientPreferencesContext";

type Coords = { latitude: number; longitude: number };

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (coords: Coords) => void;
  initialLocation?: Coords | null;
};

// Distancia en km entre dos puntos (fórmula de Haversine)
function distanceKm(a: Coords, b: Coords) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function LocationPickerModal({
  visible,
  onClose,
  onConfirm,
  initialLocation,
}: Props) {
  const { colors, t } = useClientPreferences();
  const { branches } = usePublicBranches();
  const [pin, setPin] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [focus, setFocus] = useState<(Coords & { nonce: number }) | null>(null);

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

  // Cada vez que se abre, el pin parte de la ubicación actual (si hay)
  useEffect(() => {
    if (visible) setPin(initialLocation ?? null);
  }, [visible]);

  // Sede más cercana al pin, solo informativo
  const nearest = useMemo(() => {
    if (!pin || located.length === 0) return null;
    let best = located[0];
    let bestDist = Infinity;
    for (const b of located) {
      const d = distanceKm(pin, {
        latitude: b.latitude as number,
        longitude: b.longitude as number,
      });
      if (d < bestDist) {
        bestDist = d;
        best = b;
      }
    }
    return { branch: best, km: bestDist };
  }, [pin, located]);

  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = located.map((b) => ({
      id: `b${b.id}`,
      latitude: b.latitude as number,
      longitude: b.longitude as number,
      title: b.name,
      description: b.address ?? undefined,
      color: "#E61C24",
    }));
    if (pin) {
      list.push({
        id: "pin",
        latitude: pin.latitude,
        longitude: pin.longitude,
        title: t("yourDeliveryAddress"),
        color: "#2563EB",
        draggable: true,
      });
    }
    return list;
  }, [located, pin, t]);

  const fitKey = visible
    ? `open-${located.length}-${pin ? "p" : "n"}`
    : "closed";

  const handleUseGps = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("locationPermissionTitle"),
          t("locationPermissionMessage"),
        );
        return;
      }
      const p = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const here = {
        latitude: p.coords.latitude,
        longitude: p.coords.longitude,
      };
      setPin(here);
      setFocus((prev) => ({ ...here, nonce: (prev?.nonce ?? 0) + 1 }));
    } catch {
      Alert.alert(t("error"), t("locationError"));
    } finally {
      setLocating(false);
    }
  };

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
            {t("whereDeliver")}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          <LeafletMap
            markers={markers}
            fitKey={fitKey}
            focus={focus}
            onPress={(c) => setPin(c)}
            onMarkerDragEnd={(id, c) => {
              if (id === "pin") setPin(c);
            }}
          />

          {/* Botón GPS flotante */}
          <TouchableOpacity
            onPress={handleUseGps}
            disabled={locating}
            style={{
              position: "absolute",
              right: 16,
              top: 16,
              backgroundColor: colors.surface,
              padding: 12,
              borderRadius: 30,
              elevation: 4,
            }}
          >
            {locating ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons name="locate" size={24} color={colors.accent} />
            )}
          </TouchableOpacity>
        </View>

        {/* Panel inferior */}
        <View style={{ padding: 16, gap: 10, backgroundColor: colors.surface }}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            {!pin
              ? t("tapMapGps")
              : nearest
                ? `${t("nearBranch")}: ${nearest.branch.name} (${nearest.km.toFixed(1)} km). ${t("dragPinAdjust")}`
                : t("dragPin")}
          </Text>

          <TouchableOpacity
            disabled={!pin}
            onPress={() => pin && onConfirm(pin)}
            style={{
              backgroundColor: pin ? colors.accent : colors.border,
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 15 }}>
              {t("confirmLocation")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
