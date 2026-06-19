import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useAuth } from '@/features/auth/hooks/useAuth'; // Opcional, si usas el hook

export const WaiterSettingsView = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { handleLogout } = useAuth(); // Opcional

  const [kitchenSound, setKitchenSound] = useState(true);
  const [kitchenVibration, setKitchenVibration] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* NOTIFICACIONES */}
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

        {/* APARIENCIA Y PREFERENCIAS */}
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

        {/* BOTÓN CERRAR SESIÓN */}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogoutPress}>
          <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>Finalizar Turno y Salir</Text>
        </TouchableOpacity>

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
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  textGroup: { marginLeft: 15, flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 2 },
  settingDesc: { fontSize: 13, color: '#94A3B8' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  
  logoutButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#E61C24', paddingVertical: 16, borderRadius: 16, marginTop: 10, shadowColor: '#E61C24', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  logoutButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }
});