import React, { useState, useEffect } from "react";
import { 
  SafeAreaView, 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  TouchableOpacity,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/context/AuthContext';

import { Alert } from "react-native"; // agrégalo al import existente de react-native
import { useMyProfile } from "@/features/employees/hooks/useMyProfile";
import { employeeService } from "@/features/employees/services/employeeService";

// 🔥 IMPORTAMOS EL COMPONENTE DROPDOWN
import { LanguageDropdown } from '@/components/LanguageDropdown';
// 🔥 IMPORTAMOS EL CONTEXTO Y TRADUCCIONES
import { useDeliveryContext } from './context/DeliveryContext';
import { TRANSLATIONS, LanguageCode } from '../../../locales/DeliveryTranslations';

export const DeliverySettingsView = () => {
  const navigation = useNavigation();
  const router = useRouter();

  // 🔥 Leemos el contexto global del Repartidor
  const { language, setLanguage, isDark, setIsDark } = useDeliveryContext();
  const t = TRANSLATIONS[language] || TRANSLATIONS['es'];
  const { profile } = useMyProfile();
  const [isOnline, setIsOnline] = useState(true);
  const [savingAvailability, setSavingAvailability] = useState(false);

  useEffect(() => {
    if (profile) setIsOnline(profile.isAvailable);
  }, [profile]);

  const handleToggleOnline = async (value: boolean) => {
    setIsOnline(value); // optimista
    setSavingAvailability(true);
    try {
      await employeeService.setAvailability(value);
    } catch (err: any) {
      setIsOnline(!value); // revierte si falla
      Alert.alert(
        "Error",
        err?.message ?? "No se pudo actualizar tu disponibilidad.",
      );
    } finally {
      setSavingAvailability(false);
    }
  };

  // Opciones para el Dropdown
  const languageOptions = [
    { label: 'Español', value: 'es' },
    { label: 'English', value: 'en' },
    { label: 'Português', value: 'pt' },
    { label: 'Français', value: 'fr' }
  ];

  // 🔥 PALETA DE COLORES DINÁMICA
  const colors = isDark ? {
    background: '#0F172A', card: '#1E293B', text: '#F8FAFC',
    mutedText: '#94A3B8', border: '#334155', accent: '#EA1D2C', icon: '#CBD5E1'
  } : {
    background: '#F8FAFC', card: '#FFFFFF', text: '#1E293B',
    mutedText: '#64748B', border: '#E2E8F0', accent: '#EA1D2C', icon: '#1E293B'
  };

  const { handleLogout } = useAuth();

  const onLogoutPress = async () => {
    try {
      await handleLogout(); // revoca el token en backend + borra la sesión local
    } finally {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* SECCIÓN: ESTADO DE TRABAJO */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>
            {t.workStatus}
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons
                  name={isOnline ? "radio" : "radio-outline"}
                  size={24}
                  color={isOnline ? "#10B981" : colors.mutedText}
                />
                <View style={styles.textGroup}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    {t.receiveOrders}
                  </Text>
                  <Text
                    style={[styles.settingDesc, { color: colors.mutedText }]}
                  >
                    {isOnline ? t.onlineDesc : t.offlineDesc}
                  </Text>
                </View>
              </View>
              <Switch
                value={isOnline}
                onValueChange={handleToggleOnline}
                disabled={savingAvailability}
                trackColor={{ false: colors.border, true: "#EA1D2C" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* SECCIÓN: NAVEGACIÓN Y APP */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>
            {t.navigationApp}
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {/* 🔥 SELECCIÓN DE IDIOMA */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons
                  name="language-outline"
                  size={24}
                  color={colors.text}
                />
                <View style={styles.textGroup}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    {t.languageTitle}
                  </Text>
                  <Text
                    style={[styles.settingDesc, { color: colors.mutedText }]}
                  >
                    {t.languageDesc}
                  </Text>
                </View>
              </View>
              <View style={{ minWidth: 130 }}>
                <LanguageDropdown
                  label=""
                  compact
                  value={language}
                  options={languageOptions}
                  onChange={(value) => setLanguage(value as LanguageCode)}
                />
              </View>
            </View>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            {/* 🔥 MODO OSCURO */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon-outline" size={24} color={colors.text} />
                <View style={styles.textGroup}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    {t.darkMode}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={setIsDark}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogoutPress}>
          <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>{t.logoutBtn}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 }, // Color dinámico
  container: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }, // Color dinámico
  card: { borderRadius: 20, paddingHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1 }, // Color dinámico
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  textGroup: { marginLeft: 15, flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 }, // Color dinámico
  settingDesc: { fontSize: 13 }, // Color dinámico
  divider: { height: 1 }, // Color dinámico
  logoutButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#E61C24', paddingVertical: 16, borderRadius: 16, marginTop: 10, shadowColor: '#E61C24', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  logoutButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }
});