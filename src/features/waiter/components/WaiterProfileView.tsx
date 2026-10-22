import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { profileStyles as styles } from "./style/ProfileStyles";
import { useWaiterTheme } from "@/features/waiter/context/WaiterThemeContext";
import { useWaiterLanguage } from "@/features/waiter/context/WaiterLanguageContext";
import { useMyProfile } from "@/features/employees/hooks/useMyProfile";
import { InitialsAvatar } from "@/features/shared/components/InitialsAvatar";
import { showAppAlert } from "@/features/shared/services/alertEvents";
import { translateMobileCopy } from "../../../locales/mobileCopy";
import { deferEffect } from "@/features/shared/utils/deferEffect";
import { validateEmployeeProfile } from "@/features/employees/utils/validateEmployeeProfile";

export const WaiterProfileView = () => {
  const { colors } = useWaiterTheme();
  const { t } = useWaiterLanguage();
  const { profile, loading, error, updateProfile, refetch } = useMyProfile();
  const hasReceivedInitialFocus = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasReceivedInitialFocus.current) {
        hasReceivedInitialFocus.current = true;
        return;
      }
      void refetch();
    }, [refetch]),
  );
  const inputColors = (editable: boolean) => ({
    backgroundColor: editable ? colors.surface : colors.elevatedSurface,
    color: editable ? colors.text : colors.mutedText,
    borderColor: colors.border,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({ name: "", lastName: "", phone: "" });

  useEffect(() => deferEffect(() => {
    if (profile) {
      setName(profile.name);
      setLastName(profile.lastName ?? "");
      setPhone(profile.phone ?? "");
    }
  }), [profile]);

  const handleSaveProfile = async () => {
    const nextErrors = validateEmployeeProfile(name, lastName, phone);
    setErrors({
      name: nextErrors.name ?? "",
      lastName: nextErrors.lastName ?? "",
      phone: nextErrors.phone ?? "",
    });
    if (Object.values(nextErrors).some(Boolean)) return;
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setIsEditing(false);
      showAppAlert(
        t.profileUpdatedTitle || "¡Perfil Actualizado!",
        t.profileUpdatedMessage ||
          "Tus datos han sido guardados correctamente.",
      );
    } catch (err: any) {
      showAppAlert(t.profileErrorTitle || "Error", err?.message ?? t.profileSaveError);
    } finally {
      setSaving(false);
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

  if (error || !profile) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          },
        ]}
      >
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text
          style={{ color: colors.text, marginTop: 12, textAlign: "center" }}
        >
          {error || t.profileLoadError}
        </Text>
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
          { backgroundColor: colors.header, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t.profileTitle || "Mi Perfil"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* DESEMPEÑO DEL TURNO */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t.profilePerformanceTitle || "Desempeño del Turno"}
          </Text>
          <View
            style={[
              styles.statsCard,
              {
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.statColumn}>
              <Ionicons name="receipt" size={28} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {profile.tablesAttendedToday}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>
                {t.profileStatsTables || translateMobileCopy("Mesas Atendidas")}
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.statColumn}>
              <Ionicons name="bag-handle-outline" size={28} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {profile.toGoOrdersToday}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>
                {t.profileStatsToGo || "Pedidos para llevar hoy"}
              </Text>
            </View>
          </View>
        </View>

        {/* MIS DATOS */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t.profileDataTitle || "Mis Datos"}
            </Text>
            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              disabled={saving}
            >
              <Text style={[styles.editButtonText, { color: isEditing ? colors.mutedText : "#3B82F6" }]}>
                {isEditing ? t.profileCancel : t.profileEdit || "Editar"}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.avatarContainer}>
              <InitialsAvatar name={profile.name} lastName={profile.lastName} size={80} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                {t.profileNameLabel || "Nombre"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  !isEditing && styles.inputDisabled,
                  inputColors(isEditing),
                  errors.name ? styles.inputError : null,
                ]}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setErrors((previous) => ({ ...previous, name: "" }));
                }}
                editable={isEditing}
                maxLength={120}
              />
              {errors.name ? (
                <Text style={styles.errorText}>{translateMobileCopy(errors.name)}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                {t.profileLastNameLabel || "Apellido"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  !isEditing && styles.inputDisabled,
                  inputColors(isEditing),
                ]}
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  setErrors((previous) => ({ ...previous, lastName: "" }));
                }}
                editable={isEditing}
                maxLength={80}
              />
              {errors.lastName ? (
                <Text style={styles.errorText}>{translateMobileCopy(errors.lastName)}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                {t.profilePhoneLabel || "Teléfono"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  !isEditing && styles.inputDisabled,
                  inputColors(isEditing),
                ]}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text.replace(/\D/g, "").slice(0, 10));
                  setErrors((previous) => ({ ...previous, phone: "" }));
                }}
                editable={isEditing}
                keyboardType="phone-pad"
                maxLength={10}
              />
              {errors.phone ? (
                <Text style={styles.errorText}>{translateMobileCopy(errors.phone)}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                {t.profileEmailLabel || "Correo Electrónico"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputDisabled,
                  inputColors(false),
                ]}
                value={profile.email ?? "—"}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                {t.profileBranchLabel || "Sede"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputDisabled,
                  inputColors(false),
                ]}
                value={profile.branchName ?? t.profileNoBranch}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                {t.profileRoleLabel || "Rol"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputDisabled,
                  inputColors(false),
                ]}
                value={t.profileRoleWaiter}
                editable={false}
              />
            </View>
          </View>

          {isEditing && (
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.success }]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? t.profileSaving : t.profileSave || "Guardar"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
