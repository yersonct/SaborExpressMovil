import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { authService } from '../services/authService';

const StepProgress = ({ currentStep }: { currentStep: number }) => (
    <View style={styles.progressContainer}>
        {[1, 2, 3].map((step) => (
            <View key={step} style={styles.stepWrapper}>
                <View style={[styles.dot,
                step === currentStep ? styles.dotActive : (step < currentStep ? styles.dotCompleted : styles.dotInactive)
                ]} />
                {step < 3 && <View style={[styles.line, step < currentStep ? styles.lineCompleted : styles.lineInactive]} />}
            </View>
        ))}
    </View>
);

export const ForgotPasswordFlow = ({
    onSuccess,
    onCancel,
    t,
    themeColors
}: {
    onSuccess: () => void,
    onCancel: () => void,
    t?: Record<string, string>,
    themeColors?: Record<string, string>
}) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const defaultT = t || {};
    const defaultColors = themeColors || {
        text: '#0F172A',
        mutedText: '#64748B',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        border: '#CBD5E1',
        inputBackground: '#FFFFFF',
    };

    const handleSendCode = async () => {
        if (!email) { setError('Ingresa un correo electrónico'); return; }
        setError(''); setLoading(true);
        try {
            await authService.requestPasswordReset(email);
            Alert.alert('Éxito', `Código 123456 enviado a ${email}`);
            setStep(2);
        } catch (err: any) {
            setError(err.message || 'No se pudo enviar el código');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!code) { setError('Ingresa el código'); return; }
        setError(''); setLoading(true);
        try {
            await authService.verifyPasswordResetCode(email, code);
            setStep(3);
        } catch (err: any) {
            setError(err.message || 'Código incorrecto');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword) { setError('Ingresa una nueva contraseña'); return; }
        setError(''); setLoading(true);
        try {
            await authService.resetPassword(email, code, newPassword);
            Alert.alert('¡Listo!', 'Contraseña actualizada con éxito');
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Error al actualizar contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: defaultColors.background }]}>
            <StepProgress currentStep={step} />

            <View style={styles.header}>
                <Text style={[styles.title, { color: defaultColors.text }]}>
                    {step === 1 ? defaultT.forgotPasswordStep1Title || 'Recuperar Contraseña' : step === 2 ? defaultT.forgotPasswordStep2Title || 'Ingresa el Código' : defaultT.forgotPasswordStep3Title || 'Nueva Contraseña'}
                </Text>
                <Text style={[styles.subtitle, { color: defaultColors.mutedText }]}>
                    {step === 1 ? defaultT.forgotPasswordStep1Subtitle || 'Ingresa tu correo para recibir un código.' : step === 2 ? defaultT.forgotPasswordStep2Subtitle || 'Revisa tu bandeja de entrada.' : defaultT.forgotPasswordStep3Subtitle || 'Crea tu nueva contraseña segura.'}
                </Text>
            </View>

            {step === 1 && (
                <View>
                    <Text style={[styles.inputLabel, { color: defaultColors.text }]}>{defaultT.forgotPasswordEmail || 'Correo electrónico'}</Text>
                    <TextInput
                        style={[styles.input, error ? styles.inputError : null, { backgroundColor: defaultColors.inputBackground, borderColor: defaultColors.border, color: defaultColors.text }]}
                        placeholder={defaultT.forgotPasswordPlaceholder || 'Ej: cajero@saborexpress.com'}
                        value={email}
                        onChangeText={(val) => { setEmail(val); setError(''); }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    {loading ? <ActivityIndicator size="large" color="#E61C24" style={styles.loader} /> : (
                        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#E61C24' }]} onPress={handleSendCode}>
                            <Text style={styles.primaryButtonText}>{defaultT.forgotPasswordSendCode || 'Enviar Código'}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {step === 2 && (
                <View>
                    <Text style={[styles.inputLabel, { color: defaultColors.text }]}>{defaultT.forgotPasswordCode || 'Código de 6 dígitos'}</Text>
                    <TextInput
                        style={[styles.input, styles.inputCenter, error ? styles.inputError : null, { backgroundColor: defaultColors.inputBackground, borderColor: defaultColors.border, color: defaultColors.text }]}
                        placeholder="123456"
                        maxLength={6}
                        value={code}
                        onChangeText={(val) => { setCode(val); setError(''); }}
                        keyboardType="number-pad"
                    />
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    {loading ? <ActivityIndicator size="large" color="#E61C24" style={styles.loader} /> : (
                        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#E61C24' }]} onPress={handleVerifyCode}>
                            <Text style={styles.primaryButtonText}>{defaultT.forgotPasswordVerifyCode || 'Verificar Código'}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {step === 3 && (
                <View>
                    <Text style={[styles.inputLabel, { color: defaultColors.text }]}>{defaultT.forgotPasswordNewPassword || 'Nueva Contraseña'}</Text>
                    <TextInput
                        style={[styles.input, error ? styles.inputError : null, { backgroundColor: defaultColors.inputBackground, borderColor: defaultColors.border, color: defaultColors.text }]}
                        placeholder="******"
                        secureTextEntry
                        value={newPassword}
                        onChangeText={(val) => { setNewPassword(val); setError(''); }}
                    />
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    {loading ? <ActivityIndicator size="large" color="#E61C24" style={styles.loader} /> : (
                        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#E61C24' }]} onPress={handleResetPassword}>
                            <Text style={styles.primaryButtonText}>{defaultT.forgotPasswordSavePassword || 'Guardar Contraseña'}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%' },
    progressContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    stepWrapper: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 12, height: 12, borderRadius: 6 },
    dotActive: { backgroundColor: '#E61C24', transform: [{ scale: 1.2 }] },
    dotCompleted: { backgroundColor: '#10B981' },
    dotInactive: { backgroundColor: '#E2E8F0' },
    line: { width: 30, height: 4, borderRadius: 2, marginHorizontal: 4 },
    lineCompleted: { backgroundColor: '#10B981' },
    lineInactive: { backgroundColor: '#E2E8F0' },
    header: { alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
    subtitle: { fontSize: 14, color: '#64748B', marginTop: 5 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 8, marginLeft: 4 },
    input: { height: 50, backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: '#CBD5E1', fontSize: 15, color: '#0F172A', marginBottom: 16 },
    inputCenter: { textAlign: 'center', fontSize: 20, letterSpacing: 5 },
    inputError: { borderColor: '#E61C24' },
    errorText: { color: '#E61C24', fontSize: 14, textAlign: 'center', marginBottom: 15, marginTop: -5 },
    loader: { marginTop: 10, marginBottom: 10 },
    primaryButton: { height: 52, backgroundColor: '#E61C24', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }
});