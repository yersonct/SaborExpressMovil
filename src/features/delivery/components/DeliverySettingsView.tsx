import React, { useState } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  TouchableOpacity,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';

export const DeliverySettingsView = () => {
  const navigation = useNavigation();
  const router = useRouter();

  const [isOnline, setIsOnline] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const onLogoutPress = () => {
    router.replace('/'); 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
   

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado de Trabajo</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name={isOnline ? "radio" : "radio-outline"} size={24} color={isOnline ? "#10B981" : "#94A3B8"} />
                <View style={styles.textGroup}>
                  <Text style={styles.settingTitle}>Recibir Pedidos</Text>
                  <Text style={styles.settingDesc}>{isOnline ? 'Estás en línea y visible' : 'Estás desconectado'}</Text>
                </View>
              </View>
              <Switch 
                value={isOnline} 
                onValueChange={setIsOnline} 
                trackColor={{ false: '#E2E8F0', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="flash-outline" size={24} color="#1E293B" />
                <View style={styles.textGroup}>
                  <Text style={styles.settingTitle}>Aceptación Automática</Text>
                  <Text style={styles.settingDesc}>Aceptar viajes sin preguntar</Text>
                </View>
              </View>
              <Switch 
                value={autoAccept} 
                onValueChange={setAutoAccept} 
                trackColor={{ false: '#E2E8F0', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Navegación y App</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.languageRow} activeOpacity={0.7}>
              <View style={styles.settingInfo}>
                <Ionicons name="navigate-circle-outline" size={24} color="#1E293B" />
                <View style={styles.textGroup}>
                  <Text style={styles.settingTitle}>App de Mapas predeterminada</Text>
                  <Text style={styles.settingDesc}>Google Maps</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#94A3B8" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon-outline" size={24} color="#1E293B" />
                <View style={styles.textGroup}>
                  <Text style={styles.settingTitle}>Modo Oscuro</Text>
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
  
  languageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
  
  logoutButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#E61C24', paddingVertical: 16, borderRadius: 16, marginTop: 10, shadowColor: '#E61C24', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  logoutButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }
});