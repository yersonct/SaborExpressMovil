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
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';

export default function ClientProfile() {
  const navigation = useNavigation();

  // Estados para la edición del perfil
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Cliente Frecuente',
    phone: '+57 300 123 4567',
    address: 'Calle 123 #45-67, Apto 802',
    email: 'cliente@saborexpress.com'
  });

  // 🔥 Estado para manejar los mensajes de validación en rojo
  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    address: ''
  });

  // Datos simulados del repartidor que trae el domicilio (para que el cliente lo tenga)
  const [driverData] = useState({
    name: 'Carlos Gómez',
    vehicle: 'Moto Honda - Placa: XYZ-123',
    phone: '+57 311 987 6543' // 🔥 Número del repartidor
  });

  const handleSaveProfile = () => {
    let isValid = true;
    let newErrors = { name: '', phone: '', address: '' };

    // 1. Validación de Nombre
    if (!userData.name.trim()) {
      newErrors.name = 'El nombre no puede estar vacío.';
      isValid = false;
    } else if (userData.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener mínimo 3 caracteres.';
      isValid = false;
    }

    // 2. Validación de Teléfono (Solo números y longitud mínima)
    const phoneRegex = /^[0-9+ ]{10,}$/;
    if (!userData.phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio.';
      isValid = false;
    } else if (!phoneRegex.test(userData.phone.trim().replace(/\s/g, ''))) {
      newErrors.phone = 'El teléfono debe tener al menos 10 dígitos.';
      isValid = false;
    }

    // 3. Validación de Dirección
    if (!userData.address.trim()) {
      newErrors.address = 'La dirección es obligatoria.';
      isValid = false;
    }

    setErrors(newErrors);

    // Si todo está bien, guardamos
    if (isValid) {
      setIsEditing(false);
      Alert.alert('✅ ¡Guardado!', 'Tu información personal se ha actualizado exitosamente.');
      // Lógica de base de datos iría aquí...
    }
  };

  const handleChangeText = (field: string, value: string) => {
    setUserData({ ...userData, [field]: value });
    // Limpiamos el error en tiempo real a medida que el cliente escribe
    if (errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field]: '' });
    }
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
        
        {/* --- SECCIÓN DE RASTREO DEL PEDIDO (DOMICILIO) --- */}
        <View style={styles.trackingSection}>
          <View style={styles.trackingHeader}>
            <Text style={styles.sectionTitle}>Pedido en Curso</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>EN VIVO</Text>
            </View>
          </View>

          <View style={styles.trackingCard}>
            {/* Barra de progreso */}
            <View style={styles.progressContainer}>
              <View style={styles.stepActive}><Ionicons name="restaurant" size={16} color="#FFF" /></View>
              <View style={styles.lineActive} />
              <View style={styles.stepActive}><Ionicons name="bicycle" size={16} color="#FFF" /></View>
              <View style={styles.lineInactive} />
              <View style={styles.stepInactive}><Ionicons name="home" size={16} color="#94A3B8" /></View>
            </View>
            
            <View style={styles.progressLabels}>
              <Text style={styles.labelActive}>Preparando</Text>
              <Text style={styles.labelActive}>En camino</Text>
              <Text style={styles.labelInactive}>Entregado</Text>
            </View>

            <View style={styles.divider} />

            {/* Datos del Repartidor */}
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <Text style={{fontSize: 24}}>🛵</Text>
              </View>
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{driverData.name}</Text>
                <Text style={styles.driverVehicle}>{driverData.vehicle}</Text>
                <Text style={styles.driverPhoneLabel}>Contacto: <Text style={styles.driverPhone}>{driverData.phone}</Text></Text>
              </View>
              <TouchableOpacity style={styles.callButton} onPress={() => Alert.alert('Llamando...', `Llamando al repartidor ${driverData.name} al número ${driverData.phone}`)}>
                <Ionicons name="call" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.etaContainer}>
              <Ionicons name="time-outline" size={18} color="#F59E0B" />
              <Text style={styles.etaText}>Llegada estimada: <Text style={styles.etaBold}>15 - 20 min</Text></Text>
            </View>
          </View>
        </View>

        {/* --- SECCIÓN DE DATOS PERSONALES --- */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeaderRow}>
            <Text style={styles.sectionTitle}>Mis Datos</Text>
            <TouchableOpacity onPress={() => isEditing ? handleSaveProfile() : setIsEditing(true)}>
              <Text style={styles.editButtonText}>{isEditing ? 'Guardar Cambios' : 'Editar'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }} style={styles.avatar} />
            </View>

            {/* Nombre */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre completo</Text>
              <TextInput
                style={[
                  styles.input, 
                  !isEditing && styles.inputDisabled,
                  errors.name ? styles.inputError : null
                ]}
                value={userData.name}
                onChangeText={(text) => handleChangeText('name', text)}
                editable={isEditing}
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            {/* Correo */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]} 
                value={userData.email}
                editable={false}
              />
            </View>

            {/* Teléfono */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teléfono móvil</Text>
              <TextInput
                style={[
                  styles.input, 
                  !isEditing && styles.inputDisabled,
                  errors.phone ? styles.inputError : null
                ]}
                value={userData.phone}
                onChangeText={(text) => handleChangeText('phone', text)}
                keyboardType="phone-pad"
                editable={isEditing}
              />
              {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
            </View>

            {/* Dirección */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dirección de entrega predeterminada</Text>
              <TextInput
                style={[
                  styles.input, 
                  !isEditing && styles.inputDisabled,
                  errors.address ? styles.inputError : null
                ]}
                value={userData.address}
                onChangeText={(text) => handleChangeText('address', text)}
                multiline
                editable={isEditing}
              />
              {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  menuButton: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  
  container: { padding: 20, paddingBottom: 40 },
  
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  
  trackingSection: { marginBottom: 30 },
  trackingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E61C24', marginRight: 6 },
  liveText: { color: '#E61C24', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  
  trackingCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  stepActive: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  stepInactive: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  lineActive: { flex: 1, height: 4, backgroundColor: '#10B981', marginHorizontal: -5, zIndex: 1 },
  lineInactive: { flex: 1, height: 4, backgroundColor: '#F1F5F9', marginHorizontal: -5, zIndex: 1 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  labelActive: { fontSize: 12, fontWeight: 'bold', color: '#10B981', textAlign: 'center', flex: 1 },
  labelInactive: { fontSize: 12, fontWeight: 'bold', color: '#94A3B8', textAlign: 'center', flex: 1 },
  
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  
  driverInfo: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  driverDetails: { flex: 1, marginLeft: 15 },
  driverName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  driverVehicle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  driverPhoneLabel: { fontSize: 13, color: '#334155', marginTop: 4 },
  driverPhone: { fontWeight: 'bold', color: '#3B82F6' },
  callButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E61C24', justifyContent: 'center', alignItems: 'center', shadowColor: '#E61C24', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  
  etaContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', padding: 12, borderRadius: 10, marginTop: 15, borderWidth: 1, borderColor: '#FDE68A' },
  etaText: { marginLeft: 10, color: '#92400E', fontSize: 14 },
  etaBold: { fontWeight: '900' },

  profileSection: { marginBottom: 20 },
  profileHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  editButtonText: { color: '#3B82F6', fontWeight: 'bold', fontSize: 16 },
  
  profileCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  avatarContainer: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9' },
  
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 13, color: '#64748B', marginBottom: 6, fontWeight: '600', textTransform: 'uppercase' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, color: '#1E293B' },
  inputDisabled: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#64748B' },
  
  // Estilos para errores
  inputError: { borderColor: '#EF4444', borderWidth: 1.5 },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 5, marginLeft: 4, fontWeight: '500' },
});