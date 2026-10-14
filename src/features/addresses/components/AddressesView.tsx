import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useClientPreferences, useClientThemedStyles } from "@/features/userPreferences/context/ClientPreferencesContext";
import { getCustomerIdFromToken } from "@/features/auth/services/decodeToken";
import { useAddresses } from "../hooks/useAddresses";
import type { Address } from "../types/address.types";

export default function AddressesView() {
  const styles = useClientThemedStyles(baseStyles);
  const { colors, t } = useClientPreferences();
  const router = useRouter();
  const { user } = useAuth();
  const customerId = user?.token ? getCustomerIdFromToken(user.token) : null;

  const {
    addresses,
    loading,
    error,
    createAddress,
    setDefaultAddress,
    deleteAddress,
  } = useAddresses(customerId);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [addressLine, setAddressLine] = useState("");
  const [reference, setReference] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locatingGps, setLocatingGps] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const resetForm = () => {
    setAddressLine("");
    setReference("");
    setLatitude(null);
    setLongitude(null);
    setIsDefault(true); // la última dirección creada pasa a ser la predeterminada
    setFormError("");
  };

  const openForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleUseCurrentLocation = async () => {
    setFormError("");
    setLocatingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setFormError(
          t("locationPermission"),
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);

      // Rellena el texto automáticamente a partir del GPS, pero el cliente
      // puede seguir editándolo si quiere aclarar algo (ej. número de apto).
      const [place] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      if (place && !addressLine) {
        const parts = [place.street, place.name, place.city].filter(Boolean);
        setAddressLine(parts.join(", "));
      }
    } catch (err) {
      setFormError(t("locationFetchError"));
    } finally {
      setLocatingGps(false);
    }
  };

  const handleSave = async () => {
    if (!addressLine.trim()) {
      setFormError(t("addressRequired"));
      return;
    }
    if (latitude === null || longitude === null) {
      setFormError(
        t("captureAddressLocation"),
      );
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      await createAddress({
        addressLine: addressLine.trim(),
        reference: reference.trim() || undefined,
        latitude,
        longitude,
        isDefault,
      });
      setIsFormOpen(false);
    } catch (err: any) {
      setFormError(err?.message ?? t("addressSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (address: Address) => {
    try {
      await setDefaultAddress(address.id);
    } catch (err: any) {
      Alert.alert(t("error"), err?.message ?? t("addressUpdateError"));
    }
  };

  const handleDelete = (address: Address) => {
    Alert.alert(
      t("deleteAddressTitle"),
      `${t("deleteAddressConfirm")}\n${address.addressLine}`,
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAddress(address.id);
            } catch (err: any) {
              Alert.alert(t("error"), err?.message ?? t("addressDeleteError"));
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("addressesTitle")}</Text>
        <TouchableOpacity style={styles.addButton} onPress={openForm}>
          <Ionicons name="add" size={26} color="#E61C24" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#E61C24" />
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="location-outline" size={56} color="#CBD5E1" />
          <Text style={styles.emptyText}>{t("emptyAddresses")}</Text>
          <TouchableOpacity style={styles.emptyAddButton} onPress={openForm}>
            <Text style={styles.emptyAddButtonText}>{t("newAddress")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {addresses.map((address) => (
            <View key={address.id} style={styles.addressCard}>
              <View style={styles.addressCardTop}>
                <Ionicons name="location" size={22} color="#E61C24" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.addressLine}>{address.addressLine}</Text>
                  {address.reference ? (
                    <Text style={styles.addressReference}>
                      {address.reference}
                    </Text>
                  ) : null}
                </View>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>{t("defaultAddress")}</Text>
                  </View>
                )}
              </View>

              <View style={styles.addressActions}>
                {!address.isDefault && (
                  <TouchableOpacity onPress={() => handleSetDefault(address)}>
                    <Text style={styles.actionLink}>{t("setDefault")}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleDelete(address)}>
                  <Text style={[styles.actionLink, styles.deleteLink]}>
                    {t("deleteAddress")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* FORMULARIO: NUEVA DIRECCIÓN */}
      <Modal
        visible={isFormOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsFormOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("newAddress")}</Text>
              <TouchableOpacity onPress={() => setIsFormOpen(false)}>
                <Ionicons name="close" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>{t("addressField")}</Text>
              <TextInput
                style={styles.input}
                value={addressLine}
                onChangeText={setAddressLine}
                placeholder={t("streetPlaceholder")}
              />

              <Text style={styles.inputLabel}>{t("reference")}</Text>
              <TextInput
                style={styles.input}
                value={reference}
                onChangeText={setReference}
                placeholder={t("referencePlaceholder")}
              />

              <TouchableOpacity
                style={[
                  styles.locationButton,
                  latitude !== null && styles.locationButtonCaptured,
                ]}
                onPress={handleUseCurrentLocation}
                disabled={locatingGps}
              >
                {locatingGps ? (
                  <ActivityIndicator size="small" color="#E61C24" />
                ) : (
                  <Ionicons
                    name={latitude !== null ? "checkmark-circle" : "locate"}
                    size={20}
                    color={latitude !== null ? "#10B981" : "#E61C24"}
                  />
                )}
                <Text
                  style={[
                    styles.locationButtonText,
                    latitude !== null && styles.locationButtonTextCaptured,
                  ]}
                >
                  {locatingGps
                    ? "Obteniendo ubicación..."
                    : latitude !== null
                      ? "Ubicación capturada"
                      : t("useGps")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setIsDefault(!isDefault)}
              >
                <Ionicons
                  name={isDefault ? "checkbox" : "square-outline"}
                  size={22}
                  color="#E61C24"
                />
                <Text style={styles.checkboxLabel}>
                  {t("setDefault")}
                </Text>
              </TouchableOpacity>

              {formError ? (
                <Text style={styles.errorText}>{formError}</Text>
              ) : null}

              <TouchableOpacity
                style={[styles.saveButton, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? t("savingAddress") : t("saveAddress")}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: Platform.OS === "android" ? 40 : 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1E293B" },
  addButton: { padding: 4 },

  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    color: "#94A3B8",
    marginTop: 12,
    fontSize: 15,
    textAlign: "center",
  },
  emptyAddButton: {
    marginTop: 20,
    backgroundColor: "#E61C24",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyAddButtonText: { color: "#FFF", fontWeight: "bold" },

  list: { padding: 20, gap: 12 },
  addressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  addressCardTop: { flexDirection: "row", alignItems: "flex-start" },
  addressLine: { fontSize: 15, fontWeight: "bold", color: "#1E293B" },
  addressReference: { fontSize: 13, color: "#64748B", marginTop: 2 },
  defaultBadge: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#10B981",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  defaultBadgeText: { fontSize: 10, fontWeight: "bold", color: "#059669" },

  addressActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  actionLink: { fontSize: 13, fontWeight: "bold", color: "#3B82F6" },
  deleteLink: { color: "#EF4444" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#1E293B" },

  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1E293B",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  checkboxLabel: { fontSize: 14, color: "#1E293B" },

  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 12,
  },
  locationButtonCaptured: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  locationButtonText: { fontSize: 14, fontWeight: "bold", color: "#E61C24" },
  locationButtonTextCaptured: { color: "#059669" },

  errorText: {
    color: "#EF4444",
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
  },

  saveButton: {
    backgroundColor: "#E61C24",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  saveButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
});
