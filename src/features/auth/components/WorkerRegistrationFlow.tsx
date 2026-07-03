import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AuthInput } from './AuthInput';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

interface WorkerRegistrationFlowProps {
    onSuccess: () => void;
    onCancel: () => void;
    themeColors: any;
    t: any; // <-- Agregamos el objeto de traducciones
}

export const WorkerRegistrationFlow: React.FC<WorkerRegistrationFlowProps> = ({ onSuccess, onCancel, themeColors, t }) => {
    const [formData, setFormData] = useState({ fullName: '', documentId: '', email: '', phone: '' });
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [cvFile, setCvFile] = useState<{ uri: string; name: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Movemos los roles adentro para que puedan usar el idioma actual
    const ROLES = [
        { id: 'cocinero', label: t.roleChef || 'Cocinero', icon: 'restaurant-outline' },
        { id: 'mesero', label: t.roleWaiter || 'Mesero', icon: 'cafe-outline' },
        { id: 'cajero', label: t.roleCashier || 'Cajero', icon: 'cash-outline' },
        { id: 'repartidor', label: t.roleDelivery || 'Repartidor', icon: 'bicycle-outline' },
    ];

    const validateForm = () => {
        if (!formData.fullName.trim() || formData.fullName.length < 4) return t.errFullName || 'Ingresa un nombre completo válido.';
        if (!/^\d{7,11}$/.test(formData.documentId)) return t.errId || 'Ingresa un número de cédula válido (solo números).';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return t.errEmail || 'Ingresa un correo electrónico válido.';
        if (!/^\d{10}$/.test(formData.phone)) return t.errPhone || 'Ingresa un número de celular válido (10 dígitos).';
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
            console.log('Error al seleccionar el archivo', err);
            setError(t.errCvLoad || 'Hubo un error al cargar el archivo.');
        }
    };

    const handleRegister = () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }
        
        setError('');
        setLoading(true);

        // Aquí envías formData, selectedRole y cvFile.uri a tu backend
        setTimeout(() => {
            setLoading(false);
            onSuccess();
        }, 2000);
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
                label={t.fullNameLabel || "Nombre Completo"}
                placeholder={t.fullNamePlaceholder || "Ej. Juan Pérez"}
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                themeColors={themeColors}
            />

            <AuthInput
                label={t.idLabel || "Cédula de Ciudadanía"}
                placeholder={t.idPlaceholder || "Ej. 1001234567"}
                value={formData.documentId}
                onChangeText={(text) => setFormData({ ...formData, documentId: text.replace(/[^0-9]/g, '') })}
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
                label={t.phoneLabel || "Teléfono Celular"}
                placeholder={t.phonePlaceholder || "Ej. 3001234567"}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text.replace(/[^0-9]/g, '') })}
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

const styles = StyleSheet.create({
    container: { width: '100%' },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    backButton: { paddingRight: 15 },
    title: { fontSize: 22, fontWeight: 'bold' },
    subtitle: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4, marginTop: 10 },
    rolesContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 15 },
    roleCard: {
        width: '48%', padding: 15, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center'
    },
    roleCardActive: { backgroundColor: '#E61C24', borderColor: '#E61C24' },
    roleText: { marginTop: 8, fontSize: 14, fontWeight: '600' },
    
    cvButton: {
        flexDirection: 'row', alignItems: 'center', height: 54, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', paddingHorizontal: 15, marginBottom: 20
    },
    cvButtonText: { fontSize: 14, marginLeft: 10, flex: 1, fontWeight: '500' },

    errorText: { color: '#E61C24', fontSize: 14, textAlign: 'center', marginBottom: 15, fontWeight: '600', backgroundColor: 'rgba(230, 28, 36, 0.1)', padding: 10, borderRadius: 8 },
    submitButton: { height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 5, shadowColor: '#E61C24', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
    submitButtonText: { fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
});