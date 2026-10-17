import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../features/auth/context/AuthContext";
import {
  useClientPreferences,
  type ClientLanguage,
} from "../../features/userPreferences/context/ClientPreferencesContext";

// En web, RN usa una perilla verde al encender; la forzamos a blanco.
const switchWebProps = { activeThumbColor: "#FFFFFF" } as object;

// En web, RN usa una perilla verde al encender; la forzamos a blanco.

const languages: Array<{ code: ClientLanguage; label: string }> = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
];

export default function ClientSettingsScreen() {
  const router = useRouter();
  const { handleLogout } = useAuth();
  const {
    settings, language, loading, saving, error, isDark, colors, t,
    updateSettings, updateLanguage,
  } = useClientPreferences();
  const [languageOpen, setLanguageOpen] = useState(false);

  const onLogoutPress = async () => {
    await handleLogout();
    router.replace("/");
  };

  const row = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    description: string,
    value: boolean,
    onChange: (value: boolean) => void,
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Ionicons name={icon} size={23} color={colors.text} />
        <View style={styles.textGroup}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.settingDesc, { color: colors.muted }]}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={loading}
        trackColor={{ false: "#CBD5E1", true: colors.accent }}
        thumbColor="#FFFFFF" {...switchWebProps} {...switchWebProps}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t("settingsTitle")}</Text>
        {saving && <ActivityIndicator size="small" color={colors.accent} />}
      </View>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {loading ? <ActivityIndicator style={styles.loader} size="large" color={colors.accent} /> : (
          <>
              {error && <Text accessibilityRole="alert" style={[styles.error, { color: isDark ? "#FECACA" : "#B91C1C", backgroundColor: isDark ? "#4C2529" : "#FEE2E2" }]}>{error}</Text>}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.muted }]}>{t("notifications")}</Text>
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                {row("notifications-outline", t("orderAlerts"), t("orderAlertsDesc"), settings.pushNotifications, (value) => updateSettings({ pushNotifications: value }))}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                {row("volume-high-outline", t("sounds"), t("soundsDesc"), settings.soundNotifications, (value) => updateSettings({ soundNotifications: value }))}
              </View>
            </View>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.muted }]}>{t("appearance")}</Text>
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                {row("moon-outline", t("darkMode"), t("darkModeDesc"), isDark, (value) => updateSettings({ theme: value ? "dark" : "light" }))}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TouchableOpacity style={styles.languageRow} activeOpacity={0.7} onPress={() => setLanguageOpen(true)}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="language-outline" size={23} color={colors.text} />
                    <View style={styles.textGroup}>
                      <Text style={[styles.settingTitle, { color: colors.text }]}>{t("language")}</Text>
                      <Text style={[styles.settingDesc, { color: colors.muted }]}>{languages.find((item) => item.code === language)?.label}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={20} color={colors.muted} />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={onLogoutPress}>
              <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
              <Text style={styles.logoutButtonText}>{t("logout")}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      <Modal visible={languageOpen} transparent animationType="fade" onRequestClose={() => setLanguageOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setLanguageOpen(false)}>
          <View style={[styles.languageModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t("chooseLanguage")}</Text>
            {languages.map((item) => (
              <TouchableOpacity
                key={item.code}
                style={[styles.languageOption, { borderColor: colors.border }]}
                onPress={() => {
                  setLanguageOpen(false);
                  void updateLanguage(item.code).catch(() => undefined);
                }}
              >
                <Text style={[styles.settingTitle, { color: colors.text }]}>{item.label}</Text>
                {language === item.code && <Ionicons name="checkmark" size={21} color={colors.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: Platform.OS === "android" ? 40 : 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  container: { padding: 20, paddingBottom: 40 },
  loader: { marginTop: 48 },
  error: { color: "#B91C1C", backgroundColor: "#FEE2E2", padding: 12, borderRadius: 10, marginBottom: 16 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 14, fontWeight: "bold", color: "#64748B", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 },
  card: { borderRadius: 20, paddingHorizontal: 20, elevation: 2 },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 18 },
  settingInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  textGroup: { marginLeft: 15, flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 2 },
  settingDesc: { fontSize: 13 },
  divider: { height: 1 },
  languageRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 18 },
  logoutButton: { flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#E61C24", paddingVertical: 16, borderRadius: 16, marginTop: 10, elevation: 5 },
  logoutButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold", marginLeft: 10 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 24 },
  languageModal: { borderRadius: 18, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  languageOption: { minHeight: 50, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth },
});
