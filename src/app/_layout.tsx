import { Slot } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../features/auth/context/AuthContext";
import { NetworkConnectionBanner } from "../features/shared/components/NetworkConnectionBanner";
import { RememberRoute } from "../features/shared/components/RememberRoute";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <View style={{ flex: 1 }}>
          <Slot />
          <RememberRoute />
          <NetworkConnectionBanner />
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
