import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from "@/features/auth/context/AuthContext";
import { LanguageDropdown } from '@/components/LanguageDropdown';
import { settingsStyles as styles } from './style/SettingsStyles';
import { useWaiterTheme } from '@/features/waiter/context/WaiterThemeContext';
import { useWaiterLanguage } from '@/features/waiter/context/WaiterLanguageContext';

export const WaiterSettingsView = () => {
  const router = useRouter();
  const { handleLogout } = useAuth();
  const { isDark, colors, setMode } = useWaiterTheme();
  const { language, setLanguage, t, languageOptions } = useWaiterLanguage();

  const [kitchenSound, setKitchenSound] = useState(true);
  const [kitchenVibration, setKitchenVibration] = useState(true);

  const executeLogout = async () => {
    try {
      if (handleLogout) await handleLogout();
    } catch (error) {
      console.log(error);
    } finally {
      router.replace('/'); 
    }
  };

  const onLogoutPress = () => {
    const title = t.drawerLogout || 'Cerrar Sesión';
    const message = t.drawerLogout 
      ? `¿Estás seguro que deseas ${t.drawerLogout.toLowerCase()} de tu turno?` 
      : '¿Estás seguro que deseas salir de tu turno?';

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(message);
      if (confirmed) {
        executeLogout();
      }
    } else {
      Alert.alert(title, message, [
        { text: t.ordersCancelNo || 'Cancelar', style: 'cancel' },
        { text: title || 'Salir', style: 'destructive', onPress: executeLogout }
      ]);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.topHeader, { backgroundColor: colors.header, borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.settingsTitle || 'Configuración'}</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>

        {/* IDIOMA */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>{t.languageLabel || 'Idioma'}</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.languageRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="language-outline" size={24} color={colors.text} />
                <View style={styles.textGroup}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>{t.languageLabel || 'Idioma'}</Text>
                  <Text style={[styles.settingDesc, { color: colors.mutedText }]}>{t.languageSelectorDesc || 'Cambia el idioma de la aplicación'}</Text>
                </View>
              </View>
              <View style={{ minWidth: 130 }}>
                <LanguageDropdown
                  label=""
                  compact
                  value={language}
                  options={languageOptions}
                  onChange={(value) => setLanguage(value as any)}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>{t.kitchenNotificationsTitle || 'Notificaciones de Cocina'}</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="volume-high-outline" size={24} color={colors.text} />
                <View style={styles.textGroup}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>{t.readyOrderSoundTitle || 'Sonido de Pedido Listo'}</Text>
                  <Text style={[styles.settingDesc, { color: colors.mutedText }]}>{t.readyOrderSoundDesc || 'Suena cuando cocina termina un plato'}</Text>
                </View>
              </View>
              <Switch
                value={kitchenSound}
                onValueChange={setKitchenSound}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="phone-portrait-outline" size={24} color={colors.text} />
                <View style={styles.textGroup}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>{t.vibrationTitle || 'Vibración'}</Text>
                  <Text style={[styles.settingDesc, { color: colors.mutedText }]}>{t.vibrationDesc || 'Vibrar al recibir notificación'}</Text>
                </View>
              </View>
              <Switch
                value={kitchenVibration}
                onValueChange={setKitchenVibration}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>{t.appearanceTitle || 'Apariencia'}</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon-outline" size={24} color={colors.text} />
                <View style={styles.textGroup}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>{t.darkModeTitle || 'Modo Oscuro'}</Text>
                  <Text style={[styles.settingDesc, { color: colors.mutedText }]}>{t.darkModeDesc || 'Ideal para turnos de noche'}</Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={(value) => setMode(value ? 'dark' : 'light')}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <View style={[styles.section, { marginTop: 20 }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={onLogoutPress}>
            <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>{t.drawerLogout || 'Cerrar Sesión'}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};