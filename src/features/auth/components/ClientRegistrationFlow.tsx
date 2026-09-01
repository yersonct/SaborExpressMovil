import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AuthInput } from './AuthInput';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/authService';
import { RoleId } from '../types';
import { styles } from './style/ClientRegistrationFlow.styles';

interface ClientRegistrationFlowProps {
    onSuccess: () => void;
    onCancel: () => void;
    themeColors: any;
    t: any;
}

export const ClientRegistrationFlow: React.FC<ClientRegistrationFlowProps> = ({ onSuccess, onCancel, themeColors, t }) => {
    const [formData, setFormData] = useState({
        name: '',
        lastName: '',
        document: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const validateForm = () => {
        if (!formData.name.trim()) return 'Ingresa tu nombre.';
        if (/\d/.test(formData.name)) return 'El nombre no puede contener números.';

        if (!formData.lastName.trim()) return 'Ingresa tu apellido.';
        if (/\d/.test(formData.lastName)) return 'El apellido no puede contener números.';

        if (!formData.document.trim()) return 'Ingresa tu documento de identidad.';

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return t?.errEmail || 'Ingresa un correo electrónico válido.';
        if (formData.password.length < 6) return t?.clientErrPassword || 'La contraseña debe tener al menos 6 caracteres.';
        if (formData.password !== formData.confirmPassword) return t?.clientErrPasswordMatch || 'Las contraseñas no coinciden.';
        return '';
    };

    const handleRegister = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setError('');
        setLoading(true);

        try {
            await authService.registerClient({
                name: formData.name,
                lastName: formData.lastName,
                document: formData.document,
                email: formData.email,
                password: formData.password,
                roleId: RoleId.Cliente, 
            });

            setLoading(false);
            onSuccess();
        } catch (err: any) {
            setLoading(false);
            if (__DEV__) {
                console.log("ERROR REAL DE FETCH:", err);
            }
            setError(err.message || 'Error al conectar con el servidor.');
        }
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
                label="Nombre"
                placeholder="Ej. Yerson"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                themeColors={themeColors}
            />

            <AuthInput
                label="Apellido"
                placeholder="Ej. Rubiano"
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                themeColors={themeColors}
            />

            <AuthInput
                label="Documento de Identidad"
                placeholder="Ej. 1075225115"
                value={formData.document}
                onChangeText={(text) => setFormData({ ...formData, document: text.replace(/[^0-9]/g, '') })}
                themeColors={themeColors}
            />

            <AuthInput
                label={t?.emailLabel || 'Correo Electrónico'}
                placeholder={t?.clientEmailPlaceholder || 'correo@ejemplo.com'}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
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