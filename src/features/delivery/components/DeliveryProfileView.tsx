import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";

import { useDeliveryContext } from "./context/DeliveryContext";
import {
  TRANSLATIONS,
  LanguageCode,
} from "../../../locales/DeliveryTranslations";
import { useMyProfile } from "@/features/employees/hooks/useMyProfile";
import { InitialsAvatar } from "@/features/shared/components/InitialsAvatar";

export const DeliveryProfileView = () => {
  const { language, isDark } = useDeliveryContext();
  const t = TRANSLATIONS[language as LanguageCode] || TRANSLATIONS["es"];
  const { profile, loading, updateProfile } = useMyProfile();

  const colors = isDark
    ? {
        background: "#0F172A",
        card: "#1E293B",
        text: "#F8FAFC",
        mutedText: "#94A3B8",
        border: "#334155",
        accent: "#EA1D2C",
        inputBg: "#0F172A",
        inputDisabled: "#334155",
        icon: "#CBD5E1",
      }
    : {
        background: "#F8FAFC",
        card: "#FFFFFF",
        text: "#1E293B",
        mutedText: "#64748B",
        border: "#E2E8F0",
        accent: "#E61C24",
        inputBg: "#FFFFFF",
        inputDisabled: "#F1F5F9",
        icon: "#1E293B",
      };

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    phone: "",
    vehicle: "",
    plate: "",
  });
  const [errors, setErrors] = useState({ name: "" });

  // Sincroniza el formulario cuando llegan los datos reales del backend
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name ?? "",
        lastName: profile.lastName ?? "",
        phone: profile.phone ?? "",
        vehicle: profile.vehicle ?? "",
        plate: profile.plate ?? "",
      });
    }
  }, [profile]);

  const handleChangeText = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (field in errors && errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleSaveProfile = async () => {
    let isValid = true;
    const newErrors = { name: "" };

    if (!formData.name.trim()) {
      newErrors.name = t.nameRequired || "El nombre es obligatorio.";
      isValid = false;
    }

    setErrors(newErrors);
    if (!isValid) return;

    try {
      await updateProfile({
        name: formData.name,
        lastName: formData.lastName || undefined,
        phone: formData.phone || undefined,
        vehicle: formData.vehicle || undefined,
        plate: formData.plate || undefined,
      });
      setIsEditing(false);
      Alert.alert(
        t.profileUpdated || "¡Perfil Actualizado!",
        t.profileUpdatedDesc || "Tus datos han sido guardados correctamente.",
      );
    } catch {
      Alert.alert(
        t.errorTitle || "Error",
        "No se pudo guardar tu perfil. Intenta de nuevo.",
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t.tabProfile || "Perfil"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.trackingSection}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, marginBottom: 15 },
            ]}
          >
            {t.todayPerformance || "Mi Desempeño"}
          </Text>
          <View
            style={[
              styles.statsCard,
              {
                backgroundColor: colors.card,
                shadowColor: isDark ? "#000" : "#E2E8F0",
              },
            ]}
          >
            <View style={styles.statColumn}>
              <Ionicons name="bicycle" size={28} color="#3B82F6" />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {profile?.tripsCompleted ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>
                {t.trips || "Viajes"}
              </Text>
            </View>
            <View
              style={[
                styles.dividerVertical,
                { backgroundColor: colors.border },
              ]}
            />
            <View style={styles.statColumn}>
              <Ionicons name="star" size={28} color="#F59E0B" />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {profile?.averageRating != null
                  ? profile.averageRating.toFixed(1)
                  : "—"}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>
                {t.rating || "Calificación"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Mis Datos
            </Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Text style={[styles.editButtonText, { color: colors.accent }]}>
                {isEditing ? t.cancel || "Cancelar" : t.edit || "Editar"}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: colors.card,
                shadowColor: isDark ? "#000" : "#E2E8F0",
              },
            ]}
          >
            <View style={styles.avatarContainer}>
              <InitialsAvatar
                name={profile?.name}
                lastName={profile?.lastName}
                size={80}
              />
            </View>

            {/* Nombre */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                {t.fullName || "Nombre completo"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                  !isEditing && {
                    backgroundColor: colors.inputDisabled,
                    color: colors.mutedText,
                  },
                  errors.name ? styles.inputError : null,
                ]}
                value={formData.name}
                onChangeText={(text) => handleChangeText("name", text)}
                editable={isEditing}
              />
              {errors.name ? (
                <Text style={styles.errorText}>{errors.name}</Text>
              ) : null}
            </View>

            {/* Apellido */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                {t.lastName || "Apellido"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                  !isEditing && {
                    backgroundColor: colors.inputDisabled,
                    color: colors.mutedText,
                  },
                ]}
                value={formData.lastName}
                onChangeText={(text) => handleChangeText("lastName", text)}
                editable={isEditing}
              />
            </View>

            {/* Correo: siempre bloqueado, viene del backend */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                {t.emailLabel || "Correo Electrónico"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputDisabled,
                    borderColor: colors.border,
                    color: colors.mutedText,
                  },
                ]}
                value={profile?.email ?? "No disponible"}
                editable={false}
              />
            </View>

            {/* Teléfono */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                {t.mobilePhone || "Teléfono móvil"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                  !isEditing && {
                    backgroundColor: colors.inputDisabled,
                    color: colors.mutedText,
                  },
                ]}
                value={formData.phone}
                onChangeText={(text) => handleChangeText("phone", text)}
                keyboardType="phone-pad"
                editable={isEditing}
              />
            </View>
            {/* Modelo Vehículo */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                {t.vehicleModel || "Modelo del Vehículo"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                  !isEditing && {
                    backgroundColor: colors.inputDisabled,
                    color: colors.mutedText,
                  },
                ]}
                value={formData.vehicle}
                onChangeText={(text) => handleChangeText("vehicle", text)}
                editable={isEditing}
              />
            </View>

            {/* Placa */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                {t.plate || "Placa"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                  !isEditing && {
                    backgroundColor: colors.inputDisabled,
                    color: colors.mutedText,
                  },
                ]}
                value={formData.plate}
                onChangeText={(text) => handleChangeText("plate", text)}
                autoCapitalize="characters"
                editable={isEditing}
              />
            </View>

            {/* Sede: siempre bloqueado, viene del backend */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                Sede
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputDisabled,
                    borderColor: colors.border,
                    color: colors.mutedText,
                  },
                ]}
                value={profile?.branchName ?? "Sin sede asignada"}
                editable={false}
              />
            </View>

            {/* Rol: siempre bloqueado, viene del backend */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                Rol
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputDisabled,
                    borderColor: colors.border,
                    color: colors.mutedText,
                  },
                ]}
                value="Repartidor"
                editable={false}
              />
            </View>

            {/* ⚠️ Vehículo, Placa y Foto de perfil removidos: EmployeeMe (backend)
                no expone esos campos todavía. Ver Paso 5 del plan — pendiente
                decisión de negocio sobre si son requisitos reales. */}
          </View>

          {isEditing && (
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.accent }]}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>{t.save || "Guardar"}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: Platform.OS === "android" ? 40 : 20,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  container: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: "900" },

  profileSection: { marginBottom: 20 },
  profileHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  editButtonText: { fontWeight: "bold", fontSize: 16 },

  profileCard: {
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarContainer: { alignItems: "center", marginBottom: 20 },

  inputGroup: { marginBottom: 15 },
  inputLabel: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputError: { borderColor: "#EF4444" },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 5,
    fontWeight: "600",
  },
  saveButton: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  trackingSection: { marginBottom: 30 },
  statsCard: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    justifyContent: "space-around",
    alignItems: "center",
  },
  statColumn: { alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "bold", marginTop: 8 },
  statLabel: { fontSize: 13, marginTop: 2 },
  dividerVertical: { width: 1, height: 50 },
});
