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
  } = useCashierContext();
  const router = useRouter();
  const { handleLogout } = useAuth();
  const [languageOpen, setLanguageOpen] = useState(false);
  const t = TRANSLATIONS[language] || TRANSLATIONS.es;

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
