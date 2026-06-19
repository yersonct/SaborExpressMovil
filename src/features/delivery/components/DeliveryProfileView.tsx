import React, { useState } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';

export const DeliveryProfileView = () => {
  const navigation = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  
  // Datos específicos del repartidor
  const [driverData, setDriverData] = useState({
    name: 'Carlos Gómez',
    phone: '+57 300 987 6543',
    vehicle: 'Honda CB160F',
    plate: 'XYZ-123',
  });

  const handleSaveProfile = () => {
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
    

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.trackingSection}>
          <View style={styles.trackingHeader}>
            <Text style={styles.sectionTitle}>Desempeño de Hoy</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>EN TURNO</Text>
            </View>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statColumn}>
              <Ionicons name="bicycle" size={28} color="#3B82F6" />
              <Text style={styles.statValue}>14</Text>
              <Text style={styles.statLabel}>Viajes</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.statColumn}>
              <Ionicons name="cash" size={28} color="#10B981" />
              <Text style={styles.statValue}>$85k</Text>
              <Text style={styles.statLabel}>Ganancias</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.statColumn}>
              <Ionicons name="star" size={28} color="#F59E0B" />
              <Text style={styles.statValue}>4.9</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileHeaderRow}>
            <Text style={styles.sectionTitle}>Mis Datos y Vehículo</Text>
            <TouchableOpacity onPress={() => isEditing ? handleSaveProfile() : setIsEditing(true)}>
              <Text style={styles.editButtonText}>{isEditing ? 'Guardar' : 'Editar'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png' }} style={styles.avatar} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre completo</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={driverData.name}
                onChangeText={(text) => setDriverData({...driverData, name: text})}
                editable={isEditing}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teléfono móvil</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={driverData.phone}
                onChangeText={(text) => setDriverData({...driverData, phone: text})}
                keyboardType="phone-pad"
                editable={isEditing}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Modelo del Vehículo (Moto/Bici)</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={driverData.vehicle}
                onChangeText={(text) => setDriverData({...driverData, vehicle: text})}
                editable={isEditing}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Placa</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={driverData.plate}
                onChangeText={(text) => setDriverData({...driverData, plate: text})}
                autoCapitalize="characters"
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
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  
  trackingSection: { marginBottom: 30 },
  trackingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 },
  liveText: { color: '#10B981', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  
  statsCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, justifyContent: 'space-around', alignItems: 'center' },
  statColumn: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginTop: 8 },
  statLabel: { fontSize: 13, color: '#64748B', marginTop: 2 },
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