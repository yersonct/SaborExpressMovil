'use client';

import React, { useState, useEffect } from 'react';
// IMPORTANTE: Asegúrate de importar Modal
import { View, Text, TextInput, StyleSheet, ActivityIndicator, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { ForgotPasswordFlow } from './ForgotPasswordFlow';

export const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [activeView, setActiveView] = useState<'login' | 'forgot'>('login');
    
    // NUEVO ESTADO: Controla si se muestra la alerta de éxito flotante
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const { user, loading, error, handleLogin, handleLogout } = useAuth();
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        if (user && user.role) {
            // 1. Cuando el login es exitoso, mostramos el modal
            setShowSuccessModal(true);
            
            // 2. Esperamos 3 segundos (3000 ms)
            setTimeout(() => {
                // 3. Cerramos el modal
                setShowSuccessModal(false);
                setIsNavigating(true);
                
                // 4. Redirigimos al usuario a su panel correspondiente
                const role = user.role.toLowerCase();
                if (role === 'cajero') router.replace('/cashier');
                else if (role === 'repartidor') router.replace('/delivery');
                else if (role === 'mesero') router.replace('/waiter');
                else if (role === 'cocinero') router.replace('/chef');
                else setIsNavigating(false);
                
            }, 3000); // <-- 3 segundos de espera

        } else {
            setIsNavigating(false);
        }
    }, [user, router]);

    const onLoginPress = () => {
        handleLogin(username, password);
    };

    if (isNavigating) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#E61C24" />
                <Text style={{ marginTop: 10, color: '#64748B', fontSize: 16 }}>Abriendo tu panel...</Text>
            </View>
        );
    }

    if (user && !showSuccessModal) {
        return (
            <View style={[styles.welcomeContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                <View style={styles.profileCard}>
                    <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} style={styles.profileImage} />
                    <Text style={styles.welcomeTitle}>Welcome back!</Text>
                    <Text style={styles.userName}>{user.name}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'USUARIO'}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">

                {activeView === 'login' && (
                    <>
                        <View style={styles.logoContainer}>
                            <Image source={require('../../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
                        </View>
                    </>
                )}

                <View style={styles.formContainer}>
                    {activeView === 'forgot' && (
                        <TouchableOpacity style={styles.backButton} onPress={() => setActiveView('login')}>
                            <Text style={[styles.backButtonText, styles.BigText]}>← Volver al login</Text>
                        </TouchableOpacity>
                    )}

                    {activeView === 'login' ? (
                        <>
                            <Text style={styles.inputLabel}>Nombre de usuario</Text>
                            <View style={[styles.inputWrapper, error ? styles.inputErrorBorder : null]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej: cajero123"
                                    placeholderTextColor="#A0A0A0"
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            <Text style={styles.inputLabel}>Contraseña</Text>
                            <View style={[styles.inputWrapper, error ? styles.inputErrorBorder : null]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="******"
                                    placeholderTextColor="#A0A0A0"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                            </View>

                            <TouchableOpacity onPress={() => setActiveView('forgot')} style={{ alignItems: 'flex-end', marginBottom: 10 }}>
                                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                            </TouchableOpacity>

                            {error ? <Text style={styles.errorText}>{error}</Text> : null}

                            {loading ? (
                                <ActivityIndicator size="large" color="#E61C24" style={styles.loader} />
                            ) : (
                                <TouchableOpacity style={styles.loginButton} onPress={onLoginPress} activeOpacity={0.8}>
                                    <Text style={styles.loginButtonText}>Sign in</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    ) : (
                        <ForgotPasswordFlow
                            onSuccess={() => setActiveView('login')}
                            onCancel={() => setActiveView('login')}
                        />
                    )}
                </View>
            </ScrollView>

            {/* NUEVO: MODAL DE ÉXITO QUE SE CIERRA AUTOMÁTICAMENTE */}
            <Modal
                transparent={true}
                visible={showSuccessModal}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Puedes poner un icono de checkmark de Flaticon aquí */}
                        <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/190/190411.png' }} style={styles.successIcon} />
                        <Text style={styles.modalTitle}>¡Ingreso Exitoso!</Text>
                        <Text style={styles.modalText}>
                            Tus datos son correctos. Bienvenido a SaborExpress.
                        </Text>
                        <ActivityIndicator size="small" color="#10B981" style={{ marginTop: 15 }} />
                    </View>
                </View>
            </Modal>

        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
    logoContainer: { alignItems: 'center', marginBottom: 10 },
    logo: { width: 520, height: 350 , marginBottom: -60 },
    headerContainer: { alignItems: 'center', marginBottom: 30 },
    
    formContainer: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
    },

    backButton: { marginBottom: 20 },
    backButtonText: { color: '#64748B', fontSize: 14, fontWeight: 'bold' },
    forgotText: { color: '#E61C24', fontSize: 13, fontWeight: '600' },

    inputLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 8, marginLeft: 4 },
    inputWrapper: { height: 50, backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1, borderColor: '#CBD5E1', marginBottom: 16 },
    inputErrorBorder: { borderColor: '#E61C24' },
    input: { fontSize: 15, color: '#0F172A' },
    errorText: { color: '#E61C24', fontSize: 14, textAlign: 'center', marginBottom: 15 },
    loader: { marginTop: 20 },
    loginButton: { height: 52, backgroundColor: '#E61C24', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
    loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

    welcomeContainer: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 24 },
    profileCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 30, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, marginBottom: 30 },
    profileImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 20 },
    welcomeTitle: { fontSize: 20, color: '#64748B', marginBottom: 5 },
    userName: { fontSize: 24, fontWeight: 'bold', color: '#0F172A', marginBottom: 15 },
    roleBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    roleText: { color: '#E61C24', fontWeight: 'bold', fontSize: 14 },
    logoutButton: { width: '100%', height: 50, borderWidth: 1, borderColor: '#E61C24', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    logoutButtonText: { color: '#E61C24', fontSize: 16, fontWeight: 'bold' },

    BigText: { fontSize: 15, color: '#334155' },

    // ESTILOS PARA EL MODAL DE ÉXITO
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10
    },
    successIcon: {
        width: 60,
        height: 60,
        marginBottom: 15
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 8
    },
    modalText: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20
    }
});