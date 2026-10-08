import React, { useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { setAlertListener, type AlertButton } from "../services/alertEvents";

export const AppAlertModal = () => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [buttons, setButtons] = useState<AlertButton[]>([]);

  useEffect(() => {
    setAlertListener((payload) => {
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
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.buttonRow}>
            {buttons.map((btn, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.button,
                  btn.style === "destructive" && styles.destructiveButton,
                  btn.style === "cancel" && styles.cancelButton,
                ]}
                onPress={() => handlePress(btn)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    btn.style === "destructive" && styles.destructiveText,
                    btn.style === "cancel" && styles.cancelText,
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
    elevation: 24, // equivalente en Android para apilar por encima
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
