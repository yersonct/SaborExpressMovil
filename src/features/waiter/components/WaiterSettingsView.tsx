import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import { settingsStyles as styles } from "./style/SettingsStyles";
import { useWaiterTheme } from "@/features/waiter/context/WaiterThemeContext";
import { useWaiterLanguage } from "@/features/waiter/context/WaiterLanguageContext";
import { useWaiterNotificationPreferences } from "@/features/waiter/context/WaiterNotificationPreferencesContext";
import { vibrateWaiterDevice } from "@/features/waiter/services/waiterVibration";
import { showAppAlert } from "@/features/shared/services/alertEvents";

// En web, RN usa una perilla verde al encender; la forzamos a blanco.
const switchWebProps = { activeThumbColor: "#FFFFFF" } as object;

export const WaiterSettingsView = () => {
  const router = useRouter();
  const { handleLogout } = useAuth();
  const { isDark, colors, setMode } = useWaiterTheme();
  const { language, setLanguage, t, languageOptions } = useWaiterLanguage();
  const {
    soundNotifications,
    vibrationNotifications,
    hydrated: notificationPreferencesHydrated,
    setSoundNotifications,
    setVibrationNotifications,
  } = useWaiterNotificationPreferences();
  const [languageOpen, setLanguageOpen] = useState(false);

  const executeLogout = async () => {
    try {
      if (handleLogout) await handleLogout();
    } catch (error) {
      console.log(error);
    } finally {
      router.replace("/");
    }
  };

  const onLogoutPress = () => {
    const title = t.drawerLogout || "Cerrar Sesión";
    const message = t.logoutConfirmationMessage;

    showAppAlert(title, message, [
      { text: t.ordersCancelNo || "Cancelar", style: "cancel" },
      { text: title || "Salir", style: "destructive", onPress: executeLogout },
    ]);
  };

  const settingRow = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    description: string,
    value: boolean,
    onChange: (value: boolean) => void,
    disabled = false,
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Ionicons name={icon} size={23} color={colors.text} />
        <View style={styles.textGroup}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.settingDesc, { color: colors.mutedText }]}>
            {description}
          </Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor="#FFFFFF"
        {...switchWebProps}
      />
    </View>
  );

  const handleVibrationChange = (enabled: boolean) => {
    setVibrationNotifications(enabled);
    if (enabled) vibrateWaiterDevice([0, 100]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topHeader,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t.settingsTitle || "Configuración"}
        </Text>
        {!notificationPreferencesHydrated && (
          <ActivityIndicator size="small" color={colors.accent} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>
            {t.kitchenNotificationsTitle || "Notificaciones de Cocina"}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {settingRow(
              "volume-high-outline",
              t.readyOrderSoundTitle || "Sonido de Pedido Listo",
              t.readyOrderSoundDesc || "Suena cuando cocina termina un plato",
              soundNotifications,
              setSoundNotifications,
              !notificationPreferencesHydrated,
            )}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            {settingRow(
              "phone-portrait-outline",
              t.vibrationTitle || "Vibración",
              t.vibrationDesc || "Vibrar al recibir notificación",
              vibrationNotifications,
              handleVibrationChange,
              !notificationPreferencesHydrated,
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>
            {t.appearanceTitle || "Apariencia"}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon-outline" size={23} color={colors.text} />
                <View style={styles.textGroup}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    {t.darkModeTitle || "Modo Oscuro"}
                  </Text>
                  <Text style={[styles.settingDesc, { color: colors.mutedText }]}>
                    {t.darkModeDesc || "Ideal para turnos de noche"}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={(value) => setMode(value ? "dark" : "light")}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF"
        {...switchWebProps}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={styles.languageRow}
              activeOpacity={0.7}
              onPress={() => setLanguageOpen(true)}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="language-outline" size={23} color={colors.text} />
                <View style={styles.textGroup}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    {t.languageLabel || "Idioma"}
                  </Text>
                  <Text style={[styles.settingDesc, { color: colors.mutedText }]}>
                    {languageOptions.find((item) => item.value === language)?.label}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: colors.danger, shadowColor: colors.danger },
          ]}
          onPress={onLogoutPress}
        >
          <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>
            {t.drawerLogout || "Cerrar Sesión"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={languageOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setLanguageOpen(false)}
        >
          <View style={[styles.languageModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t.languageLabel || "Idioma"}
            </Text>
            {languageOptions.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[styles.languageOption, { borderColor: colors.border }]}
                onPress={() => {
                  setLanguageOpen(false);
                  setLanguage(item.value);
                }}
              >
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  {item.label}
                </Text>
                {language === item.value && (
                  <Ionicons name="checkmark" size={21} color={colors.success} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};
