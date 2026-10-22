import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { subscribeToNetworkStatus } from "../services/networkStatus";
import { getApiLanguage } from "@/features/auth/services/apiLanguage";
import { subscribeBackendRecovery, dismissBackendRecovery } from "../services/backendRecoveryWatch";
import { translateMobileCopy } from "../../../locales/mobileCopy";

const recoveryTexts = {
  es: "Conexión recuperada. Ya puedes iniciar sesión nuevamente.",
  en: "Connection restored. You can sign in again.",
  pt: "Conexão restabelecida. Você já pode entrar novamente.",
  fr: "Connexion rétablie. Vous pouvez vous reconnecter.",
};

export function NetworkConnectionBanner() {
  const [message, setMessage] = useState<string | null>(null);
  const [recovered, setRecovered] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => subscribeToNetworkStatus(setMessage), []);
  useEffect(() => subscribeBackendRecovery(setRecovered), []);

  if (!message && !recovered) return null;
  const bannerText = recovered ? recoveryTexts[getApiLanguage()] : message;
  const close = () => { if (recovered) dismissBackendRecovery(); else setMessage(null); };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { top: Math.max(10, insets.top + 8) }]}
    >
      <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.banner, recovered && styles.recovered]}>
        <Ionicons name={recovered ? "checkmark-circle-outline" : "cloud-offline-outline"} size={22} color="#FFFFFF" />
        <Text style={styles.message}>{bannerText}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={translateMobileCopy("Cerrar aviso de conexión")}
          hitSlop={10}
          onPress={close}
        >
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 2000,
    elevation: 20,
  },
  banner: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#B42318",
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  recovered: { backgroundColor: "#047857" },
  message: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

