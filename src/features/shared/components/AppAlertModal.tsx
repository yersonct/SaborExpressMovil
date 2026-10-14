import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { setAlertListener, type AlertButton } from "../services/alertEvents";

type AppAlertColors = {
  surface: string;
  text: string;
  mutedText: string;
  accent: string;
  accentSoft: string;
  danger: string;
  border: string;
  elevatedSurface: string;
};

interface Props {
  colors?: AppAlertColors;
}

export const AppAlertModal = ({ colors }: Props) => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [buttons, setButtons] = useState<AlertButton[]>([]);

  useEffect(() => {
    return setAlertListener((payload) => {
      setTitle(payload.title);
      setMessage(payload.message);
      setButtons(
        payload.buttons && payload.buttons.length > 0
          ? payload.buttons
          : [{ text: "OK" }],
      );
      setVisible(true);
    });
  }, []);

  const handlePress = (btn: AlertButton) => {
    setVisible(false);
    btn.onPress?.();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent={Platform.OS === "android"}
      navigationBarTranslucent={Platform.OS === "android"}
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            colors && {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.title, colors && { color: colors.text }]}>{title}</Text>
          {!!message && (
            <Text style={[styles.message, colors && { color: colors.mutedText }]}>
              {message}
            </Text>
          )}
          <View style={styles.buttonRow}>
            {buttons.map((btn, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.button,
                  colors && { backgroundColor: colors.accent },
                  btn.style === "destructive" && styles.destructiveButton,
                  btn.style === "destructive" && colors && {
                    backgroundColor: colors.accentSoft,
                  },
                  btn.style === "cancel" && styles.cancelButton,
                  btn.style === "cancel" && colors && {
                    backgroundColor: colors.elevatedSurface,
                  },
                ]}
                onPress={() => handlePress(btn)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    btn.style === "destructive" && styles.destructiveText,
                    btn.style === "destructive" && colors && {
                      color: colors.danger,
                    },
                    btn.style === "cancel" && styles.cancelText,
                    btn.style === "cancel" && colors && { color: colors.text },
                  ]}
                >
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    // En web, si hay otro Modal abierto debajo (ej. el de Notificaciones),
    // el orden de montaje en el DOM decide quién queda encima. Forzamos un
    // zIndex alto para que esta alerta SIEMPRE tape a cualquier otro modal.
    zIndex: 99999,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 340,
    zIndex: 100000,
    elevation: 25,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#E61C24",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  cancelButton: {
    backgroundColor: "#F1F5F9",
  },
  cancelText: {
    color: "#334155",
  },
  destructiveButton: {
    backgroundColor: "#FEE2E2",
  },
  destructiveText: {
    color: "#DC2626",
  },
});
