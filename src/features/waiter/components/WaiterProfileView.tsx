import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { profileStyles as styles } from "./style/ProfileStyles";
import { useWaiterTheme } from "@/features/waiter/context/WaiterThemeContext";
import { useWaiterLanguage } from "@/features/waiter/context/WaiterLanguageContext";
import { useMyProfile } from "@/features/employees/hooks/useMyProfile";
import { InitialsAvatar } from "@/features/shared/components/InitialsAvatar";

export const WaiterProfileView = () => {
  const { colors } = useWaiterTheme();
  const { t } = useWaiterLanguage();
  const { profile, loading, error, updateProfile } = useMyProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setLastName(profile.lastName ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setNameError(t.profileNameErrorRequired || "El nombre es obligatorio.");
      return;
    }
    if (name.trim().length < 3) {
      setNameError(
        t.profileNameErrorMin || "El nombre debe tener al menos 3 caracteres.",
      );
      return;
    }
    setNameError("");
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setIsEditing(false);
      Alert.alert(
        t.profileUpdatedTitle || "¡Perfil Actualizado!",
        t.profileUpdatedMessage ||
          "Tus datos han sido guardados correctamente.",
      );
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "No se pudo actualizar el perfil.");
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
        <Ionicons name="alert-circle-outline" size={48} color="#E61C24" />
        <Text
          style={{ color: colors.text, marginTop: 12, textAlign: "center" }}
        >
          {error || "No se pudo cargar tu perfil"}
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
              <Ionicons name="receipt" size={28} color="#3B82F6" />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {profile.tablesAttendedToday}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>
                {t.profileStatsTables || "Mesas Atendidas"}
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
              <Text style={[styles.editButtonText, { color: colors.accent }]}>
                {isEditing ? t.profileCancel || "Cancelar" : t.profileEdit || "Editar"}
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
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                  !isEditing && styles.inputDisabled,
                  nameError ? styles.inputError : null,
                ]}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setNameError("");
                }}
                editable={isEditing}
              />
              {nameError ? (
                <Text style={styles.errorText}>{nameError}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                {t.profileLastNameLabel || "Apellido"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                  !isEditing && styles.inputDisabled,
                ]}
                value={lastName}
                onChangeText={setLastName}
                editable={isEditing}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                {t.profilePhoneLabel || "Teléfono"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                  !isEditing && styles.inputDisabled,
                ]}
                value={phone}
                onChangeText={setPhone}
                editable={isEditing}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                {t.profileEmailLabel || "Correo Electrónico"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                  styles.inputDisabled,
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
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                  styles.inputDisabled,
                ]}
                value={profile.branchName ?? "Sin sede asignada"}
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
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                  styles.inputDisabled,
                ]}
                value="Mesero"
                editable={false}
              />
            </View>
          </View>

          {isEditing && (
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.accent }]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? "Guardando..." : t.profileSave || "Guardar"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
