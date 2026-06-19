import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';

export const WaiterProfileView = () => {
  const navigation = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  
  const [waiterData, setWaiterData] = useState({
    name: 'Juan Pérez',
    phone: '+57 300 111 2233',
    email: 'juan.perez@saborexpress.com',
    pin: '****' // PIN para aprobar pagos o cancelaciones
  });

  const handleSaveProfile = () => {
    setIsEditing(false);
    // Lógica para guardar en BD
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Ionicons name="menu" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* DESEMPEÑO DEL TURNO */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Desempeño del Turno</Text>
          <View style={styles.statsCard}>
            <View style={styles.statColumn}>
              <Ionicons name="receipt" size={28} color="#3B82F6" />
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Mesas Atendidas</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.statColumn}>
              <Ionicons name="cash" size={28} color="#10B981" />
              <Text style={styles.statValue}>$45k</Text>
              <Text style={styles.statLabel}>Propinas</Text>
            </View>
          </View>
        </View>

        {/* DATOS PERSONALES */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeaderRow}>
            <Text style={styles.sectionTitle}>Mis Datos</Text>
            <TouchableOpacity onPress={() => isEditing ? handleSaveProfile() : setIsEditing(true)}>
              <Text style={styles.editButtonText}>{isEditing ? 'Guardar' : 'Editar'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} style={styles.avatar} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre completo</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={waiterData.name}
                onChangeText={(text) => setWaiterData({...waiterData, name: text})}
                editable={isEditing}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo Electrónico</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={waiterData.email}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PIN de Autorización</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={waiterData.pin}
                onChangeText={(text) => setWaiterData({...waiterData, pin: text})}
                secureTextEntry
                keyboardType="numeric"
                editable={isEditing}
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
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  menuButton: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  container: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 15 },
  
  statsSection: { marginBottom: 30 },
  statsCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, justifyContent: 'space-around', alignItems: 'center' },
  statColumn: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginTop: 8 },
  statLabel: { fontSize: 13, color: '#64748B', marginTop: 2, textAlign: 'center' },
  dividerVertical: { width: 1, height: 50, backgroundColor: '#E2E8F0' },

  profileSection: { marginBottom: 20 },
  profileHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  editButtonText: { color: '#E61C24', fontWeight: 'bold', fontSize: 16 },
  
  profileCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  avatarContainer: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', borderWidth: 2, borderColor: '#E2E8F0' },
  
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 13, color: '#64748B', marginBottom: 6, fontWeight: '600', textTransform: 'uppercase' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, color: '#1E293B' },
  inputDisabled: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#64748B' },
});