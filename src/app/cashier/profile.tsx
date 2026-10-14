import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';

// 🔥 IMPORTAMOS EL CONTEXTO GLOBAL DEL CAJERO
import { useCashierContext } from '../../features/cashier/context/CashierContext';
// 🔥 IMPORTAMOS LAS TRADUCCIONES
import { TRANSLATIONS, LanguageCode } from '../../locales/CashierTranslations';
import { useMyProfile } from '@/features/employees/hooks/useMyProfile';
import { InitialsAvatar } from '@/features/shared/components/InitialsAvatar';

export default function CashierProfile() {
  const { width: screenWidth } = useWindowDimensions();
  const isNarrowScreen = screenWidth < 380;
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
    accent: '#E61C24', // Rojo de la marca SaborExpress
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
      setErrors({ name: t.nameRequired });
      return;
    }
    if (formData.name.trim().length < 3) {
      setErrors({ name: t.nameMinChars });
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
      Alert.alert(t.profileUpdatedTitle, t.profileUpdatedMessage);
    } catch (err: any) {
      Alert.alert(t.errorTitle, err?.message ?? t.profileSaveError);
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
            {t.cashierPerformanceToday}
          </Text>
          <View
            style={[
              styles.metricsRow,
              isNarrowScreen && { flexDirection: 'column', gap: 12 },
            ]}
          >
            <View
              style={[
                styles.metricCard,
                isNarrowScreen && { width: '100%', padding: 16 },
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
                {t.cashierPaymentsCollected}
              </Text>
            </View>
            <View
              style={[
                styles.metricCard,
                isNarrowScreen && { width: '100%', padding: 16 },
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
                {t.cashierAmountCollected}
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
            <Text style={styles.roleText}>{t.cashierBadge}</Text>
          </View>
        </View>

        {/* DATOS EDITABLES */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>
              {t.myData}
            </Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Text style={styles.editButtonText}>
                {isEditing ? t.cancel : t.edit}
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
                {t.fullName}
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
                {t.lastName}
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
                {t.email}
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
                value={profile?.email ?? t.profileNotAvailable}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>
                {t.mobilePhone}
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
                {t.branch}
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
                value={profile?.branchName ?? t.noBranch}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>
                {t.cashierRole}
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
                value={t.cashierRole}
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
                {saving ? t.saving : t.save}
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
  roleBadge: { backgroundColor: 'rgba(230, 28, 36, 0.1)', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#E61C24' },
  roleText: { color: '#E61C24', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  profileSection: { marginBottom: 25 },
  profileHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  editButtonText: { color: '#E61C24', fontSize: 16, fontWeight: 'bold' },
  profileCard: { padding: 20, borderRadius: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 2 },
  
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 5 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
  inputError: { borderColor: '#E61C24' },
  errorText: { color: '#E61C24', fontSize: 12, marginTop: 5, fontWeight: '600' },

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
