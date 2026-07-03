import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useAuth } from '@/features/auth/hooks/useAuth'; // Opcional, si usas el hook
import { LanguageDropdown } from '@/components/LanguageDropdown';
import { useWaiterTheme } from '@/features/waiter/context/WaiterThemeContext';
import { useWaiterLanguage } from '@/features/waiter/context/WaiterLanguageContext';

export const WaiterSettingsView = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { handleLogout } = useAuth(); // Opcional
  const { isDark, colors, setMode } = useWaiterTheme();
  const { language, setLanguage, t, languageOptions } = useWaiterLanguage();
  const [kitchenSound, setKitchenSound] = useState(true);
  const [kitchenVibration, setKitchenVibration] = useState(true);

  const onLogoutPress = async () => {
    try {
      if (handleLogout) await handleLogout();
    } catch (error) {
      console.log(error);
    } finally {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.topHeader, { backgroundColor: colors.header, borderColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={28} color={colors.text} />
        </TouchableOpacity>
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
        
        {/* NOTIFICACIONES */}
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

        {/* APARIENCIA Y PREFERENCIAS */}
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

   

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  topHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  menuButton: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  
  container: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
  languageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  textGroup: { marginLeft: 15, flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 2 },
  settingDesc: { fontSize: 13, color: '#94A3B8' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  
  
});