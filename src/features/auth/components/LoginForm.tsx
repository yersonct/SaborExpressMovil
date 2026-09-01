'use client';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { ForgotPasswordFlow } from './ForgotPasswordFlow';
import { WorkerRegistrationFlow } from './WorkerRegistrationFlow';
import { ClientRegistrationFlow } from './ClientRegistrationFlow';
import { LanguageDropdown } from '../../../components/LanguageDropdown';
import { AuthInput } from './AuthInput';
import { AnimatedSuccessModal } from './AnimatedSuccessModal';
import { ROLE_ROUTES, ROLE_LABELS } from '../services/roleMap'; 
import { styles } from './style/LoginForm.styles';

const translations = require('../../../locales/translations.json') as Record<string, Record<string, string>>;
type LanguageCode = 'es' | 'en' | 'pt' | 'fr';

export const LoginForm = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('es');
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
    const [showPassword, setShowPassword] = useState(false);

    const [activeView, setActiveView] = useState<'login' | 'forgot' | 'registerWorker' | 'registerClient'>('login');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showWorkerSuccess, setShowWorkerSuccess] = useState(false);
    const [showClientSuccess, setShowClientSuccess] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    const { user, loading, error, handleLogin, handleLogout } = useAuth();
    const router = useRouter();
    const t = translations[selectedLanguage] || translations.es;

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true })
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
        if (user && user.roleId != null) {
            setShowSuccessModal(true);
            setTimeout(() => {
                setShowSuccessModal(false);
                setIsNavigating(true);
                // CORRECCIÓN 1: Forzamos el tipado con 'as any' para evitar el error de Record<RoleId, string>
                const route = ROLE_ROUTES[user.roleId as keyof typeof ROLE_ROUTES];
                if (route) router.replace(route as any);
                else setIsNavigating(false);
            }, 1200);
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
        buttonBackground: '#E61C24',
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
                    <Image source={require('../../../assets/images/image.png')} style={styles.profileImage} />
                    <Text style={[styles.welcomeTitle, { color: themeColors.mutedText }]}>{t.welcomeBack}</Text>
                    
                    {/* CORRECCIÓN 2: Cambiamos user.name por user.identifier */}
                    <Text style={[styles.userName, { color: themeColors.text }]}>{user.identifier}</Text>
                    
                    <View style={styles.roleBadge}>
                        {/* CORRECCIÓN 3: Agregamos 'as any' para mapear el rol sin errores de TypeScript */}
                     <Text style={styles.roleText}>{ROLE_LABELS[user.roleId as keyof typeof ROLE_LABELS] ?? 'USUARIO'}</Text>
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
                                    label={t.identifierLabel || t.usernameLabel}
                                    placeholder={t.identifierPlaceholder || t.usernamePlaceholder}
                                    value={identifier}
                                    onChangeText={setIdentifier}
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
                                    <TouchableOpacity
                                        style={[styles.loginButton, { backgroundColor: themeColors.buttonBackground }]}
                                        onPress={() => handleLogin(identifier, password)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.loginButtonText, { color: themeColors.buttonText }]}>{t.signIn}</Text>
                                    </TouchableOpacity>
                                )}

                                <View style={styles.registerClientLinkContainer}>
                                    <Text style={[styles.registerClientText, { color: themeColors.mutedText }]}>{t.noAccount} </Text>
                                    <TouchableOpacity onPress={() => setActiveView('registerClient')}>
                                        <Text style={styles.registerClientAction}>{t.registerHere}</Text>
                                    </TouchableOpacity>
                                </View>

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