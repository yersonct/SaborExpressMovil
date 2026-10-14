import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useMyProfile } from "@/features/employees/hooks/useMyProfile";
import { employeeService } from "@/features/employees/services/employeeService";
import { LanguageDropdown } from "@/components/LanguageDropdown";
import { showAppAlert } from "@/features/shared/services/alertEvents";
import { useDeliveryContext } from "./context/DeliveryContext";
import { getDeliveryTheme } from "./context/deliveryTheme";
import {
  TRANSLATIONS,
  LanguageCode,
} from "../../../locales/DeliveryTranslations";

export const DeliverySettingsView = () => {
  const router = useRouter();
  const {
    language,
    setLanguage,
    isDark,
    setIsDark,
    soundNotifications,
    setSoundNotifications,
    pushNotifications,
    setPushNotifications,
    vibrationNotifications,
    setVibrationNotifications,
    preferencesHydrated,
  } = useDeliveryContext();
  const t = TRANSLATIONS[language] || TRANSLATIONS.es;
  const { profile, refetch: refetchProfile } = useMyProfile();
  const [isOnline, setIsOnline] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);

  useEffect(() => {
    if (profile) setIsOnline(profile.isAvailable);
  }, [profile]);

  const handleToggleOnline = async (value: boolean) => {
    if (!profile || savingAvailability) return;
    const previousValue = isOnline;
    setIsOnline(value);
    setSavingAvailability(true);
    try {
      await employeeService.setAvailability(value);
      await refetchProfile();
    } catch (err: any) {
      setIsOnline(previousValue);
      Alert.alert(
        t.errorTitle || "Error",
        err?.message ?? t.availabilitySaveError,
      );
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleToggleVibration = (enabled: boolean) => {
    setVibrationNotifications(enabled);
    if (enabled && Platform.OS !== "web") Vibration.vibrate([0, 100]);
  };

  const languageOptions = [
    { label: "Español", value: "es" },
    { label: "English", value: "en" },
    { label: "Português", value: "pt" },
    { label: "Français", value: "fr" },
  ];

  const colors = getDeliveryTheme(isDark);

  const { handleLogout } = useAuth();

  const executeLogout = async () => {
    try {
      await handleLogout();
    } finally {
      router.replace("/");
    }
  };

  const onLogoutPress = () => {
    showAppAlert(t.logoutBtn, t.logoutConfirmation, [
      { text: t.cancelBtn, style: "cancel" },
      { text: t.logoutBtn, style: "destructive", onPress: executeLogout },
    ]);
  };

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
          {t.settingsTitle || "Configuración"}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
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
                    {!profile
                      ? t.loadingProfile
                      : isOnline
                        ? t.onlineDesc
                        : t.offlineDesc}
                  </Text>
                </View>
              </View>
              <Switch
                value={isOnline}
                onValueChange={handleToggleOnline}
                disabled={savingAvailability || !profile}
                trackColor={{ false: colors.border, true: colors.successText }}
                thumbColor="#FFFFFF"
              />
            </View>
            {savingAvailability && (
              <ActivityIndicator
                style={{ marginBottom: 14 }}
                size="small"
                color={colors.accent}
              />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>
            {t.notificationsTitle}
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
                  name="notifications-outline"
                  size={23}
                  color={colors.text}
                />
                <View style={styles.textGroup}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    {t.orderAlertsTitle}
                  </Text>
                  <Text style={[styles.settingDesc, { color: colors.mutedText }]}>
                    {t.orderAlertsDesc}
                  </Text>
                </View>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                disabled={!preferencesHydrated}
                trackColor={{ false: colors.border, true: colors.successText }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="volume-high-outline" size={23} color={colors.text} />
                <View style={styles.textGroup}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    {t.soundNotifications}
                  </Text>
                  <Text style={[styles.settingDesc, { color: colors.mutedText }]}>
                    {t.soundNotificationsDesc}
                  </Text>
                </View>
              </View>
              <Switch
                value={soundNotifications}
                onValueChange={setSoundNotifications}
                disabled={!preferencesHydrated}
                trackColor={{ false: colors.border, true: colors.successText }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="phone-portrait-outline" size={23} color={colors.text} />
                <View style={styles.textGroup}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    {t.vibrationNotifications}
                  </Text>
                  <Text style={[styles.settingDesc, { color: colors.mutedText }]}>
                    {t.vibrationNotificationsDesc}
                  </Text>
                </View>
              </View>
              <Switch
                value={vibrationNotifications}
                onValueChange={handleToggleVibration}
                disabled={!preferencesHydrated}
                trackColor={{ false: colors.border, true: colors.successText }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>
            {t.orderSyncTitle}
          </Text>
          <View
            style={[
              styles.card,
              styles.syncCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name="cloud-done-outline" size={24} color={colors.accent} />
            <Text style={[styles.settingDesc, styles.syncDescription, { color: colors.mutedText }]}>
              {t.orderSyncDescription}
            </Text>
          </View>
        </View>

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
                  colors={colors}
                />
              </View>
            </View>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon-outline" size={24} color={colors.text} />
                <View style={styles.textGroup}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    {t.darkMode}
                  </Text>
                  <Text style={[styles.settingDesc, { color: colors.mutedText }]}>
                    {t.darkModeDesc}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={setIsDark}
                trackColor={{ false: colors.border, true: colors.successText }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.accent, shadowColor: colors.accent }]}
          onPress={onLogoutPress}
        >
          <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>{t.logoutBtn}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  card: { borderRadius: 18, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1 },
  syncCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  syncDescription: { flex: 1, lineHeight: 19 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  textGroup: { marginLeft: 15, flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  settingDesc: { fontSize: 13 },
  divider: { height: 1 },
  logoutButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#E61C24', paddingVertical: 14, borderRadius: 16, marginTop: 4, shadowColor: '#E61C24', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  logoutButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }
});
