import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// 🔥 IMPORTAMOS EL CONTEXTO GLOBAL DEL CAJERO
import { useCashierContext } from '../../features/cashier/components/context/CashierContext';
// 🔥 IMPORTAMOS LAS TRADUCCIONES
import { TRANSLATIONS, LanguageCode } from '../../locales/CashierTranslations';

export default function CashierProfile() {
  // 🔥 Consumimos el contexto global
  const { language, isDark } = useCashierContext();
  const t = TRANSLATIONS[language as LanguageCode] || TRANSLATIONS['es'];

  // 🔥 PALETA DE COLORES DINÁMICA
  const colors = {
    background: isDark ? '#0F172A' : '#F8FAFC',
    card: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#F8FAFC' : '#1E293B',
    muted: isDark ? '#94A3B8' : '#64748B',
    border: isDark ? '#334155' : '#E2E8F0',
    inputBg: isDark ? '#0F172A' : '#F8FAFC',
    inputDisabled: isDark ? '#334155' : '#F1F5F9',
    accent: '#EA1D2C', // Rojo de la marca SaborExpress
  };

  const [isEditing, setIsEditing] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Estados de datos
  const [cashierData, setCashierData] = useState({
    name: 'Cajero Principal',
    email: 'cajero@saborexpress.com',
    pin: '5678',
    avatar: null as string | null,
  });

  // Estados de validación
  const [errors, setErrors] = useState({
    name: '',
    pin: '',
  });

  // Función para guardar
  const handleSaveProfile = () => {
    let isValid = true;
    let newErrors = { name: '', pin: '' };

    if (!cashierData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio.';
      isValid = false;
    } else if (cashierData.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres.';
      isValid = false;
    }

    const pinRegex = /^\d{4}$/;
    if (!cashierData.pin.trim()) {
      newErrors.pin = 'El PIN es obligatorio.';
      isValid = false;
    } else if (!pinRegex.test(cashierData.pin.trim())) {
      newErrors.pin = 'El PIN debe ser exactamente de 4 dígitos numéricos.';
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
      setIsEditing(false);
      Alert.alert('¡Perfil Actualizado!', 'Tus datos han sido guardados correctamente.');
    }
  };

  const handleChangeText = (field: string, value: string) => {
    setCashierData({ ...cashierData, [field]: value });
    if (errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos permiso para acceder a tus imágenes.');
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
        if (uri) setCashierData({ ...cashierData, avatar: uri });
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.topHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.tabProfile || 'Mi Perfil'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* CABECERA DE PERFIL */}
        <View style={[styles.headerCard, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#E2E8F0' }]}>
          <TouchableOpacity 
            onPress={isEditing ? pickImage : undefined} 
            activeOpacity={isEditing ? 0.7 : 1}
            style={styles.avatarContainer}
          >
            {cashierData.avatar ? (
              <Image source={{ uri: cashierData.avatar }} style={styles.profilePic} />
            ) : (
              <View style={[styles.profilePicFallback, { borderColor: colors.border, backgroundColor: isDark ? '#334155' : '#EFF6FF' }]}>
                <Ionicons name="calculator" size={45} color={isDark ? '#F1F5F9' : '#1E293B'} />
              </View>
            )}
            {isEditing && (
              <View style={[styles.cameraIconBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="camera-outline" size={18} color={colors.text} />
              </View>
            )}
          </TouchableOpacity>

          <Text style={[styles.name, { color: colors.text }]}>{cashierData.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>CAJA REGISTRADORA</Text>
          </View>
        </View>

        {/* DATOS EDITABLES */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>Mis Datos</Text>
            <TouchableOpacity onPress={() => isEditing ? handleSaveProfile() : setIsEditing(true)}>
              <Text style={styles.editButtonText}>{isEditing ? 'Guardar' : 'Editar'}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.profileCard, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#E2E8F0' }]}>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Nombre completo</Text>
              <TextInput
                style={[
                  styles.input, 
                  { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text },
                  !isEditing && { backgroundColor: colors.inputDisabled, color: colors.muted },
                  errors.name ? styles.inputError : null
                ]}
                value={cashierData.name}
                onChangeText={(text) => handleChangeText('name', text)}
                editable={isEditing}
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Correo Electrónico</Text>
              <TextInput
                style={[
                  styles.input, 
                  { backgroundColor: colors.inputDisabled, borderColor: colors.border, color: colors.muted }
                ]}
                value={cashierData.email}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>PIN de Autorización</Text>
              <View style={styles.pinRow}>
                <TextInput
                  style={[
                    styles.input, 
                    { flex: 1, marginBottom: 0, backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text },
                    !isEditing && { backgroundColor: colors.inputDisabled, color: colors.muted },
                    errors.pin ? styles.inputError : null
                  ]}
                  value={showPin ? cashierData.pin : '****'}
                  onChangeText={(text) => handleChangeText('pin', text)}
                  secureTextEntry={!showPin}
                  keyboardType="numeric"
                  maxLength={4}
                  editable={isEditing}
                />
                <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.eyeButton}>
                  <Ionicons name={showPin ? 'eye-off' : 'eye'} size={24} color={colors.muted} />
                </TouchableOpacity>
              </View>
              {errors.pin ? <Text style={styles.errorText}>{errors.pin}</Text> : null}
            </View>

          </View>
        </View>

        {/* MÉTRICAS */}
        <View style={styles.metricsSection}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Rendimiento de Hoy</Text>
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#E2E8F0' }]}>
              <Ionicons name="cash-outline" size={28} color="#10B981" />
              <Text style={[styles.metricValue, { color: colors.text }]}>14</Text>
              <Text style={[styles.metricLabel, { color: colors.muted }]}>Mesas Cobradas</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#E2E8F0' }]}>
              <Ionicons name="wallet-outline" size={28} color="#3B82F6" />
              <Text style={[styles.metricValue, { color: colors.text }]}>$1.2M</Text>
              <Text style={[styles.metricLabel, { color: colors.muted }]}>Recaudado</Text>
            </View>
          </View>
        </View>

        {/* INFO DEL TURNO */}
        <View style={styles.shiftSection}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Información del Turno</Text>
          <View style={[styles.shiftCard, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#E2E8F0' }]}>
            <View style={styles.shiftRow}>
              <Ionicons name="log-in-outline" size={20} color={colors.muted} />
              <Text style={[styles.shiftLabel, { color: colors.text }]}>Hora de Entrada:</Text>
              <Text style={[styles.shiftValue, { color: colors.text }]}>08:00 AM</Text>
            </View>
            <View style={[styles.shiftDivider, { backgroundColor: colors.border }]} />
            <View style={styles.shiftRow}>
              <Ionicons name="desktop-outline" size={20} color="#EA1D2C" />
              <Text style={[styles.shiftLabel, { color: colors.text }]}>Estación Asignada:</Text>
              <Text style={[styles.shiftValue, { color: colors.text }]}>Caja Principal</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  container: { padding: 20, paddingBottom: 40 },
  
  headerCard: { alignItems: 'center', padding: 25, borderRadius: 20, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginBottom: 25 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  profilePicFallback: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  profilePic: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#EA1D2C' },
  cameraIconBadge: { position: 'absolute', right: -5, bottom: -5, borderRadius: 15, padding: 6, borderWidth: 1, elevation: 2 },
  name: { fontSize: 24, fontWeight: '900', marginBottom: 5 },
  roleBadge: { backgroundColor: 'rgba(234, 29, 44, 0.1)', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#EA1D2C' },
  roleText: { color: '#EA1D2C', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  profileSection: { marginBottom: 25 },
  profileHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  editButtonText: { color: '#EA1D2C', fontSize: 16, fontWeight: 'bold' },
  profileCard: { padding: 20, borderRadius: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 2 },
  
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 5 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 5, fontWeight: '600' },
  pinRow: { flexDirection: 'row', alignItems: 'center' },
  eyeButton: { marginLeft: 10, padding: 5 },

  metricsSection: { marginBottom: 25 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metricCard: { width: '48%', padding: 20, borderRadius: 20, alignItems: 'center', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 2 },
  metricValue: { fontSize: 28, fontWeight: '900', marginTop: 10, marginBottom: 2 },
  metricLabel: { fontSize: 12, fontWeight: '600' },
  
  shiftSection: { marginBottom: 20 },
  shiftCard: { borderRadius: 20, padding: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 2 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  shiftLabel: { flex: 1, fontSize: 15, marginLeft: 15 },
  shiftValue: { fontSize: 15, fontWeight: 'bold' },
  shiftDivider: { height: 1, marginVertical: 5 },
});