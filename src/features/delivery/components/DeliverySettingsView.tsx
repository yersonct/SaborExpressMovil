import React from "react";
import {
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
import { LanguageDropdown } from "@/components/LanguageDropdown";
import { showAppAlert } from "@/features/shared/services/alertEvents";
import { useDeliveryContext } from "./context/DeliveryContext";
import { getDeliveryTheme } from "./context/deliveryTheme";
import {
  TRANSLATIONS,
  LanguageCode,
} from "../../../locales/DeliveryTranslations";


const PUSH_STATUS_COPY = {
  es: { unavailable: "Para recibir alertas con la app cerrada, instala una APK o un development build.", denied: "Habilita las notificaciones en Ajustes de Android > Aplicaciones > SaborExpress.", error: "No se pudo registrar el teléfono; se reintentará al reconectar.", checking: "Comprobando el registro de notificaciones remotas...", save: "No se pudieron guardar las preferencias de reparto en este dispositivo." },
  en: { unavailable: "Background alerts require an APK or development build.", denied: "Enable notifications in Android Settings > Apps > SaborExpress.", error: "Phone registration failed; it will retry after reconnecting.", checking: "Checking remote notification registration...", save: "Delivery preferences could not be saved on this device." },
  pt: { unavailable: "Alertas em segundo plano exigem APK ou build de desenvolvimento.", denied: "Ative as notificações em Configurações do Android > Apps > SaborExpress.", error: "Falha ao registrar o telefone; nova tentativa ao reconectar.", checking: "Verificando registro de notificações remotas...", save: "Não foi possível salvar as preferências de entrega neste dispositivo." },
  fr: { unavailable: "Les alertes en arrière-plan nécessitent un APK ou une version de développement.", denied: "Activez les notifications dans Paramètres Android > Applications > SaborExpress.", error: "Impossible d’enregistrer le téléphone; nouvel essai après reconnexion.", checking: "Vérification des notifications distantes...", save: "Impossible d’enregistrer les préférences de livraison sur cet appareil." },
} as const;

// En web, RN usa una perilla verde al encender; la forzamos a blanco.
const switchWebProps = { activeThumbColor: "#FFFFFF" } as object;

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
    preferencesError,
    pushStatus,
  } = useDeliveryContext();
  const t = TRANSLATIONS[language] || TRANSLATIONS.es;
  const pushCopy = PUSH_STATUS_COPY[language] || PUSH_STATUS_COPY.es;
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
        {preferencesError && (
          <Text accessibilityRole="alert" style={{ color: "#B91C1C", backgroundColor: "#FEE2E2", padding: 12, borderRadius: 10, marginBottom: 12 }}>
            {pushCopy.save}
          </Text>
        )}
        {pushNotifications && pushStatus !== "enabled" && (
          <Text accessibilityRole="alert" style={{ color: colors.mutedText, marginBottom: 12, lineHeight: 20 }}>
            {pushStatus === "unavailable" ? pushCopy.unavailable
              : pushStatus === "permission-denied" ? pushCopy.denied
              : pushStatus === "error" ? pushCopy.error
              : pushCopy.checking}
          </Text>
        )}
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
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF" {...switchWebProps}
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
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF" {...switchWebProps}
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
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF" {...switchWebProps}
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
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF" {...switchWebProps}
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
