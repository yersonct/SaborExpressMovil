import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { authService } from "../services/authService";
import { AuthInput } from "./AuthInput";
import { translateMobileCopy } from "../../../locales/mobileCopy";

const StepProgress = ({ currentStep }: { currentStep: number }) => (
  <View style={styles.progressContainer}>
    {[1, 2, 3].map((step) => (
      <View key={step} style={styles.stepWrapper}>
        <View
          style={[
            styles.dot,
            step === currentStep
              ? styles.dotActive
              : step < currentStep
                ? styles.dotCompleted
                : styles.dotInactive,
          ]}
        />
        {step < 3 && (
          <View
            style={[
              styles.line,
              step < currentStep ? styles.lineCompleted : styles.lineInactive,
            ]}
          />
        )}
      </View>
    ))}
  </View>
);

export const ForgotPasswordFlow = ({
  onSuccess,
  onCancel,
  t,
  themeColors,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  t?: Record<string, string>;
  themeColors?: Record<string, string>;
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const defaultT = t || {};
  const defaultColors = themeColors || {
    text: "#0F172A",
    mutedText: "#64748B",
    background: "#F8FAFC",
    surface: "#FFFFFF",
    border: "#CBD5E1",
    inputBackground: "#FFFFFF",
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError("");
      setFieldErrors({ email: defaultT.identifierRequired || translateMobileCopy("Ingresa un correo electrónico") });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("");
      setFieldErrors({ email: defaultT.errEmail || translateMobileCopy("Ingresa un correo electrónico válido.") });
      return;
    }
    setFieldErrors({});
    setError("");
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      Alert.alert(translateMobileCopy("Código enviado"), translateMobileCopy("Revisa tu correo {{email}}", { email }));
      setStep(2);
    } catch (err: any) {
      setError(translateMobileCopy(err.message || "No se pudo enviar el código"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setError("");
      setFieldErrors({ code: translateMobileCopy("Ingresa el código") });
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError("");
      setFieldErrors({ code: defaultT.resetCodeInvalid || translateMobileCopy("El código debe contener exactamente 6 dígitos.") });
      return;
    }
    setFieldErrors({});
    setError("");
    setLoading(true);
    try {
      const result = await authService.verifyResetCode(
        email.trim(),
        code.trim(),
      );
      setResetToken(result.resetToken);
      setStep(3);
    } catch (err: any) {
      setError(translateMobileCopy(err.message || "Código incorrecto"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const nextErrors: Record<string, string> = {};
    if (!newPassword) {
      nextErrors.newPassword = defaultT.newPasswordRequired || translateMobileCopy("Ingresa una nueva contraseña");
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = defaultT.passwordMinLength || translateMobileCopy("La contraseña debe tener al menos 8 caracteres.");
    }
    if (!confirmPassword) nextErrors.confirmPassword = defaultT.confirmPasswordRequired || translateMobileCopy("Confirma tu contraseña.");
    else if (newPassword !== confirmPassword) nextErrors.confirmPassword = defaultT.passwordMismatch || translateMobileCopy("Las contraseñas no coinciden.");
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) { setError(""); return; }

    setError("");
    setLoading(true);
    try {
      await authService.resetPassword(resetToken, newPassword, confirmPassword);
      Alert.alert(translateMobileCopy("¡Listo!"), translateMobileCopy("Contraseña actualizada con éxito"));
      onSuccess();
    } catch (err: any) {
      setError(translateMobileCopy(err.message || "Error al actualizar contraseña"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: defaultColors.background }]}
    >
      <StepProgress currentStep={step} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: defaultColors.text }]}>
          {step === 1
            ? defaultT.forgotPasswordStep1Title || translateMobileCopy("Recuperar Contraseña")
            : step === 2
              ? defaultT.forgotPasswordStep2Title || translateMobileCopy("Ingresa el Código")
              : defaultT.forgotPasswordStep3Title || translateMobileCopy("Nueva Contraseña")}
        </Text>
        <Text style={[styles.subtitle, { color: defaultColors.mutedText }]}>
          {step === 1
            ? defaultT.forgotPasswordStep1Subtitle ||
              translateMobileCopy("Ingresa tu correo para recibir un código.")
            : step === 2
              ? defaultT.forgotPasswordStep2Subtitle ||
                translateMobileCopy("Revisa tu bandeja de entrada.")
              : defaultT.forgotPasswordStep3Subtitle ||
                translateMobileCopy("Crea tu nueva contraseña segura.")}
        </Text>
      </View>

      {step === 1 && (
        <View>
          <Text style={[styles.inputLabel, { color: defaultColors.text }]}>
            {defaultT.forgotPasswordEmail || translateMobileCopy("Correo electrónico")}
          </Text>
          <TextInput
            style={[
              styles.input,
              fieldErrors.email ? styles.inputError : null,
              {
                backgroundColor: defaultColors.inputBackground,
                borderColor: defaultColors.border,
                color: defaultColors.text,
              },
            ]}
            placeholder={
              defaultT.forgotPasswordPlaceholder ||
              "Ej: cajero@saborexpress.com"
            }
            value={email}
            onChangeText={(val) => {
              setEmail(val);
              setFieldErrors((previous) => ({ ...previous, email: "" }));
              setError("");
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={254}
          />
          {fieldErrors.email ? <Text accessibilityRole="alert" style={styles.errorText}>{fieldErrors.email}</Text> : null}
          {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#E61C24"
              style={styles.loader}
            />
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: "#E61C24" }]}
              onPress={handleSendCode}
            >
              <Text style={styles.primaryButtonText}>
                {defaultT.forgotPasswordSendCode || translateMobileCopy("Enviar Código")}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onCancel}
            style={{ marginTop: 16, alignItems: "center" }}
          >
            <Text style={{ color: defaultColors.mutedText, fontSize: 14 }}>
              {translateMobileCopy("Cancelar")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <View>
          <Text style={[styles.inputLabel, { color: defaultColors.text }]}>
            {defaultT.forgotPasswordCode || translateMobileCopy("Código de 6 dígitos")}
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.inputCenter,
              fieldErrors.code ? styles.inputError : null,
              {
                backgroundColor: defaultColors.inputBackground,
                borderColor: defaultColors.border,
                color: defaultColors.text,
              },
            ]}
            placeholder="123456"
            maxLength={6}
            value={code}
            onChangeText={(val) => {
              setCode(val.replace(/\D/g, "").slice(0, 6));
              setFieldErrors((previous) => ({ ...previous, code: "" }));
              setError("");
            }}
            keyboardType="number-pad"
          />
          {fieldErrors.code ? <Text accessibilityRole="alert" style={styles.errorText}>{fieldErrors.code}</Text> : null}
          {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#E61C24"
              style={styles.loader}
            />
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: "#E61C24" }]}
              onPress={handleVerifyCode}
            >
              <Text style={styles.primaryButtonText}>
                {defaultT.forgotPasswordVerifyCode || translateMobileCopy("Verificar Código")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {step === 3 && (
        <View>
          <AuthInput
            label={`${defaultT.forgotPasswordNewPassword || translateMobileCopy("Nueva Contraseña")} *`}
            placeholder="******"
            value={newPassword}
            onChangeText={(val) => {
              setNewPassword(val);
              setFieldErrors((previous) => ({ ...previous, newPassword: "" }));
              setError("");
            }}
            secureTextEntry={!showPassword}
            showPasswordToggle={true}
            onTogglePassword={() => setShowPassword(!showPassword)}
            error={!!fieldErrors.newPassword}
            errorMessage={fieldErrors.newPassword}
            themeColors={defaultColors}
          />

          <AuthInput
            label={`${translateMobileCopy("Confirmar contraseña")} *`}
            placeholder="******"
            value={confirmPassword}
            onChangeText={(val) => {
              setConfirmPassword(val);
              setFieldErrors((previous) => ({ ...previous, confirmPassword: "" }));
              setError("");
            }}
            secureTextEntry={!showConfirmPassword}
            showPasswordToggle={true}
            onTogglePassword={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            error={!!fieldErrors.confirmPassword}
            errorMessage={fieldErrors.confirmPassword}
            themeColors={defaultColors}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#E61C24"
              style={styles.loader}
            />
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: "#E61C24" }]}
              onPress={handleResetPassword}
            >
              <Text style={styles.primaryButtonText}>
                {defaultT.forgotPasswordSavePassword || translateMobileCopy("Guardar Contraseña")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: "100%" },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  stepWrapper: { flexDirection: "row", alignItems: "center" },
  dot: { width: 12, height: 12, borderRadius: 6 },
  dotActive: { backgroundColor: "#E61C24", transform: [{ scale: 1.2 }] },
  dotCompleted: { backgroundColor: "#10B981" },
  dotInactive: { backgroundColor: "#E2E8F0" },
  line: { width: 30, height: 4, borderRadius: 2, marginHorizontal: 4 },
  lineCompleted: { backgroundColor: "#10B981" },
  lineInactive: { backgroundColor: "#E2E8F0" },
  header: { alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#0F172A" },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 5 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 50,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    fontSize: 15,
    color: "#0F172A",
    marginBottom: 16,
  },
  inputCenter: { textAlign: "center", fontSize: 20, letterSpacing: 5 },
  inputError: { borderColor: "#E61C24" },
  errorText: {
    color: "#E61C24",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 15,
    marginTop: -5,
  },
  loader: { marginTop: 10, marginBottom: 10 },
  primaryButton: {
    height: 52,
    backgroundColor: "#E61C24",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
});
