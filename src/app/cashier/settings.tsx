import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native'; 

export default function CashierSettings() {
  const navigation = useNavigation(); 
  const [autoPrint, setAutoPrint] = useState(true);
  const [paymentSound, setPaymentSound] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Ionicons name="menu" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Configuración</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Ajustes de Caja</Text>
          <Text style={styles.subtitle}>Configura alertas e impresión de recibos</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operaciones</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="print-outline" size={24} color="#1E293B" />
                <View style={styles.textGroup}>
                  <Text style={styles.settingTitle}>Impresión Automática</Text>
                  <Text style={styles.settingDesc}>Imprimir ticket al confirmar pago</Text>
                </View>
              </View>
              <Switch value={autoPrint} onValueChange={setAutoPrint} trackColor={{ false: '#E2E8F0', true: '#EA1D2C' }} thumbColor="#FFFFFF" />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="musical-notes-outline" size={24} color="#1E293B" />
                <View style={styles.textGroup}>
                  <Text style={styles.settingTitle}>Sonido de Transferencia</Text>
                  <Text style={styles.settingDesc}>Notificar cuando un domicilio pague</Text>
                </View>
              </View>
              <Switch value={paymentSound} onValueChange={setPaymentSound} trackColor={{ false: '#E2E8F0', true: '#EA1D2C' }} thumbColor="#FFFFFF" />
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
                  <Text style={styles.settingDesc}>Cambia la interfaz a tonos grises</Text>
                </View>
              </View>
              <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: '#E2E8F0', true: '#1E293B' }} thumbColor="#FFFFFF" />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  topHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  menuButton: { marginRight: 15 },
  topHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
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
});