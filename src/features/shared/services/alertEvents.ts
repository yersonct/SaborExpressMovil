export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface AlertPayload {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

type Listener = (payload: AlertPayload) => void;

let listener: Listener | null = null;

export function setAlertListener(fn: Listener) {
  listener = fn;
}

// Misma firma que Alert.alert(title, message?, buttons?) — así el reemplazo
// en el resto del código es solo cambiar el nombre de la función.
export function showAppAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
) {
  if (listener) listener({ title, message, buttons });
}
