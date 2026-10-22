import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useDeliveryContext } from "./context/DeliveryContext";
import { getDeliveryTheme } from "./context/deliveryTheme";
import {
  TRANSLATIONS,
  LanguageCode,
} from "../../../locales/DeliveryTranslations";
import { useMyProfile } from "@/features/employees/hooks/useMyProfile";
import { InitialsAvatar } from "@/features/shared/components/InitialsAvatar";
import { translateMobileCopy } from "../../../locales/mobileCopy";
import { deferEffect } from "@/features/shared/utils/deferEffect";
import { validateEmployeeProfile } from "@/features/employees/utils/validateEmployeeProfile";

export const DeliveryProfileView = () => {
  const { language, isDark } = useDeliveryContext();
  const t = TRANSLATIONS[language as LanguageCode] || TRANSLATIONS["es"];
  const { profile, loading, updateProfile } = useMyProfile();

  const colors = getDeliveryTheme(isDark);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    phone: "",
  });
  const [errors, setErrors] = useState({ name: "", lastName: "", phone: "" });

  // Sincroniza el formulario cuando llegan los datos reales del backend
  useEffect(() => deferEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name ?? "",
        lastName: profile.lastName ?? "",
        phone: profile.phone ?? "",
      });
    }
  }), [profile]);

  const handleChangeText = (field: keyof typeof formData, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const handleSaveProfile = async () => {
    const nextErrors = validateEmployeeProfile(
      formData.name,
      formData.lastName,
      formData.phone,
    );
    setErrors({
      name: nextErrors.name ?? "",
      lastName: nextErrors.lastName ?? "",
      phone: nextErrors.phone ?? "",
    });
    if (Object.values(nextErrors).some(Boolean)) return;

    try {
      await updateProfile({
        name: formData.name,
        lastName: formData.lastName || undefined,
        phone: formData.phone || undefined,
      });
      setIsEditing(false);
      Alert.alert(
        t.profileUpdated || "¡Perfil Actualizado!",
        t.profileUpdatedDesc || "Tus datos han sido guardados correctamente.",
      );
    } catch {
      Alert.alert(
        t.errorTitle || "Error",
        t.profileSaveError,
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        edges={["top"]}
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
      edges={["top"]}
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
            {t.todayPerformance || translateMobileCopy("Mi Desempeño")}
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
                {t.trips || translateMobileCopy("Viajes")}
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
                {t.rating || translateMobileCopy("Calificación")}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t.profileDataTitle}
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
          {t.fullName || translateMobileCopy("Nombre completo")}
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
                maxLength={120}
              />
              {errors.name ? (
                <Text style={styles.errorText}>{translateMobileCopy(errors.name)}</Text>
              ) : null}
            </View>

            {/* Apellido */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
          {t.lastName || translateMobileCopy("Apellido")}
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
                  errors.lastName ? styles.inputError : null,
                ]}
                value={formData.lastName}
                onChangeText={(text) => handleChangeText("lastName", text)}
                editable={isEditing}
                maxLength={80}
              />
              {errors.lastName ? (
                <Text style={styles.errorText}>{translateMobileCopy(errors.lastName)}</Text>
              ) : null}
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
          {t.mobilePhone || translateMobileCopy("Teléfono móvil")}
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
                  errors.phone ? styles.inputError : null,
                ]}
                value={formData.phone}
                onChangeText={(text) => handleChangeText("phone", text.replace(/\D/g, "").slice(0, 10))}
                keyboardType="phone-pad"
                maxLength={10}
                editable={isEditing}
              />
              {errors.phone ? (
                <Text style={styles.errorText}>{translateMobileCopy(errors.phone)}</Text>
              ) : null}
            </View>
            {/* Sede: siempre bloqueado, viene del backend */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                {t.branchLabel}
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
                {t.roleLabel}
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
    paddingHorizontal: 20,
    paddingVertical: 14,
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
