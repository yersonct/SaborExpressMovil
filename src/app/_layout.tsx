import { Slot } from "expo-router";
import { View } from "react-native";
import { AuthProvider } from "../features/auth/context/AuthContext";
import { NetworkConnectionBanner } from "../features/shared/components/NetworkConnectionBanner";

export default function RootLayout() {
  return (
    <AuthProvider>
      <View style={{ flex: 1 }}>
        <Slot />
        <NetworkConnectionBanner />
      </View>
    </AuthProvider>
  );
}
