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
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import { AppAlertModal } from "@/features/shared/components/AppAlertModal";
import { showAppAlert } from "@/features/shared/services/alertEvents";
import { styles } from "../../features/cashier/style/CashierSettingsStyles";
import { TRANSLATIONS } from "../../locales/CashierTranslations";
import type { LanguageCode } from "../../locales/CashierTranslations";
import { useCashierContext } from "../../features/cashier/context/CashierContext";
import { scanPd01Printers, printPd01Test, isPd01Available } from "@/features/printer/pd01Service";
import { loadPd01Printer, savePd01Printer, type SavedPd01Printer } from "@/features/printer/pd01Prefs";

// En web, RN usa una perilla verde al encender; la forzamos a blanco.
const switchWebProps = { activeThumbColor: "#FFFFFF" } as object;


const PUSH_STATUS_COPY = {
  es: { unavailable: "Las alertas remotas con la app cerrada requieren una APK o un development build.", denied: "Activa las notificaciones de SaborExpress en los ajustes de Android.", error: "No se pudo registrar el dispositivo. Se reintentará al reconectar.", checking: "Comprobando las notificaciones remotas...", save: "No se pudieron guardar los ajustes del cajero en este dispositivo." },
  en: { unavailable: "Background alerts require an APK or development build.", denied: "Enable SaborExpress notifications in Android settings.", error: "Device registration failed. It will retry after reconnecting.", checking: "Checking remote notifications...", save: "Cashier settings could not be saved on this device." },
  pt: { unavailable: "Alertas em segundo plano exigem um APK ou build de desenvolvimento.", denied: "Ative as notificações do SaborExpress nas configurações do Android.", error: "Falha ao registrar o dispositivo. Nova tentativa ao reconectar.", checking: "Verificando notificações remotas...", save: "Não foi possível salvar as configurações do caixa neste dispositivo." },
  fr: { unavailable: "Les alertes en arrière-plan nécessitent un APK ou une version de développement.", denied: "Activez les notifications SaborExpress dans les paramètres Android.", error: "Impossible d’enregistrer l’appareil. Nouvel essai après reconnexion.", checking: "Vérification des notifications distantes...", save: "Impossible d’enregistrer les préférences de caisse sur cet appareil." },
} as const;

const LANGUAGE_OPTIONS: Array<{ label: string; value: LanguageCode }> = [
  { label: "Español", value: "es" },
  { label: "English", value: "en" },
  { label: "Português", value: "pt" },
  { label: "Français", value: "fr" },
];

export default function CashierSettings() {
  const {
    language,
    setLanguage,
    isDark,
    setIsDark,
    notificationSound,
    setNotificationSound,
    vibrationNotifications,
    setVibrationNotifications,
    autoPrint,
    setAutoPrint,
    hydrated,
    preferencesError,
    pushStatus,
  } = useCashierContext();
  const router = useRouter();
  const { handleLogout } = useAuth();
  const [languageOpen, setLanguageOpen] = useState(false);
  const { user } = useAuth();
  const [pd01, setPd01] = useState<SavedPd01Printer | null>(null);
  const [printerDevices, setPrinterDevices] = useState<SavedPd01Printer[]>([]);
  const [printerBusy, setPrinterBusy] = useState(false);
  const [printerMessage, setPrinterMessage] = useState("");
  React.useEffect(() => { void loadPd01Printer(user?.token).then(setPd01); }, [user?.token]);
  const scanPrinters = async () => {
    setPrinterBusy(true); setPrinterMessage("");
    try {
      const devices = await scanPd01Printers();
      setPrinterDevices(devices);
      setPrinterMessage(devices.length ? "Selecciona tu PD01:" : "No se encontró PD01. Enciéndela y cierra Fun Print.");
    } catch (error) { setPrinterMessage(error instanceof Error ? error.message : "No fue posible buscar impresoras."); }
    finally { setPrinterBusy(false); }
  };
  const choosePrinter = async (printer: SavedPd01Printer) => {
    if (!user?.token) return;
    try { await savePd01Printer(user.token, printer); setPd01(printer); setPrinterDevices([]); setPrinterMessage("Impresora guardada. Imprime una prueba antes de cobrar."); }
    catch (error) { setPrinterMessage(error instanceof Error ? error.message : "No se pudo guardar."); }
  };
  const testPrinter = async () => {
    if (!pd01) return;
    setPrinterBusy(true); setPrinterMessage("Enviando impresión...");
    try { await printPd01Test(pd01.id); setPrinterMessage("Datos enviados. Confirma que salió el papel impreso."); }
    catch (error) { setPrinterMessage(error instanceof Error ? error.message : "No se pudo imprimir."); }
    finally { setPrinterBusy(false); }
  };
  const t = TRANSLATIONS[language] || TRANSLATIONS.es;
  const pushCopy = PUSH_STATUS_COPY[language] || PUSH_STATUS_COPY.es;

  const colors = isDark
    ? {
        background: "#0B1220",
        card: "#111827",
        header: "#111827",
        elevated: "#1E293B",
        text: "#F8FAFC",
        mutedText: "#CBD5E1",
        border: "#334155",
        accent: "#E61C24",
        accentSoft: "#3F1D24",
        danger: "#E61C24",
      }
    : {
        background: "#F8FAFC",
        card: "#FFFFFF",
        header: "#FFFFFF",
        elevated: "#F1F5F9",
        text: "#1E293B",
        mutedText: "#64748B",
        border: "#E2E8F0",
        accent: "#E61C24",
        accentSoft: "#FEF2F2",
        danger: "#E61C24",
      };

  const executeLogout = async () => {
    try {
      await handleLogout();
    } finally {
      router.replace("/");
    }
  };

  const onLogoutPress = () => {
    showAppAlert(t.logoutBtn, t.logoutConfirmationMessage, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.logoutBtn,
        style: "destructive",
        onPress: () => void executeLogout(),
      },
    ]);
  };

  const handleVibrationChange = (enabled: boolean) => {
    setVibrationNotifications(enabled);
    if (enabled && Platform.OS !== "web") {
      Vibration.cancel();
      Vibration.vibrate([0, 100]);
    }
  };

  const settingRow = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    description: string,
    value: boolean,
    onChange: (nextValue: boolean) => void,
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Ionicons name={icon} size={23} color={colors.text} />
        <View style={styles.textGroup}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.settingDesc, { color: colors.mutedText }]}>
            {description}
          </Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={!hydrated}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor="#FFFFFF"
        {...switchWebProps}
      />
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.topHeader,
          {
            backgroundColor: colors.header,
            borderColor: colors.border,
            justifyContent: "space-between",
          },
        ]}
      >
        <Text style={[styles.topHeaderTitle, { color: colors.text }]}>
          {t.settings}
        </Text>
        {!hydrated && <ActivityIndicator size="small" color={colors.accent} />}
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
        {pushStatus !== "enabled" && (
          <Text accessibilityRole="alert" style={{ color: colors.mutedText, marginBottom: 12, lineHeight: 20 }}>
            {pushStatus === "unavailable" ? pushCopy.unavailable
              : pushStatus === "permission-denied" ? pushCopy.denied
              : pushStatus === "error" ? pushCopy.error
              : pushCopy.checking}
          </Text>
        )}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>
            {t.cashierNotificationsTitle}
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {settingRow(
              "volume-high-outline",
              t.transferSound,
              t.transferSoundDesc,
              notificationSound,
              setNotificationSound,
            )}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            {settingRow(
              "phone-portrait-outline",
              t.vibrationTitle,
              t.vibrationDesc,
              vibrationNotifications,
              handleVibrationChange,
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>IMPRESORA BLUETOOTH PD01</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 14, gap: 9 }]}>
            <Text style={{ color: colors.text, fontWeight: "700" }}>{pd01 ? `Seleccionada: ${pd01.name}` : "Ninguna impresora seleccionada"}</Text>
            <Text style={{ color: colors.mutedText, fontSize: 12 }}>Conecta tu impresora PD01. Esta función requiere una APK de desarrollo; no funciona en Expo Go.</Text>
            <TouchableOpacity onPress={() => void scanPrinters()} disabled={printerBusy || !isPd01Available()} style={{ backgroundColor: colors.accent, padding: 12, borderRadius: 10, opacity: printerBusy ? 0.5 : 1 }}>
              <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>Buscar impresora PD01</Text>
            </TouchableOpacity>
            {printerDevices.map((device) => <TouchableOpacity key={device.id} onPress={() => void choosePrinter(device)} style={{ padding: 12, borderRadius: 8, backgroundColor: colors.elevated }}>
              <Text style={{ color: colors.text }}>{device.name} — seleccionar</Text>
            </TouchableOpacity>)}
            {!!pd01 && <TouchableOpacity onPress={() => void testPrinter()} disabled={printerBusy} style={{ padding: 12, borderRadius: 10, borderColor: colors.accent, borderWidth: 1 }}>
              <Text style={{ color: colors.text, textAlign: "center" }}>Imprimir prueba PD01</Text>
            </TouchableOpacity>}
            {!!pd01 && <TouchableOpacity onPress={() => { if(user?.token) void savePd01Printer(user.token, null).then(() => {setPd01(null); setPrinterMessage("Impresora olvidada.");}); }}>
              <Text style={{ color: colors.danger, textAlign: "center" }}>Olvidar impresora</Text>
            </TouchableOpacity>}
            {!!printerMessage && <Text style={{ color: colors.mutedText, fontSize: 12 }}>{printerMessage}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>
            {t.operations}
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {settingRow(
              "print-outline",
              t.autoPrint,
              t.autoPrintDesc,
              autoPrint,
              setAutoPrint,
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>
            {t.appearance}
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {settingRow(
              "moon-outline",
              t.darkMode,
              t.darkModeDesc,
              isDark,
              setIsDark,
            )}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={styles.settingRow}
              activeOpacity={0.7}
              disabled={!hydrated}
              onPress={() => setLanguageOpen(true)}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="language-outline" size={23} color={colors.text} />
                <View style={styles.textGroup}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    {t.languageSection}
                  </Text>
                  <Text style={[styles.settingDesc, { color: colors.mutedText }]}>
                    {LANGUAGE_OPTIONS.find((option) => option.value === language)?.label}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color={colors.mutedText}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[localStyles.logoutButton, { backgroundColor: colors.danger, shadowColor: colors.danger }]}
          onPress={onLogoutPress}
          disabled={!hydrated}
        >
          <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          <Text style={localStyles.logoutButtonText}>{t.logoutBtn}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={languageOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageOpen(false)}
      >
        <TouchableOpacity
          style={localStyles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setLanguageOpen(false)}
        >
          <View
            style={[
              localStyles.languageModal,
              { backgroundColor: colors.card },
            ]}
          >
            <Text style={[localStyles.modalTitle, { color: colors.text }]}>
              {t.languageSection}
            </Text>
            {LANGUAGE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  localStyles.languageOption,
                  { borderColor: colors.border },
                ]}
                onPress={() => {
                  setLanguageOpen(false);
                  setLanguage(option.value);
                }}
              >
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  {option.label}
                </Text>
                {language === option.value && (
                  <Ionicons name="checkmark" size={21} color={colors.accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <AppAlertModal
        colors={{
          surface: colors.card,
          text: colors.text,
          mutedText: colors.mutedText,
          accent: colors.accent,
          accentSoft: colors.accentSoft,
          danger: colors.danger,
          border: colors.border,
          elevatedSurface: colors.elevated,
        }}
      />
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  languageModal: {
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  languageOption: {
    minHeight: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
