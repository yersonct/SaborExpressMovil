import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';

// 🔥 IMPORTAMOS EL CONTEXTO GLOBAL DEL CAJERO
import { useCashierContext } from '../../features/cashier/context/CashierContext';
// 🔥 IMPORTAMOS LAS TRADUCCIONES
import { TRANSLATIONS, LanguageCode } from '../../locales/CashierTranslations';
import { useMyProfile } from '@/features/employees/hooks/useMyProfile';
import { InitialsAvatar } from '@/features/shared/components/InitialsAvatar';

export default function CashierProfile() {
  // 🔥 Consumimos el contexto global
  const { language, isDark } = useCashierContext();
  const t = TRANSLATIONS[language as LanguageCode] || TRANSLATIONS['es'];

  // 🔥 PALETA DE COLORES DINÁMICA
  const colors = {
    background: isDark ? '#0F172A' : '#F8FAFC',
    card: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#F8FAFC' : '#1E293B',
    muted: isDark ? '#94A3B8' : '#64748B',
    border: isDark ? '#334155' : '#E2E8F0',
    inputBg: isDark ? '#0F172A' : '#F8FAFC',
    inputDisabled: isDark ? '#334155' : '#F1F5F9',
    accent: '#EA1D2C', // Rojo de la marca SaborExpress
  };

  const { profile, loading, error, updateProfile } = useMyProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    phone: '',
  });

  const [errors, setErrors] = useState({ name: '' });

  // Sincroniza el formulario cuando llegan los datos reales del backend
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name ?? '',
        lastName: profile.lastName ?? '',
        phone: profile.phone ?? '',
      });
    }
  }, [profile]);

  const handleChangeText = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (field in errors && errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      setErrors({ name: 'El nombre es obligatorio.' });
      return;
    }
    if (formData.name.trim().length < 3) {
      setErrors({ name: 'El nombre debe tener al menos 3 caracteres.' });
      return;
    }
    setErrors({ name: '' });
    setSaving(true);
    try {
      await updateProfile({
        name: formData.name.trim(),
        lastName: formData.lastName.trim() || undefined,
        phone: formData.phone.trim() || undefined,
      });
      setIsEditing(false);
      Alert.alert('¡Perfil Actualizado!', 'Tus datos han sido guardados correctamente.');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo guardar tu perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
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
          styles.topHeader,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t.tabProfile || "Mi Perfil"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* MÉTRICAS */}
        <View style={styles.metricsSection}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            Rendimiento de Hoy
          </Text>
          <View style={styles.metricsRow}>
            <View
              style={[
                styles.metricCard,
                {
                  backgroundColor: colors.card,
                  shadowColor: isDark ? "#000" : "#E2E8F0",
                },
              ]}
            >
              <Ionicons name="cash-outline" size={28} color="#10B981" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {profile?.paymentsCollectedToday ?? 0}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.muted }]}>
                Cobros Realizados
              </Text>
            </View>
            <View
              style={[
                styles.metricCard,
                {
                  backgroundColor: colors.card,
                  shadowColor: isDark ? "#000" : "#E2E8F0",
                },
              ]}
            >
              <Ionicons name="wallet-outline" size={28} color="#3B82F6" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                ${(profile?.amountCollectedToday ?? 0).toLocaleString("es-CO")}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.muted }]}>
                Recaudado
              </Text>
            </View>
          </View>
        </View>

        {/* CABECERA DE PERFIL */}
        <View
          style={[
            styles.headerCard,
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
              size={90}
            />
          </View>

          <Text style={[styles.name, { color: colors.text }]}>
            {profile?.name} {profile?.lastName ?? ""}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>CAJA REGISTRADORA</Text>
          </View>
        </View>

        {/* DATOS EDITABLES */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>
              Mis Datos
            </Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Text style={styles.editButtonText}>
                {isEditing ? "Cancelar" : "Editar"}
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
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>
                Nombre completo
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
                    color: colors.muted,
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

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>
                Apellido
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
                    color: colors.muted,
                  },
                ]}
                value={formData.lastName}
                onChangeText={(text) => handleChangeText("lastName", text)}
                editable={isEditing}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>
                Correo Electrónico
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputDisabled,
                    borderColor: colors.border,
                    color: colors.muted,
                  },
                ]}
                value={profile?.email ?? "No disponible"}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>
                Teléfono móvil
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
                    color: colors.muted,
                  },
                ]}
                value={formData.phone}
                onChangeText={(text) => handleChangeText("phone", text)}
                keyboardType="phone-pad"
                editable={isEditing}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>
                Sede
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputDisabled,
                    borderColor: colors.border,
                    color: colors.muted,
                  },
                ]}
                value={profile?.branchName ?? "Sin sede asignada"}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>
                Rol
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputDisabled,
                    borderColor: colors.border,
                    color: colors.muted,
                  },
                ]}
                value="Cajero"
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
                {saving ? "Guardando..." : "Guardar"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  container: { padding: 20, paddingBottom: 40 },
  
  headerCard: { alignItems: 'center', padding: 25, borderRadius: 20, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginBottom: 25 },
  avatarContainer: { marginBottom: 15 },
  name: { fontSize: 24, fontWeight: '900', marginBottom: 5 },
  roleBadge: { backgroundColor: 'rgba(234, 29, 44, 0.1)', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#EA1D2C' },
  roleText: { color: '#EA1D2C', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  profileSection: { marginBottom: 25 },
  profileHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  editButtonText: { color: '#EA1D2C', fontSize: 16, fontWeight: 'bold' },
  profileCard: { padding: 20, borderRadius: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 2 },
  
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 5 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 5, fontWeight: '600' },

  saveButton: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  metricsSection: { marginBottom: 25 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metricCard: { width: '48%', padding: 20, borderRadius: 20, alignItems: 'center', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 2 },
  metricValue: { fontSize: 28, fontWeight: '900', marginTop: 10, marginBottom: 2 },
  metricLabel: { fontSize: 12, fontWeight: '600' },
});