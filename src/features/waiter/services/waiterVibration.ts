import { Platform, Vibration } from "react-native";

export function vibrateWaiterDevice(pattern: number[] = [0, 300, 150, 300]) {
  if (Platform.OS === "web") return;

  try {
    Vibration.cancel();
    Vibration.vibrate(pattern);
  } catch (error) {
    if (__DEV__) {
      console.warn("No se pudo activar la vibración del mesero:", error);
    }
  }
}
