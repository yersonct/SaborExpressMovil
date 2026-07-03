'use client';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { ForgotPasswordFlow } from './ForgotPasswordFlow';
import { WorkerRegistrationFlow } from './WorkerRegistrationFlow';
import { ClientRegistrationFlow } from './ClientRegistrationFlow'; // <-- Importación del nuevo flujo de cliente
import { LanguageDropdown } from '../../../components/LanguageDropdown';
import { AuthInput } from './AuthInput';
import { AnimatedSuccessModal } from './AnimatedSuccessModal';

const translations = require('../../../locales/translations.json') as Record<string, Record<string, string>>;
type LanguageCode = 'es' | 'en' | 'pt' | 'fr';

export const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('es');
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
    const [showPassword, setShowPassword] = useState(false);

    // 1. Agregamos 'registerClient' a las vistas permitidas
    const [activeView, setActiveView] = useState<'login' | 'forgot' | 'registerWorker' | 'registerClient'>('login');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showWorkerSuccess, setShowWorkerSuccess] = useState(false);
    const [showClientSuccess, setShowClientSuccess] = useState(false); // Estado para éxito de cliente
    const [isNavigating, setIsNavigating] = useState(false);

    const { user, loading, error, handleLogin, handleLogout } = useAuth();
    const router = useRouter();
    const t = translations[selectedLanguage] || translations.es;

    // Animaciones fluidas (rojo dinámico)
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
        ]).start();
    }, [activeView]);

    useEffect(() => {
        const storedLanguage = globalThis.localStorage?.getItem('saborexpress-language') as LanguageCode | null;
        const storedTheme = globalThis.localStorage?.getItem('saborexpress-theme') as 'light' | 'dark' | null;
        if (storedLanguage && translations[storedLanguage]) setSelectedLanguage(storedLanguage);
        if (storedTheme === 'light' || storedTheme === 'dark') setThemeMode(storedTheme);
    }, []);

    useEffect(() => {
        globalThis.localStorage?.setItem('saborexpress-language', selectedLanguage);
    }, [selectedLanguage]);

    useEffect(() => {
        globalThis.localStorage?.setItem('saborexpress-theme', themeMode);
    }, [themeMode]);

    useEffect(() => {
        if (user && user.role) {
            setShowSuccessModal(true);
            setTimeout(() => {
                setShowSuccessModal(false);
                setIsNavigating(true);
                const role = user.role.toLowerCase();
                const routes: Record<string, any> = {
                    cajero: '/cashier', repartidor: '/delivery', mesero: '/waiter', cocinero: '/chef', cliente: '/client'
                };
                if (routes[role]) router.replace(routes[role]);
                else setIsNavigating(false);
            }, 3000);
        } else {
            setIsNavigating(false);
        }
    }, [user, router]);

    const isDark = themeMode === 'dark';
    const themeColors = {
        background: isDark ? '#09090B' : '#F8FAFC',
        surface: isDark ? '#18181B' : '#FFFFFF',
        text: isDark ? '#FAFAFA' : '#0F172A',
        mutedText: isDark ? '#A1A1AA' : '#64748B',
        border: isDark ? '#27272A' : '#E2E8F0',
        inputBackground: isDark ? '#09090B' : '#F8FAFC',
        buttonBackground: '#E61C24', // Color corporativo (Rojo)
        buttonText: '#FFFFFF',
        toggleBg: isDark ? '#27272A' : '#E2E8F0',
    };

    if (isNavigating) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.background }]}>
                <ActivityIndicator size="large" color="#E61C24" />
                <Text style={{ marginTop: 15, color: themeColors.mutedText, fontSize: 16, fontWeight: '500' }}>{t.openingPanel || 'Abriendo panel...'}</Text>
            </View>
        );
    }

    if (user && !showSuccessModal) {
        return (
            <View style={[styles.welcomeContainer, { backgroundColor: themeColors.background }]}>
                <Animated.View style={[styles.profileCard, { backgroundColor: themeColors.surface, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} style={styles.profileImage} />
                    <Text style={[styles.welcomeTitle, { color: themeColors.mutedText }]}>{t.welcomeBack}</Text>
                    <Text style={[styles.userName, { color: themeColors.text }]}>{user.name}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'USUARIO'}</Text>
                    </View>
                </Animated.View>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
                    <Text style={styles.logoutButtonText}>{t.logout}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
            {/* Cabecera Superior: Tema e Idioma */}
            <View style={styles.headerTopBar}>
                <View style={[styles.themeToggle, { backgroundColor: themeColors.toggleBg }]}>
                    <TouchableOpacity
                        style={[styles.themeIconButton, !isDark && styles.themeIconButtonActive]}
                        onPress={() => setThemeMode('light')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="sunny" size={18} color={!isDark ? '#E61C24' : themeColors.mutedText} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.themeIconButton, isDark && [styles.themeIconButtonActive, { backgroundColor: '#3F3F46' }]]}
                        onPress={() => setThemeMode('dark')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="moon" size={18} color={isDark ? '#FAFAFA' : themeColors.mutedText} />
                    </TouchableOpacity>
                </View>

                <View style={styles.languageSelectorContainer}>
                    <LanguageDropdown
                        label={''} compact value={selectedLanguage}
                        options={(['es', 'en', 'pt', 'fr'] as LanguageCode[]).map((lang) => ({
                            label: translations[lang].languageName, value: lang,
                        }))}
                        onChange={(value) => setSelectedLanguage(value as LanguageCode)}
                    />
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                    {activeView === 'login' && (
                        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
                            <Image source={require('../../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
                        </Animated.View>
                    )}

                    <Animated.View style={[styles.formContainer, { backgroundColor: themeColors.surface, shadowColor: isDark ? '#000' : '#E61C24', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

                        {activeView === 'forgot' && (
                            <TouchableOpacity style={styles.backButton} onPress={() => setActiveView('login')}>
                                <Ionicons name="arrow-back" size={20} color={themeColors.mutedText} style={{ marginRight: 5 }} />
                                <Text style={[styles.backButtonText, { color: themeColors.mutedText }]}>{t.backToLogin}</Text>
                            </TouchableOpacity>
                        )}

                        {activeView === 'login' && (
                            <>
                                <AuthInput
                                    label={t.usernameLabel}
                                    placeholder={t.usernamePlaceholder}
                                    value={username}
                                    onChangeText={setUsername}
                                    error={!!error}
                                    themeColors={themeColors}
                                />
                                <AuthInput
                                    label={t.passwordLabel}
                                    placeholder={t.passwordPlaceholder}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    showPasswordToggle={true}
                                    onTogglePassword={() => setShowPassword(!showPassword)}
                                    error={!!error}
                                    themeColors={themeColors}
                                />

                                <TouchableOpacity onPress={() => setActiveView('forgot')} style={styles.forgotPasswordContainer} activeOpacity={0.7}>
                                    <Text style={styles.forgotText}>{t.forgotPassword}</Text>
                                </TouchableOpacity>

                                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                                {loading ? (
                                    <ActivityIndicator size="large" color="#E61C24" style={styles.loader} />
                                ) : (
                                    <TouchableOpacity style={[styles.loginButton, { backgroundColor: themeColors.buttonBackground }]} onPress={() => handleLogin(username, password)} activeOpacity={0.8}>
                                        <Text style={[styles.loginButtonText, { color: themeColors.buttonText }]}>{t.signIn}</Text>
                                    </TouchableOpacity>
                                )}

                                {/* 2. Nuevo enlace de Registro para Clientes */}
                                <View style={styles.registerClientLinkContainer}>
                                    <Text style={[styles.registerClientText, { color: themeColors.mutedText }]}>{t.noAccount} </Text>
                                    <TouchableOpacity onPress={() => setActiveView('registerClient')}>
                                        <Text style={styles.registerClientAction}>{t.registerHere}</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Divisor visual */}
                                <View style={styles.dividerContainer}>
                                    <View style={[styles.line, { backgroundColor: themeColors.border }]} />
                                    <Text style={[styles.dividerText, { color: themeColors.mutedText }]}>O</Text>
                                    <View style={[styles.line, { backgroundColor: themeColors.border }]} />
                                </View>

                                <TouchableOpacity
                                    style={[styles.workWithUsBtn, { borderColor: themeColors.border }]}
                                    onPress={() => setActiveView('registerWorker')}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="briefcase-outline" size={18} color={themeColors.text} style={{ marginRight: 8 }} />
                                    <Text style={[styles.workWithUsText, { color: themeColors.text }]}>{t.workWithUs || 'Trabaja con nosotros'}</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {activeView === 'forgot' && (
                            <ForgotPasswordFlow
                                onSuccess={() => setActiveView('login')}
                                onCancel={() => setActiveView('login')}
                                t={t}
                                themeColors={themeColors}
                            />
                        )}

                        {activeView === 'registerWorker' && (
                            <WorkerRegistrationFlow
                                themeColors={themeColors}
                                t={t}
                                onCancel={() => setActiveView('login')}
                                onSuccess={() => {
                                    setActiveView('login');
                                    setShowWorkerSuccess(true);
                                    setTimeout(() => setShowWorkerSuccess(false), 3000);
                                }}
                            />
                        )}

                        {/* 3. Renderizado del nuevo flujo de registro de Clientes */}
                        {activeView === 'registerClient' && (
                            <ClientRegistrationFlow
                                themeColors={themeColors}
                                t={t}
                                onCancel={() => setActiveView('login')}
                                onSuccess={() => {
                                    setActiveView('login');
                                    setShowClientSuccess(true);
                                    setTimeout(() => setShowClientSuccess(false), 3000);
                                }}
                            />
                        )}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modales de Éxito con animaciones profesionales */}
            <AnimatedSuccessModal visible={showSuccessModal} title={t.successTitle} text={t.successText} />

            <AnimatedSuccessModal
                visible={showWorkerSuccess}
                title="¡Solicitud Enviada!"
                text="Hemos recibido tus datos. Nos pondremos en contacto contigo pronto."
            />

            <AnimatedSuccessModal
                visible={showClientSuccess}
                title="¡Cuenta Creada!"
                text="Tu cuenta ha sido registrada exitosamente. Ya puedes iniciar sesión."
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },

    headerTopBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 10,
        zIndex: 10,
    },
    themeToggle: {
        flexDirection: 'row',
        borderRadius: 30,
        padding: 4,
        alignItems: 'center',
    },
    themeIconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    themeIconButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    languageSelectorContainer: {
        width: 130,
    },

    scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 80 },
    logoContainer: { alignItems: 'center', marginBottom: -60 },
    logo: { width: '100%', height: 320, marginBottom: -20 },

    formContainer: {
        width: '100%', padding: 32, borderRadius: 24,
        shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 10,
    },
    backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    backButtonText: { fontSize: 15, fontWeight: '600' },
    forgotPasswordContainer: { alignItems: 'flex-end', marginBottom: 20, marginTop: -5 },
    forgotText: { color: '#E61C24', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
    errorText: { color: '#E61C24', fontSize: 14, textAlign: 'center', marginBottom: 15, fontWeight: '500', backgroundColor: 'rgba(230, 28, 36, 0.1)', padding: 10, borderRadius: 8 },
    loader: { marginTop: 10, marginBottom: 10 },

    loginButton: { height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#E61C24', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
    loginButtonText: { fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },

    // 4. Estilos para el texto interactivo de cliente
    registerClientLinkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
    registerClientText: { fontSize: 14, fontWeight: '500' },
    registerClientAction: { color: '#E61C24', fontSize: 14, fontWeight: 'bold' },

    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
    line: { flex: 1, height: 1 },
    dividerText: { marginHorizontal: 15, fontSize: 13, fontWeight: '600' },
    workWithUsBtn: { flexDirection: 'row', height: 54, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    workWithUsText: { fontSize: 15, fontWeight: '600' },

    welcomeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    profileCard: { width: '100%', borderRadius: 24, padding: 40, alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, marginBottom: 40 },
    profileImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 25, borderWidth: 4, borderColor: '#E61C24' },
    welcomeTitle: { fontSize: 16, marginBottom: 8, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    userName: { fontSize: 28, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
    roleBadge: { backgroundColor: 'rgba(230, 28, 36, 0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(230, 28, 36, 0.2)' },
    roleText: { color: '#E61C24', fontWeight: '800', fontSize: 13, letterSpacing: 1.2 },
    logoutButton: { width: '100%', height: 56, borderWidth: 2, borderColor: '#E61C24', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    logoutButtonText: { color: '#E61C24', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
});