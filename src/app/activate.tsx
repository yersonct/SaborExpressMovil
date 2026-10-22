import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthInput } from "../features/auth/components/AuthInput";
import { authService } from "../features/auth/services/authService";
import { translateMobileCopy } from "../locales/mobileCopy";

const themeColors = {
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#0F172A",
  mutedText: "#64748B",
  border: "#E2E8F0",
  inputBackground: "#F8FAFC",
  buttonBackground: "#E61C24",
  buttonText: "#FFFFFF",
  toggleBg: "#E2E8F0",
};

export default function ActivateScreen() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleActivate = async () => {
    if (!token) {
      setError(translateMobileCopy("El enlace no es válido."));
      return;
    }
    if (newPassword.length < 8) {
      setError(translateMobileCopy("La contraseña debe tener al menos 8 caracteres."));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(translateMobileCopy("Las contraseñas no coinciden."));
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authService.activateAccount({ token, newPassword });
      setDone(true);
    } catch (err: any) {
      setError(translateMobileCopy(err?.message || "El enlace es inválido o ya expiró."));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          backgroundColor: themeColors.background,
        }}
      >
        <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: themeColors.text,
            marginTop: 16,
          }}
        >
          {translateMobileCopy("¡Cuenta activada!")}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: themeColors.mutedText,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          {translateMobileCopy("Ya puedes iniciar sesión con tu nueva contraseña.")}
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/")}
          style={{
            backgroundColor: "#E61C24",
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 28,
            marginTop: 24,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
            {translateMobileCopy("Ir a iniciar sesión")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        padding: 24,
        backgroundColor: themeColors.background,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{
          backgroundColor: themeColors.surface,
          borderRadius: 16,
          padding: 24,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: themeColors.text,
            marginBottom: 8,
          }}
        >
          {translateMobileCopy("Activa tu cuenta")}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: themeColors.mutedText,
            marginBottom: 16,
          }}
        >
          {translateMobileCopy("Define tu contraseña para terminar de activar tu cuenta.")}
        </Text>

        <AuthInput
          label={translateMobileCopy("Nueva contraseña")}
          placeholder={translateMobileCopy("Mínimo 8 caracteres")}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showPassword}
          showPasswordToggle={true}
          onTogglePassword={() => setShowPassword(!showPassword)}
          themeColors={themeColors}
        />
        <AuthInput
          label={translateMobileCopy("Confirmar contraseña")}
          placeholder={translateMobileCopy("Repite tu contraseña")}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirm}
          showPasswordToggle={true}
          onTogglePassword={() => setShowConfirm(!showConfirm)}
          themeColors={themeColors}
        />

        {error ? (
          <Text style={{ color: "#E61C24", marginTop: 8 }}>{error}</Text>
        ) : null}

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#E61C24"
            style={{ marginTop: 16 }}
          />
        ) : (
          <TouchableOpacity
            onPress={handleActivate}
            style={{
              backgroundColor: themeColors.buttonBackground,
              borderRadius: 12,
              padding: 14,
              alignItems: "center",
              marginTop: 16,
            }}
          >
            <Text style={{ color: themeColors.buttonText, fontWeight: "700" }}>
              {translateMobileCopy("Activar cuenta")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
