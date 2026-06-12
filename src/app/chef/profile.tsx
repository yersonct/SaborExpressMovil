import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';

export default function ChefProfile() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Ionicons name="menu" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3413/3413535.png' }} style={styles.profilePic} />
          <Text style={styles.name}>Carlos Mendoza</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>CHEF EJECUTIVO</Text>
          </View>
        </View>

        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>Mi Carnet Digital</Text>
          <View style={styles.qrCard}>
            <Ionicons name="qr-code-outline" size={120} color="#1E293B" />
            <Text style={styles.qrText}>ID: CHF-90210</Text>
            <Text style={styles.qrInstruction}>Muestra este código para autorizar inventario o registrar entrada</Text>
          </View>
        </View>

        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Rendimiento de Hoy</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Ionicons name="fast-food-outline" size={28} color="#F59E0B" />
              <Text style={styles.metricValue}>84</Text>
              <Text style={styles.metricLabel}>Platos Listos</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="timer-outline" size={28} color="#10B981" />
              <Text style={styles.metricValue}>12m</Text>
              <Text style={styles.metricLabel}>Tiempo x Plato</Text>
            </View>
          </View>
        </View>

        <View style={styles.shiftSection}>
          <Text style={styles.sectionTitle}>Información del Turno</Text>
          <View style={styles.shiftCard}>
            <View style={styles.shiftRow}>
              <Ionicons name="log-in-outline" size={20} color="#64748B" />
              <Text style={styles.shiftLabel}>Hora de Entrada:</Text>
              <Text style={styles.shiftValue}>06:00 AM</Text>
            </View>
            <View style={styles.shiftDivider} />
            <View style={styles.shiftRow}>
              <Ionicons name="log-out-outline" size={20} color="#64748B" />
              <Text style={styles.shiftLabel}>Hora de Salida:</Text>
              <Text style={styles.shiftValue}>03:00 PM</Text>
            </View>
            <View style={styles.shiftDivider} />
            <View style={styles.shiftRow}>
              <Ionicons name="flame-outline" size={20} color="#E61C24" />
              <Text style={styles.shiftLabel}>Estación Asignada:</Text>
              <Text style={styles.shiftValue}>Parrilla</Text>
            </View>
          </View>
          <Text style={styles.footerNote}>* Para modificar estos datos, comunícate con el Administrador.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  topHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  menuButton: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  container: { padding: 20, paddingBottom: 40 },
  headerCard: { alignItems: 'center', backgroundColor: '#FFFFFF', padding: 25, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5, marginBottom: 25 },
  profilePic: { width: 90, height: 90, borderRadius: 45, marginBottom: 15, borderWidth: 3, borderColor: '#F1F5F9', backgroundColor: '#FFF' },
  name: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginBottom: 5 },
  roleBadge: { backgroundColor: '#FEF2F2', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#E61C24' },
  roleText: { color: '#E61C24', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  qrSection: { marginBottom: 25 },
  qrCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  qrText: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginTop: 10 },
  qrInstruction: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 5, paddingHorizontal: 20 },
  metricsSection: { marginBottom: 25 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metricCard: { width: '48%', backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  metricValue: { fontSize: 28, fontWeight: '900', color: '#1E293B', marginTop: 10, marginBottom: 2 },
  metricLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  shiftSection: { marginBottom: 20 },
  shiftCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  shiftLabel: { flex: 1, fontSize: 15, color: '#334155', marginLeft: 15 },
  shiftValue: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  shiftDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 5 },
  footerNote: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 15, fontStyle: 'italic' }
});