import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, ScrollView, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { profileStyles as styles } from './style/ProfileStyles';
import { useWaiterTheme } from '@/features/waiter/context/WaiterThemeContext';
import { useWaiterLanguage } from '@/features/waiter/context/WaiterLanguageContext';
import * as ImagePicker from 'expo-image-picker';

export const WaiterProfileView = () => {
  const { colors } = useWaiterTheme();
  const { t } = useWaiterLanguage();
  const [isEditing, setIsEditing] = useState(false);

  const [waiterData, setWaiterData] = useState({
    name: 'Juan Pérez',
    phone: '+57 300 111 2233',
    email: 'juan.perez@saborexpress.com',
    pin: '1234',
    avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
  });

  const [errors, setErrors] = useState({
    name: '',
    pin: ''
  });
  const [showPin, setShowPin] = useState(false);

  const handleSaveProfile = () => {
    let isValid = true;
    let newErrors = { name: '', pin: '' };

    if (!waiterData.name.trim()) {
      newErrors.name = t.profileNameErrorRequired || 'El nombre es obligatorio.';
      isValid = false;
    } else if (waiterData.name.trim().length < 3) {
      newErrors.name = t.profileNameErrorMin || 'El nombre debe tener al menos 3 caracteres.';
      isValid = false;
    }

    const pinRegex = /^\d{4}$/;
    if (!waiterData.pin.trim()) {
      newErrors.pin = t.profilePinErrorRequired || 'El PIN es obligatorio.';
      isValid = false;
    } else if (!pinRegex.test(waiterData.pin.trim())) {
      newErrors.pin = t.profilePinErrorFormat || 'El PIN debe ser exactamente de 4 dígitos numéricos.';
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
      setIsEditing(false);
      try { globalThis.localStorage?.setItem('saborexpress-waiter-profile', JSON.stringify(waiterData)); } catch (e) { }
      Alert.alert(t.profileUpdatedTitle || '¡Perfil Actualizado!', t.profileUpdatedMessage || 'Tus datos han sido guardados correctamente.');
    }
  };

  const handleChangeText = (field: string, value: string) => {
    setWaiterData({ ...waiterData, [field]: value });
    if (errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  useEffect(() => {
    try {
      const stored = globalThis.localStorage?.getItem('saborexpress-waiter-profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        setWaiterData((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) { }
  }, []);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t.profileImagePermissionTitle || 'Permiso requerido', t.profileImagePermissionMessage || 'Necesitamos permiso para acceder a tus imágenes.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] });
      const canceled = (result as any).canceled ?? (result as any).cancelled ?? false;
      if (!canceled) {
        const uri = (result as any).assets?.[0]?.uri ?? (result as any).uri;
        if (uri) setWaiterData({ ...waiterData, avatar: uri });
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.header, borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.profileTitle || 'Mi Perfil'}</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>

        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.profilePerformanceTitle || 'Desempeño del Turno'}</Text>
          <View style={[styles.statsCard, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
            <View style={styles.statColumn}>
              <Ionicons name="receipt" size={28} color="#3B82F6" />
              <Text style={[styles.statValue, { color: colors.text }]}>24</Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>{t.profileStatsTables || 'Mesas Atendidas'}</Text>
            </View>
            <View style={[styles.dividerVertical, { backgroundColor: colors.border }]} />
            <View style={styles.statColumn}>
              <Ionicons name="cash" size={28} color="#10B981" />
              <Text style={[styles.statValue, { color: colors.text }]}>$45k</Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>{t.profileStatsTips || 'Propinas'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.profileDataTitle || 'Mis Datos'}</Text>
            <TouchableOpacity onPress={() => isEditing ? handleSaveProfile() : setIsEditing(true)}>
              <Text style={[styles.editButtonText, { color: colors.accent }]}>{isEditing ? (t.profileSave || 'Guardar') : (t.profileEdit || 'Editar')}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.profileCard, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={isEditing ? pickImage : undefined} accessibilityLabel="Editar avatar">
                <Image source={{ uri: waiterData.avatar }} style={styles.avatar} />
                {isEditing && (
                  <View style={{ position: 'absolute', right: -4, bottom: -4, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 6 }}>
                    <Ionicons name="camera-outline" size={18} color="#111" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>{t.profileNameLabel || 'Nombre completo'}</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                  !isEditing && styles.inputDisabled,
                  errors.name ? styles.inputError : null
                ]}
                value={waiterData.name}
                onChangeText={(text) => handleChangeText('name', text)}
                editable={isEditing}
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>{t.profileEmailLabel || 'Correo Electrónico'}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }, styles.inputDisabled]}
                value={waiterData.email}
                editable={false}
              />
            </View>

            {/* 🔥 SECCIÓN DE PIN CORREGIDA 🔥 */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>{t.profilePinLabel || 'PIN de Autorización'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, flex: 1 },
                    !isEditing && styles.inputDisabled,
                    errors.pin ? styles.inputError : null
                  ]}
                  // 1. Si el ojito está activo (showPin), muestra el PIN real, sin importar si estamos editando o no.
                  // Si no está activo, muestra los asteriscos.
                  value={showPin ? waiterData.pin : '****'}
                  onChangeText={(text) => handleChangeText('pin', text)}
                  // 2. Solo ocultar texto si NO han presionado el botón showPin
                  secureTextEntry={!showPin}
                  keyboardType="numeric"
                  maxLength={4}
                  editable={false} // 3. Se bloquea para SIEMPRE, el mesero nunca puede editar esto
                />

                {/* 4. El ojito ahora siempre está visible, no está condicionado a isEditing */}
                <TouchableOpacity onPress={() => setShowPin(!showPin)} style={{ marginLeft: 8, padding: 8 }} accessibilityLabel="Mostrar PIN">
                  <Ionicons name={showPin ? 'eye-off' : 'eye'} size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
              {errors.pin ? <Text style={styles.errorText}>{errors.pin}</Text> : null}
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};