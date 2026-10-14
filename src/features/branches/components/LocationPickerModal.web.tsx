import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import { useClientPreferences } from "@/features/userPreferences/context/ClientPreferencesContext";

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (coords: { latitude: number; longitude: number }) => void;
  initialLocation?: { latitude: number; longitude: number } | null;
};

// Versión web: react-native-maps es solo nativo y rompe el bundle web.
export function LocationPickerModal({ visible, onClose }: Props) {
  const { colors, t } = useClientPreferences();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View
          style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20 }}
        >
          <Text style={{ color: colors.text, marginBottom: 12 }}>
            {t("mapMobileOnly")}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{ alignItems: "center", padding: 10 }}
          >
            <Text style={{ color: colors.accent, fontWeight: "700" }}>{t("close")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
