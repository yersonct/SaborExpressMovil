import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AuthInput } from './AuthInput';
import { Ionicons } from '@expo/vector-icons';

interface ClientRegistrationFlowProps {
    onSuccess: () => void;
    onCancel: () => void;
    themeColors: any;
    t: any;
}

export const ClientRegistrationFlow: React.FC<ClientRegistrationFlowProps> = ({ onSuccess, onCancel, themeColors, t }) => {
    const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const validateForm = () => {
        if (!formData.fullName.trim() || formData.fullName.length < 3) return t?.clientErrFullName || 'Ingresa tu nombre completo.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return t?.errEmail || 'Ingresa un correo electrónico válido.';
        if (!/^\d{10}$/.test(formData.phone)) return t?.errPhone || 'Ingresa un número de celular válido (10 dígitos).';
        if (formData.password.length < 6) return t?.clientErrPassword || 'La contraseña debe tener al menos 6 caracteres.';
        if (formData.password !== formData.confirmPassword) return t?.clientErrPasswordMatch || 'Las contraseñas no coinciden.';
        return '';
    };

    const handleRegister = () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setError('');
        setLoading(true);

        // Aquí va la lógica de conexión a tu base de datos para crear el cliente
        setTimeout(() => {
            setLoading(false);
            onSuccess();
        }, 1500);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onCancel} style={styles.backButton} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: themeColors.text }]}>{t?.clientRegistrationTitle || 'Crear Cuenta'}</Text>
            </View>

            <Text style={[styles.subtitle, { color: themeColors.mutedText }]}>
                {t?.clientRegistrationSubtitle || 'Regístrate para pedir tus platos favoritos más rápido.'}
            </Text>

            <AuthInput
                label={t?.fullNameLabel || 'Nombre Completo'}
                placeholder={t?.clientFullNamePlaceholder || 'Ej. María Gómez'}
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                themeColors={themeColors}
            />

            <AuthInput
                label={t?.emailLabel || 'Correo Electrónico'}
                placeholder={t?.clientEmailPlaceholder || 'maria@ejemplo.com'}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                themeColors={themeColors}
            />

            <AuthInput
                label={t?.phoneLabel || 'Teléfono Celular'}
                placeholder={t?.clientPhonePlaceholder || 'Ej. 3001234567'}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text.replace(/[^0-9]/g, '') })}
                themeColors={themeColors}
            />

            <AuthInput
                label={t?.passwordLabel || 'Contraseña'}
                placeholder={t?.clientPasswordPlaceholder || 'Crea una contraseña segura'}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry={!showPassword}
                showPasswordToggle={true}
                onTogglePassword={() => setShowPassword(!showPassword)}
                themeColors={themeColors}
            />

            <AuthInput
                label={t?.clientConfirmPasswordLabel || 'Confirmar Contraseña'}
                placeholder={t?.clientConfirmPasswordPlaceholder || 'Repite tu contraseña'}
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                secureTextEntry={!showConfirmPassword}
                showPasswordToggle={true}
                onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                themeColors={themeColors}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {loading ? (
                <ActivityIndicator size="large" color="#E61C24" style={{ marginTop: 20 }} />
            ) : (
                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: themeColors.buttonBackground }]}
                    onPress={handleRegister}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.submitButtonText, { color: themeColors.buttonText }]}>
                        {t?.clientRegisterButton || 'Registrarme'}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%' },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    backButton: { paddingRight: 15 },
    title: { fontSize: 22, fontWeight: 'bold' },
    subtitle: { fontSize: 14, marginBottom: 25, lineHeight: 20 },
    errorText: { color: '#E61C24', fontSize: 14, textAlign: 'center', marginBottom: 15, fontWeight: '600', backgroundColor: 'rgba(230, 28, 36, 0.1)', padding: 10, borderRadius: 8 },
    submitButton: { height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#E61C24', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
    submitButtonText: { fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
});