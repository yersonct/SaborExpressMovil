import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { authService } from "../features/auth/services/authService";
import { translateMobileCopy } from "../locales/mobileCopy";
import { deferEffect } from "@/features/shared/utils/deferEffect";

export default function ConfirmEmailScreen() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const called = useRef(false); // evita doble llamada en modo desarrollo

  useEffect(() => deferEffect(() => {
    if (called.current) return;
    if (!token) {
      setStatus("error");
      setMessage(translateMobileCopy("El enlace no es válido."));
      return;
    }
    called.current = true;
    (async () => {
      try {
        await authService.confirmEmail({ token });
        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        setMessage(translateMobileCopy(err?.message || "El enlace es inválido o ya expiró."));
      }
    })();
  }), [token]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: "#F8FAFC",
      }}
    >
      {status === "loading" && (
        <ActivityIndicator size="large" color="#E61C24" />
      )}

      {status === "success" && (
        <>
          <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: "#0F172A",
              marginTop: 16,
            }}
          >
            {translateMobileCopy("¡Cuenta activada!")}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#64748B",
              marginTop: 8,
              textAlign: "center",
            }}
          >
            {translateMobileCopy("Tu correo fue confirmado. Ya puedes iniciar sesión.")}
          </Text>
        </>
      )}

      {status === "error" && (
        <>
          <Ionicons name="alert-circle" size={64} color="#E61C24" />
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#0F172A",
              marginTop: 16,
            }}
          >
            {translateMobileCopy("No se pudo activar")}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#64748B",
              marginTop: 8,
              textAlign: "center",
            }}
          >
            {message} {translateMobileCopy("Inicia sesión para pedir un nuevo enlace.")}
          </Text>
        </>
      )}

      {status !== "loading" && (
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
      )}
    </View>
  );
}
