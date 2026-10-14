import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import { authService } from "../services/authService";

interface EmailConfirmationModalProps {
  visible: boolean;
  identifier: string;
  themeColors: any;
  t: any;
  onCancel: () => void;
}

export const EmailConfirmationModal: React.FC<EmailConfirmationModalProps> = ({
  visible,
  identifier,
  themeColors,
  onCancel,
}) => {
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleResend = async () => {
    setError("");
    setResendMessage("");
    setResendLoading(true);
    try {
      await authService.resendConfirmationCode({ identifier });
      setResendMessage(
        "Si tu cuenta está pendiente, te enviamos un nuevo enlace.",
      );
    } catch (err: any) {
      setError(err.message || "No se pudo reenviar el enlace.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          padding: 24,
        }}
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
              fontSize: 18,
              fontWeight: "700",
              color: themeColors.text,
              marginBottom: 8,
            }}
          >
            Activa tu cuenta
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: themeColors.mutedText,
              marginBottom: 16,
            }}
          >
            Tu cuenta ({identifier}) todavía no está activada. Revisa tu correo
            y presiona el botón "Activar cuenta". Si no lo encuentras, revisa
            spam o pide un nuevo enlace.
          </Text>

          {error ? (
            <Text style={{ color: "#E61C24", marginTop: 8 }}>{error}</Text>
          ) : null}
          {resendMessage ? (
            <Text style={{ color: "#22C55E", marginTop: 8 }}>
              {resendMessage}
            </Text>
          ) : null}

          <TouchableOpacity
            onPress={handleResend}
            disabled={resendLoading}
            style={{
              backgroundColor: themeColors.buttonBackground,
              borderRadius: 12,
              padding: 14,
              alignItems: "center",
              marginTop: 16,
            }}
          >
            <Text style={{ color: themeColors.buttonText, fontWeight: "700" }}>
              {resendLoading ? "Enviando..." : "Reenviar enlace"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onCancel}
            style={{ marginTop: 16, alignItems: "center" }}
          >
            <Text style={{ color: themeColors.mutedText }}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
