import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AuthInput } from './AuthInput';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { authService } from '../services/authService'; // <-- Conexión real
import { styles } from './style/WorkerRegistrationFlow';

interface WorkerRegistrationFlowProps {
    onSuccess: () => void;
    onCancel: () => void;
    themeColors: any;
    t: any; 
}

export const WorkerRegistrationFlow: React.FC<WorkerRegistrationFlowProps> = ({ onSuccess, onCancel, themeColors, t }) => {
    // 1. Ajustamos los campos al DTO de C#
    const [formData, setFormData] = useState({ 
        name: '', 
        lastName: '', 
        document: '', 
        email: '', 
        password: '', 
        confirmPassword: '' 
    });
    
    // 2. selectedRole ahora guardará un número (2, 3, 4 o 5)
    const [selectedRole, setSelectedRole] = useState<number | null>(null);
    const [cvFile, setCvFile] = useState<{ uri: string; name: string } | null>(null);
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Mapeo exacto con tus RoleId de types/role.ts
    const ROLES = [
        { id: 3, label: t.roleChef || 'Cocinero', icon: 'restaurant-outline' },
        { id: 4, label: t.roleWaiter || 'Mesero', icon: 'cafe-outline' },
        { id: 5, label: t.roleCashier || 'Cajero', icon: 'cash-outline' },
        { id: 2, label: t.roleDelivery || 'Repartidor', icon: 'bicycle-outline' },
    ];

    const validateForm = () => {
        if (!formData.name.trim()) return 'Ingresa tu nombre.';
        if (/\d/.test(formData.name)) return 'El nombre no puede contener números.'; 
        
        if (!formData.lastName.trim()) return 'Ingresa tu apellido.';
        if (/\d/.test(formData.lastName)) return 'El apellido no puede contener números.'; 
        
        if (!/^\d{7,11}$/.test(formData.document)) return t.errId || 'Ingresa un número de documento válido.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return t.errEmail || 'Ingresa un correo válido.';
        
        if (formData.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
        if (formData.password !== formData.confirmPassword) return 'Las contraseñas no coinciden.';
        
        if (!selectedRole) return t.errRole || 'Debes seleccionar el rol al que te postulas.';
        if (!cvFile) return t.errCv || 'Debes adjuntar tu hoja de vida (PDF/Word).';
        
        return '';
    };

    const handlePickCV = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets.length > 0) {
                setCvFile({ uri: result.assets[0].uri, name: result.assets[0].name });
                setError('');
            }
        } catch (err) {
            setError(t.errCvLoad || 'Hubo un error al cargar el archivo.');
        }
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
            // 3. Petición real al backend
            await authService.registerWorker({
                name: formData.name,
                lastName: formData.lastName,
                document: formData.document,
                email: formData.email,
                password: formData.password,
                roleId: selectedRole
            });

            // Nota: Aquí a futuro deberás hacer otra petición (multipart/form-data) 
            // enviando el cvFile.uri a un nuevo endpoint en C# para guardar el archivo.

            setLoading(false);
            onSuccess();
        } catch (err: any) {
            setLoading(false);
            setError(err.message || 'Error al enviar la solicitud.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onCancel} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: themeColors.text }]}>{t.joinTeamTitle || 'Únete al Equipo'}</Text>
            </View>

            <Text style={[styles.subtitle, { color: themeColors.mutedText }]}>
                {t.joinTeamSubtitle || 'Completa tus datos reales y adjunta tu hoja de vida.'}
            </Text>

            <AuthInput
                label="Nombre"
                placeholder="Ej. Juan"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                themeColors={themeColors}
            />

            <AuthInput
                label="Apellido"
                placeholder="Ej. Pérez"
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                themeColors={themeColors}
            />

            <AuthInput
                label={t.idLabel || "Documento de Identidad"}
                placeholder={t.idPlaceholder || "Ej. 1001234567"}
                value={formData.document}
                onChangeText={(text) => setFormData({ ...formData, document: text.replace(/[^0-9]/g, '') })}
                themeColors={themeColors}
            />
            
            <AuthInput
                label={t.emailLabel || "Correo Electrónico"}
                placeholder={t.emailPlaceholder || "juan@ejemplo.com"}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                themeColors={themeColors}
            />

            <AuthInput
                label="Contraseña"
                placeholder="Crea una contraseña segura"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry={!showPassword}
                showPasswordToggle={true}
                onTogglePassword={() => setShowPassword(!showPassword)}
                themeColors={themeColors}
            />

            <AuthInput
                label="Confirmar Contraseña"
                placeholder="Repite tu contraseña"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                secureTextEntry={!showConfirmPassword}
                showPasswordToggle={true}
                onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                themeColors={themeColors}
            />

            <Text style={[styles.label, { color: themeColors.text }]}>{t.roleSelectLabel || '¿A qué rol te postulas?'}</Text>
            <View style={styles.rolesContainer}>
                {ROLES.map((role) => (
                    <TouchableOpacity
                        key={role.id}
                        style={[
                            styles.roleCard,
                            { borderColor: themeColors.border, backgroundColor: themeColors.inputBackground },
                            selectedRole === role.id && styles.roleCardActive
                        ]}
                        onPress={() => setSelectedRole(role.id)}
                        activeOpacity={0.7}
                    >
                        <Ionicons 
                            name={role.icon as any} 
                            size={24} 
                            color={selectedRole === role.id ? '#FFFFFF' : themeColors.mutedText} 
                        />
                        <Text style={[styles.roleText, { color: selectedRole === role.id ? '#FFFFFF' : themeColors.text }]}>
                            {role.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={[styles.label, { color: themeColors.text }]}>{t.cvLabel || 'Hoja de Vida'}</Text>
            <TouchableOpacity 
                style={[styles.cvButton, { borderColor: cvFile ? '#10B981' : themeColors.border, backgroundColor: themeColors.inputBackground }]} 
                onPress={handlePickCV}
                activeOpacity={0.7}
            >
                <Ionicons name={cvFile ? "checkmark-circle" : "document-attach-outline"} size={24} color={cvFile ? '#10B981' : themeColors.mutedText} />
                <Text style={[styles.cvButtonText, { color: cvFile ? '#10B981' : themeColors.text }]} numberOfLines={1}>
                    {cvFile ? cvFile.name : (t.cvPlaceholder || 'Subir archivo (PDF o Word)')}
                </Text>
            </TouchableOpacity>

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
                        {t.submitRequest || 'Enviar Solicitud'}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

// Los estilos (StyleSheet.create) quedan exactamente igual a los de tu archivo original.
// Pega tus estilos aquí debajo...