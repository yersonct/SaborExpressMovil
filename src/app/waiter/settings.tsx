import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';        // 1. Importar useNavigation
import { DrawerActions } from '@react-navigation/native'; // 2. Importar DrawerActions

export default function WaiterSettings() {
  const navigation = useNavigation(); // 3. Inicializar navegación
  const [kitchenSound, setKitchenSound] = useState(true);
  const [kitchenVibration, setKitchenVibration] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Ajustes de la App</Text>
          <Text style={styles.subtitle}>Personaliza tu experiencia de trabajo</Text>
        </View>

        {/* --- SECCIONES IGUALES --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones de Cocina</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="volume-high-outline" size={24} color="#1E293B" />
                <View style={styles.textGroup}>
                  <Text style={styles.settingTitle}>Sonido de Pedido Listo</Text>
                  <Text style={styles.settingDesc}>Suena cuando cocina termina un plato</Text>
                </View>
              </View>
              <Switch 
                value={kitchenSound} 
                onValueChange={setKitchenSound} 
                trackColor={{ false: '#E2E8F0', true: '#E61C24' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="phone-portrait-outline" size={24} color="#1E293B" />
                <View style={styles.textGroup}>
                  <Text style={styles.settingTitle}>Vibración</Text>
                  <Text style={styles.settingDesc}>Vibrar al recibir notificación</Text>
                </View>
              </View>
              <Switch 
                value={kitchenVibration} 
                onValueChange={setKitchenVibration} 
                trackColor={{ false: '#E2E8F0', true: '#E61C24' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apariencia</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon-outline" size={24} color="#1E293B" />
                <View style={styles.textGroup}>
                  <Text style={styles.settingTitle}>Modo Oscuro</Text>
                  <Text style={styles.settingDesc}>Ideal para turnos de noche</Text>
                </View>
              </View>
              <Switch 
                value={darkMode} 
                onValueChange={setDarkMode} 
                trackColor={{ false: '#E2E8F0', true: '#1E293B' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Idioma y Región</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.languageRow} activeOpacity={0.7}>
              <View style={styles.settingInfo}>
                <Ionicons name="language-outline" size={24} color="#1E293B" />
                <View style={styles.textGroup}>
                  <Text style={styles.settingTitle}>Idioma de la Aplicación</Text>
                </View>
              </View>
              <View style={styles.languageSelector}>
                <Text style={styles.languageText}>Español</Text>
                <Ionicons name="chevron-forward-outline" size={20} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  // NUEVO: Estilo para la barra superior con el icono de menú
  topHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  menuButton: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  
  container: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '900', color: '#1E293B', marginBottom: 5 },
  subtitle: { fontSize: 15, color: '#64748B' },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  textGroup: { marginLeft: 15, flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 2 },
  settingDesc: { fontSize: 13, color: '#94A3B8' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  languageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
  languageSelector: { flexDirection: 'row', alignItems: 'center' },
  languageText: { fontSize: 16, color: '#64748B', marginRight: 5 }
});