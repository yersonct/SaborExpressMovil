import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (coords: { latitude: number; longitude: number }) => void;
  initialLocation?: { latitude: number; longitude: number } | null;
};

// Versión web: react-native-maps es solo nativo y rompe el bundle web.
export function LocationPickerModal({ visible, onClose }: Props) {
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
          style={{ backgroundColor: "#FFF", borderRadius: 16, padding: 20 }}
        >
          <Text style={{ color: "#1E293B", marginBottom: 12 }}>
            El mapa solo está disponible en la app móvil.
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{ alignItems: "center", padding: 10 }}
          >
            <Text style={{ color: "#E61C24", fontWeight: "700" }}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
