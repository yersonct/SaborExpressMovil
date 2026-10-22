import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { usePublicBranches } from "../hooks/usePublicBranches";
import { LeafletMap, type MapMarker } from "./LeafletMap";
import type { MapCircle } from "./leafletShared";
import { useDeliveryCoverage } from "../hooks/useDeliveryCoverage";
import { useClientPreferences } from "@/features/userPreferences/context/ClientPreferencesContext";
import { translateMobileCopy } from "../../../locales/mobileCopy";
import { deferEffect } from "@/features/shared/utils/deferEffect";

type Coords = { latitude: number; longitude: number };

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (coords: Coords, exactAddress?: string) => void;
  initialLocation?: Coords | null;
  savedAddresses?: (Coords & { id: number; addressLine: string })[];
  selectedAddressId?: number | null;
  onChooseSavedAddress?: (id: number) => void;
  saving?: boolean;
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
  savedAddresses = [],
  selectedAddressId = null,
  onChooseSavedAddress,
  saving = false,
}: Props) {
  const { colors, t, language } = useClientPreferences();
  const labels = {
    es: { change: "Cambiar dirección", saved: "Mis direcciones guardadas", newPoint: "Marcar una dirección nueva", address: "Dirección exacta (opcional)", addressHint: "Ej.: Calle 1F #16-36, Neiva", note: "El punto azul determina la cobertura. La dirección escrita identifica el lugar.", choose: "Usar esta dirección", save: "Guardar nueva dirección", saving: "Guardando dirección...", empty: "No hay direcciones guardadas" },
    en: { change: "Change address", saved: "Saved addresses", newPoint: "Mark a new address", address: "Exact address (optional)", addressHint: "Street, number, city", note: "The blue pin determines coverage. Address text identifies the place.", choose: "Use this address", save: "Save new address", saving: "Saving address...", empty: "No saved addresses" },
    pt: { change: "Alterar endereço", saved: "Endereços salvos", newPoint: "Marcar novo endereço", address: "Endereço exato (opcional)", addressHint: "Rua, número e cidade", note: "O pino azul define a cobertura. O texto identifica o local.", choose: "Usar este endereço", save: "Salvar novo endereço", saving: "Salvando endereço...", empty: "Não há endereços salvos" },
    fr: { change: "Changer d'adresse", saved: "Adresses enregistrées", newPoint: "Marquer une nouvelle adresse", address: "Adresse exacte (facultatif)", addressHint: "Rue, numéro, ville", note: "Le point bleu définit la couverture. Le texte identifie le lieu.", choose: "Utiliser cette adresse", save: "Enregistrer l'adresse", saving: "Enregistrement...", empty: "Aucune adresse enregistrée" }
  };
  const copy = labels[(language as keyof typeof labels)] ?? labels.es;
  const { branches } = usePublicBranches();
  const [pin, setPin] = useState<Coords | null>(null);
  const [addressOptionsOpen, setAddressOptionsOpen] = useState(false);
  const [chosenSavedId, setChosenSavedId] = useState<number | null>(null);
  const [exactAddress, setExactAddress] = useState("");
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

  const { radii, loading: coverageLoading } = useDeliveryCoverage(located, visible);

  // Cada vez que se abre, el pin parte de la ubicación actual (si hay)
  useEffect(() => deferEffect(() => {
    if (visible) {
      setPin(initialLocation ?? null);
      setChosenSavedId(selectedAddressId);
      setExactAddress("");
      setAddressOptionsOpen(false);
    }
  }), [visible, initialLocation, selectedAddressId]);

  // Prioriza sedes con cobertura real; si no hay, informa la más cercana.
  const nearest = useMemo(() => {
    if (!pin || located.length === 0) return null;
    const ranked = located.map((b) => ({
      branch: b,
      km: distanceKm(pin, { latitude: Number(b.latitude), longitude: Number(b.longitude) }),
      radiusKm: radii[b.id] ?? null,
    })).sort((a, b) => a.km - b.km);
    const eligible = ranked.find((b) => b.radiusKm != null && b.km <= b.radiusKm);
    return { ...(eligible ?? ranked[0]), inCoverage: !!eligible };
  }, [pin, located, radii]);

  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = located.map((b) => ({
      id: `b${b.id}`,
      latitude: b.latitude as number,
      longitude: b.longitude as number,
      title: b.name,
      description: b.address ?? undefined,
      color: "#E61C24",
      alwaysShowLabel: true,
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

  const circles = useMemo<MapCircle[]>(() => located.flatMap((b) => {
    const radius = radii[b.id];
    return radius != null && radius > 0
      ? [{ latitude: Number(b.latitude), longitude: Number(b.longitude), radiusKm: radius, color: "#E61C24" }]
      : [];
  }), [located, radii]);

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
      setChosenSavedId(null);
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
            circles={circles}
            fitKey={fitKey}
            focus={focus}
            onPress={(c) => {
              setPin(c);
              setChosenSavedId(null);
            }}
            onMarkerDragEnd={(id, c) => {
              if (id === "pin") {
                setPin(c);
                setChosenSavedId(null);
              }
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
        <ScrollView style={{ flexGrow: 0, maxHeight: "55%", backgroundColor: colors.surface }}
          contentContainerStyle={{ padding: 16, gap: 10 }} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            onPress={() => setAddressOptionsOpen((value) => !value)}
            disabled={saving}
            accessibilityRole="button"
            style={{ borderWidth: 1, borderColor: colors.accent, borderRadius: 10,
                     paddingVertical: 10, paddingHorizontal: 12, flexDirection: "row",
                     justifyContent: "space-between", alignItems: "center" }}
          >
            <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 14 }}>
              {copy.change}
            </Text>
            <Ionicons name={addressOptionsOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.accent} />
          </TouchableOpacity>
          {addressOptionsOpen && (
            <View style={{ borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 8, gap: 8 }}>
              <Text style={{ color: colors.text, fontWeight: "700", fontSize: 13 }}>{copy.saved}</Text>
              {savedAddresses.length === 0 ? (
                <Text style={{ color: colors.muted }}>{copy.empty}</Text>
              ) : (
                <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {savedAddresses.map((address) => (
                    <TouchableOpacity
                      key={address.id}
                      accessibilityRole="button"
                      onPress={() => {
                        setPin({ latitude: address.latitude, longitude: address.longitude });
                        setChosenSavedId(address.id);
                        setExactAddress("");
                        setFocus((previous) => ({ latitude: address.latitude, longitude: address.longitude,
                          nonce: (previous?.nonce ?? 0) + 1 }));
                        setAddressOptionsOpen(false);
                      }}
                      style={{ padding: 10, borderRadius: 8, borderBottomWidth: 1, borderColor: colors.border }}
                    >
                      <Text numberOfLines={2} style={{ color: colors.text, fontSize: 13, fontWeight: address.id === chosenSavedId ? "700" : "400" }}>
                        {address.id === chosenSavedId ? "✓  " : ""}{address.addressLine}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  setChosenSavedId(null);
                  setExactAddress("");
                  setAddressOptionsOpen(false);
                }}
                style={{ paddingVertical: 12, paddingHorizontal: 10, backgroundColor: colors.background, borderRadius: 8 }}
              >
                <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 13 }}>
                  + {copy.newPoint}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {chosenSavedId === null && (
            <View style={{ gap: 4 }}>
              <Text style={{ color: colors.text, fontWeight: "600", fontSize: 12 }}>{copy.address}</Text>
              <TextInput
                value={exactAddress}
                onChangeText={setExactAddress}
                placeholder={copy.addressHint}
                placeholderTextColor={colors.muted}
                maxLength={255}
                autoCapitalize="words"
                style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
                  color: colors.text, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14 }}
              />
              <Text style={{ color: colors.muted, fontSize: 11 }}>{copy.note}</Text>
            </View>
          )}
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            {!pin
              ? t("tapMapGps")
              : nearest
                ? coverageLoading
                  ? translateMobileCopy("Consultando zonas de cobertura...")
                  : nearest.inCoverage
                    ? translateMobileCopy("{{branch}}: {{distance}} km en línea recta (radio {{radius}} km). {{adjust}}", { branch: nearest.branch.name, distance: nearest.km.toFixed(1), radius: nearest.radiusKm ?? "", adjust: t("dragPinAdjust") })
                    : translateMobileCopy("Fuera de la zona de entrega. La sede más cercana es {{branch}} ({{distance}} km). Mueve el punto dentro de un círculo.", { branch: nearest.branch.name, distance: nearest.km.toFixed(1) })
                : t("dragPin")}
          </Text>

          <TouchableOpacity
            disabled={!pin || coverageLoading || saving}
            onPress={() => {
              if (!pin || coverageLoading || saving) return;
              if (!nearest?.inCoverage) {
                  Alert.alert(translateMobileCopy("Fuera de cobertura"), translateMobileCopy("Mueve el marcador dentro del círculo de entrega de una sede antes de confirmar."));
                return;
              }
              if (chosenSavedId != null && onChooseSavedAddress) {
                onChooseSavedAddress(chosenSavedId);
              } else {
                onConfirm(pin, exactAddress.trim() || undefined);
              }
            }}
            style={{
              backgroundColor: pin ? colors.accent : colors.border,
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 15 }}>
              {saving ? copy.saving : chosenSavedId != null ? copy.choose : copy.save}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
