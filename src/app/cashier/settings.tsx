import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LanguageDropdown } from '@/components/LanguageDropdown';
import { styles } from './style/CashierSettingsStyles';
import { TRANSLATIONS, LanguageCode } from './../../locales/CashierTranslations';

// 🔥 IMPORTAMOS EL CONTEXTO EXCLUSIVO DEL CAJERO
import { useCashierContext } from '../../features/cashier/components/context/CashierContext';

export default function CashierSettings() {
  // 🔥 Sacamos el idioma y el modo oscuro del contexto global del cajero
  const { language, setLanguage, isDark, setIsDark } = useCashierContext();
  
  // Estados de Configuración Locales (Solo importan aquí)
  const [autoPrint, setAutoPrint] = useState(true);
  const [paymentSound, setPaymentSound] = useState(true);

  // Textos traducidos
  const t = TRANSLATIONS[language] || TRANSLATIONS['es'];

  // Opciones para el Dropdown
  const languageOptions = [
    { label: 'Español', value: 'es' },
    { label: 'English', value: 'en' },
    { label: 'Português', value: 'pt' },
    { label: 'Français', value: 'fr' }
  ];

  // Paleta de Colores Dinámica
  const colors = isDark ? {
    background: '#0F172A', card: '#1E293B', header: '#1E293B', text: '#F8FAFC',
    mutedText: '#94A3B8', border: '#334155', accent: '#EA1D2C', icon: '#CBD5E1'
  } : {
    background: '#F8FAFC', card: '#FFFFFF', header: '#FFFFFF', text: '#1E293B',
    mutedText: '#64748B', border: '#E2E8F0', accent: '#EA1D2C', icon: '#1E293B'
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      
      {/* HEADER SUPERIOR */}
      <View style={[styles.topHeader, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Text style={[styles.topHeaderTitle, { color: colors.text }]}>{t.settings || 'Configuración'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t.headerTitle || 'Ajustes de Caja'}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>{t.headerSubtitle || 'Configura alertas e impresión de recibos'}</Text>
        </View>

        {/* SECCIÓN DE IDIOMA CONECTADA AL CONTEXTO */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>{t.languageSection || 'Idioma'}</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.settingRow}>
              
              <View style={styles.settingInfo}>
                <Ionicons name="language-outline" size={24} color={colors.text} />
                <View style={styles.textGroup}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>{t.languageTitle || 'Idioma del Sistema'}</Text>
                  <Text style={[styles.settingDesc, { color: colors.mutedText }]}>{t.languageDesc || 'Selecciona tu idioma preferido'}</Text>
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
          </View>
        </View>

        {/* SECCIÓN DE OPERACIONES */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>{t.operations || 'Operaciones'}</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="print-outline" size={24} color={colors.text} />
                <View style={styles.textGroup}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>{t.autoPrint || 'Impresión Automática'}</Text>
                  <Text style={[styles.settingDesc, { color: colors.mutedText }]}>{t.autoPrintDesc || 'Imprimir ticket al confirmar pago'}</Text>
                </View>
              </View>
              <Switch value={autoPrint} onValueChange={setAutoPrint} trackColor={{ false: colors.border, true: colors.accent }} thumbColor="#FFFFFF" />
            </View>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="musical-notes-outline" size={24} color={colors.text} />
                <View style={styles.textGroup}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>{t.transferSound || 'Sonido de Transferencia'}</Text>
                  <Text style={[styles.settingDesc, { color: colors.mutedText }]}>{t.transferSoundDesc || 'Notificar cuando un domicilio pague'}</Text>
                </View>
              </View>
              <Switch value={paymentSound} onValueChange={setPaymentSound} trackColor={{ false: colors.border, true: colors.accent }} thumbColor="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* SECCIÓN DE APARIENCIA (MODO OSCURO) CON SWITCH */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>{t.appearance || 'Apariencia'}</Text>
          
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon-outline" size={24} color={colors.text} />
                <View style={styles.textGroup}>
                  {/* 🔥 SOLUCIÓN: Cambié t.darkModeTitle por t.darkMode */}
                  <Text style={[styles.settingTitle, { color: colors.text }]}>{t.darkMode || 'Modo Oscuro'}</Text>
                  <Text style={[styles.settingDesc, { color: colors.mutedText }]}>{t.darkModeDesc || 'Ideal para turnos de noche'}</Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={(value) => setIsDark(value)}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
          
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}