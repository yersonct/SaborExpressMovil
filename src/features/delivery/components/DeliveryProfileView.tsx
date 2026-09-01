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
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import * as ImagePicker from 'expo-image-picker'; // 🔥 Para la foto de perfil

// 🔥 IMPORTAMOS CONTEXTO Y TRADUCCIONES
import { useDeliveryContext } from './context/DeliveryContext';
import { TRANSLATIONS, LanguageCode } from '../../../locales/DeliveryTranslations';

export const DeliveryProfileView = () => {
  const navigation = useNavigation();

  // 🔥 Leemos el contexto global del Repartidor
  const { language, isDark } = useDeliveryContext();
  const t = TRANSLATIONS[language as LanguageCode] || TRANSLATIONS['es'];

  // 🔥 PALETA DE COLORES DINÁMICA
  const colors = isDark ? {
    background: '#0F172A', card: '#1E293B', text: '#F8FAFC',
    mutedText: '#94A3B8', border: '#334155', accent: '#EA1D2C',
    inputBg: '#0F172A', inputDisabled: '#334155', icon: '#CBD5E1',
    successBg: '#064e3b', successText: '#34d399', successBorder: '#065f46'
  } : {
    background: '#F8FAFC', card: '#FFFFFF', text: '#1E293B',
    mutedText: '#64748B', border: '#E2E8F0', accent: '#E61C24',
    inputBg: '#FFFFFF', inputDisabled: '#F1F5F9', icon: '#1E293B',
    successBg: '#ECFDF5', successText: '#10B981', successBorder: '#A7F3D0'
  };

  const [isEditing, setIsEditing] = useState(false);
  
  // Datos específicos del repartidor (ahora con correo)
  const [driverData, setDriverData] = useState({
    name: 'Carlos Gómez',
    email: 'carlos.delivery@saborexpress.com', // 🔥 Campo nuevo
    phone: '+57 300 987 6543',
    vehicle: 'Honda CB160F',
    plate: 'XYZ-123',
    avatar: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png'
  });

  // Estados de validación
  const [errors, setErrors] = useState({ name: '', plate: '' });

  // Función para manejar cambios en inputs
  const handleChangeText = (field: string, value: string) => {
    setDriverData({ ...driverData, [field]: value });
    if (errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  // Función para escoger imagen de la galería
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t.errorTitle || 'Permiso requerido', t.cameraPermission || 'Necesitamos permiso para acceder a tus imágenes.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({ 
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        quality: 0.7, 
        allowsEditing: true, 
        aspect: [1, 1] 
      });

      const canceled = (result as any).canceled ?? (result as any).cancelled ?? false;
      if (!canceled) {
        const uri = (result as any).assets?.[0]?.uri ?? (result as any).uri;
        if (uri) setDriverData({ ...driverData, avatar: uri });
      }
    } catch (e) {
      Alert.alert(t.errorTitle || 'Error', 'No se pudo seleccionar la imagen.');
    }
  };

  const handleSaveProfile = () => {
    let isValid = true;
    let newErrors = { name: '', plate: '' };

    // Validar Nombre
    if (!driverData.name.trim()) {
      newErrors.name = t.nameRequired || 'El nombre es obligatorio.';
      isValid = false;
    }
    
    // Validar Placa (Solo si el vehículo parece ser una moto/carro)
    if (!driverData.plate.trim() && driverData.vehicle.toLowerCase().includes('moto')) {
      newErrors.plate = t.plateRequired || 'La placa es obligatoria para motocicletas.';
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
      setIsEditing(false);
      Alert.alert(t.profileUpdated || '¡Perfil Actualizado!', t.profileUpdatedDesc || 'Tus datos han sido guardados correctamente.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.tabProfile || 'Perfil'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* 🔥 SECCIÓN DE DESEMPEÑO */}
        <View style={styles.trackingSection}>
          <View style={styles.trackingHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.todayPerformance || 'Desempeño de Hoy'}</Text>
            <View style={[styles.liveBadge, { backgroundColor: colors.successBg, borderColor: colors.successBorder }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.successText }]} />
              <Text style={[styles.liveText, { color: colors.successText }]}>{t.onShift || 'EN TURNO'}</Text>
            </View>
          </View>

          <View style={[styles.statsCard, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#E2E8F0' }]}>
            <View style={styles.statColumn}>
              <Ionicons name="bicycle" size={28} color="#3B82F6" />
              <Text style={[styles.statValue, { color: colors.text }]}>14</Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>{t.trips || 'Viajes'}</Text>
            </View>
            <View style={[styles.dividerVertical, { backgroundColor: colors.border }]} />
            <View style={styles.statColumn}>
              <Ionicons name="cash" size={28} color="#10B981" />
              <Text style={[styles.statValue, { color: colors.text }]}>$85k</Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>{t.earnings || 'Ganancias'}</Text>
            </View>
            <View style={[styles.dividerVertical, { backgroundColor: colors.border }]} />
            <View style={styles.statColumn}>
              <Ionicons name="star" size={28} color="#F59E0B" />
              <Text style={[styles.statValue, { color: colors.text }]}>4.9</Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>{t.rating || 'Rating'}</Text>
            </View>
          </View>
        </View>

        {/* 🔥 SECCIÓN DE PERFIL EDITABLE */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.myVehicleData || 'Mis Datos y Vehículo'}</Text>
            <TouchableOpacity onPress={() => isEditing ? handleSaveProfile() : setIsEditing(true)}>
              <Text style={[styles.editButtonText, { color: colors.accent }]}>{isEditing ? (t.save || 'Guardar') : (t.edit || 'Editar')}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.profileCard, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#E2E8F0' }]}>
            
            {/* Foto de perfil con botón de editar */}
            <TouchableOpacity 
              onPress={isEditing ? pickImage : undefined} 
              activeOpacity={isEditing ? 0.7 : 1}
              style={styles.avatarContainer}
            >
              <Image source={{ uri: driverData.avatar }} style={[styles.avatar, { borderColor: colors.border }]} />
              {isEditing && (
                <View style={[styles.cameraIconBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="camera-outline" size={18} color={colors.text} />
                </View>
              )}
            </TouchableOpacity>

            {/* Input: Nombre */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>{t.fullName || 'Nombre completo'}</Text>
              <TextInput
                style={[
                  styles.input, 
                  { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text },
                  !isEditing && { backgroundColor: colors.inputDisabled, color: colors.mutedText },
                  errors.name ? styles.inputError : null
                ]}
                value={driverData.name}
                onChangeText={(text) => handleChangeText('name', text)}
                editable={isEditing}
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            {/* Input: Correo (Bloqueado siempre) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>{t.emailLabel || 'Correo Electrónico'}</Text>
              <TextInput
                style={[
                  styles.input, 
                  { backgroundColor: colors.inputDisabled, borderColor: colors.border, color: colors.mutedText }
                ]}
                value={driverData.email}
                editable={false}
              />
            </View>

            {/* Input: Teléfono */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>{t.mobilePhone || 'Teléfono móvil'}</Text>
              <TextInput
                style={[
                  styles.input, 
                  { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text },
                  !isEditing && { backgroundColor: colors.inputDisabled, color: colors.mutedText }
                ]}
                value={driverData.phone}
                onChangeText={(text) => handleChangeText('phone', text)}
                keyboardType="phone-pad"
                editable={isEditing}
              />
            </View>

            {/* Input: Modelo Vehículo */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>{t.vehicleModel || 'Modelo del Vehículo (Moto/Bici)'}</Text>
              <TextInput
                style={[
                  styles.input, 
                  { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text },
                  !isEditing && { backgroundColor: colors.inputDisabled, color: colors.mutedText }
                ]}
                value={driverData.vehicle}
                onChangeText={(text) => handleChangeText('vehicle', text)}
                editable={isEditing}
              />
            </View>

            {/* Input: Placa */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>{t.plate || 'Placa'}</Text>
              <TextInput
                style={[
                  styles.input, 
                  { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text },
                  !isEditing && { backgroundColor: colors.inputDisabled, color: colors.mutedText },
                  errors.plate ? styles.inputError : null
                ]}
                value={driverData.plate}
                onChangeText={(text) => handleChangeText('plate', text)}
                autoCapitalize="characters"
                editable={isEditing}
              />
              {errors.plate ? <Text style={styles.errorText}>{errors.plate}</Text> : null}
            </View>

          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  container: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  
  trackingSection: { marginBottom: 30 },
  trackingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  liveDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  liveText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  
  statsCard: { flexDirection: 'row', borderRadius: 20, padding: 20, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3, justifyContent: 'space-around', alignItems: 'center' },
  statColumn: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', marginTop: 8 },
  statLabel: { fontSize: 13, marginTop: 2 },
  dividerVertical: { width: 1, height: 50 },

  profileSection: { marginBottom: 20 },
  profileHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  editButtonText: { fontWeight: 'bold', fontSize: 16 },
  
  profileCard: { borderRadius: 20, padding: 20, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 },
  avatarContainer: { alignItems: 'center', marginBottom: 20, position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2 },
  cameraIconBadge: { position: 'absolute', right: '35%', bottom: -5, borderRadius: 15, padding: 6, borderWidth: 1, elevation: 2 },
  
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 13, marginBottom: 6, fontWeight: '600', textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 5, fontWeight: '600' },
  inputDisabled: { opacity: 0.8 }, // Solo para un toque de feedback extra
});