import { PermissionsAndroid, Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import type { Pd01Row } from "./pd01Receipt";
import { PD01_SERVICE, PD01_WRITE, PD01_NOTIFY, PD01_BEGIN, PD01_END, pd01RowPacket, bytesToBase64 } from "./pd01Protocol";
export type DiscoveredPrinter = { id: string; name: string };
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
let busy = false;
export const isPd01Available = () => Platform.OS === "android" && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

async function permissions() {
  if (!isPd01Available()) throw new Error("La impresora PD01 requiere una APK de desarrollo; no es compatible con Expo Go.");
  const version = Number(Platform.Version);
  const requested = version >= 31
    ? [PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]
    : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  const result = await PermissionsAndroid.requestMultiple(requested);
  if (requested.some((p) => result[p] !== PermissionsAndroid.RESULTS.GRANTED))
    throw new Error("Concede los permisos Bluetooth de SaborExpress desde Android.");
}

// Importación diferida: nunca cargar el módulo nativo dentro de Expo Go.
async function manager() {
  const mod = await import("@sfourdrinier/react-native-ble-plx");
  return new mod.BleManager();
}
export async function scanPd01Printers(): Promise<DiscoveredPrinter[]> {
  if (busy) throw new Error("Ya hay una operación Bluetooth en curso.");
  busy = true;
  try {
    await permissions();
    const ble = await manager();
    try {
      if (await ble.state() !== "PoweredOn") throw new Error("Enciende el Bluetooth de tu celular.");
      const devices = new Map<string, DiscoveredPrinter>();
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => { ble.stopDeviceScan(); resolve(); }, 9000);
        ble.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
          if (error) { clearTimeout(timeout); ble.stopDeviceScan(); reject(error); return; }
          if (!device) return;
          const name = device.name || device.localName || "";
          if (/^PD01/i.test(name) || (device.serviceUUIDs || []).some(s => s.toLowerCase() === PD01_SERVICE))
            devices.set(device.id, { id: device.id, name: name || "PD01" });
        });
      });
      return [...devices.values()];
    } finally { ble.destroy(); }
  } finally { busy = false; }
}

export async function sendPd01Bitmap(deviceId: string, rows: Pd01Row[]): Promise<void> {
  if (busy) throw new Error("Ya se está enviando un recibo. Espera a que termine.");
  if (!deviceId || !rows.length) throw new Error("No hay impresora o recibo para imprimir.");
  busy = true;
  try {
    await permissions();
    const ble = await manager();
    try {
      if (await ble.state() !== "PoweredOn") throw new Error("Enciende el Bluetooth.");
      let device = await ble.connectToDevice(deviceId, { timeout: 12000 });
      try {
        device = await device.discoverAllServicesAndCharacteristics();
        const services = await device.services();
        if (!services.some(s => s.uuid.toLowerCase() === PD01_SERVICE))
          throw new Error("Esta impresora no utiliza el protocolo PD01 AE30. No se enviaron comandos.");
        const characteristics = await device.characteristicsForService(PD01_SERVICE);
        if (!characteristics.some(c => c.uuid.toLowerCase() === PD01_WRITE && c.isWritableWithoutResponse))
          throw new Error("El dispositivo no tiene la característica PD01 AE01.");
        try { device = await device.requestMTU(185); } catch { /* usar MTU por defecto */ }
        const notify = device.monitorCharacteristicForService(PD01_SERVICE, PD01_NOTIFY, () => {});
        try {
          const mtu = Math.max(23, device.mtu || 23);
          const packetSize = Math.min(180, mtu - 3);
          const send = async (data: Uint8Array) => {
            for (let offset = 0; offset < data.length; offset += packetSize) {
              const chunk = data.subarray(offset, offset + packetSize);
              await device.writeCharacteristicWithoutResponseForService(PD01_SERVICE, PD01_WRITE, bytesToBase64(chunk));
              await sleep(12);
            }
          };
          await sleep(250); // dejar iniciar la suscripción BLE\n          for (const packet of PD01_BEGIN) await send(packet);
          for (const row of rows) await send(pd01RowPacket(row));
          for (const packet of PD01_END) await send(packet);
          await sleep(500);
        } finally { notify.remove(); }
      } finally { await ble.cancelDeviceConnection(deviceId).catch(() => undefined); }
    } finally { ble.destroy(); }
  } finally { busy = false; }
}
