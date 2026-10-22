import { PermissionsAndroid, Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import type { BleManager, Device } from "@sfourdrinier/react-native-ble-plx";
import type { Pd01Row } from "./pd01Receipt";
import {
  PD01_WRITE,
  PD01_NOTIFY,
  PD01_BEGIN,
  PD01_END,
  pd01RowPacket,
  bytesToBase64,
} from "./pd01Protocol";

const MXW_SERVICE = "0000ae30-0000-1000-8000-00805f9b34fb";
const MXW_CONTROL = "0000ae01-0000-1000-8000-00805f9b34fb";
const MXW_NOTIFY = "0000ae02-0000-1000-8000-00805f9b34fb";
const MXW_DATA = "0000ae03-0000-1000-8000-00805f9b34fb";

export type DiscoveredPrinter = { id: string; name: string };
export type BlePrinterProtocol = "pd01" | "mxw01";
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
let busy = false;

export const isPd01Available = () =>
  Platform.OS === "android" && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

async function permissions() {
  if (!isPd01Available()) {
    throw new Error("La impresora BLE requiere la APK de desarrollo SaborExpress; no funciona en Expo Go.");
  }
  const version = Number(Platform.Version);
  const requested = version >= 31
    ? [PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]
    : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  const result = await PermissionsAndroid.requestMultiple(requested);
  if (requested.some((permission) => result[permission] !== PermissionsAndroid.RESULTS.GRANTED)) {
    throw new Error("Concede a SaborExpress el permiso de Dispositivos cercanos para buscar la impresora.");
  }
}

async function manager() {
  const mod = await import("@sfourdrinier/react-native-ble-plx");
  return new mod.BleManager();
}

const isCatService = (uuid: string) => {
  const normalized = uuid.toLowerCase();
  return normalized === MXW_SERVICE || normalized === "0000af30-0000-1000-8000-00805f9b34fb";
};

function looksLikeSupportedPrinter(name: string, services: string[] = []) {
  return /^(pd01|mxw01|c9(?:-?a)?|mini[-_ ]?printer)/i.test(name.trim()) || services.some(isCatService);
}

export async function scanPd01Printers(): Promise<DiscoveredPrinter[]> {
  if (busy) throw new Error("Ya hay una búsqueda o impresión Bluetooth en curso.");
  busy = true;
  try {
    await permissions();
    const ble = await manager();
    try {
      if (await ble.state() !== "PoweredOn") throw new Error("Enciende el Bluetooth del teléfono y de la impresora.");
      const devices = new Map<string, DiscoveredPrinter>();
      await new Promise<void>((resolve, reject) => {
        let finished = false;
        let quietTimeout: ReturnType<typeof setTimeout> | undefined;
        const finish = () => {
          if (finished) return;
          finished = true;
          clearTimeout(timeout);
          if (quietTimeout) clearTimeout(quietTimeout);
          ble.stopDeviceScan();
          resolve();
        };
        const timeout = setTimeout(finish, 6500);
        ble.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
          if (error) {
            if (finished) return;
            finished = true;
            clearTimeout(timeout);
            if (quietTimeout) clearTimeout(quietTimeout);
            ble.stopDeviceScan();
            reject(error);
            return;
          }
          if (!device) return;
          const name = device.name || device.localName || "";
          if (!looksLikeSupportedPrinter(name, device.serviceUUIDs || [])) return;
          devices.set(device.id, { id: device.id, name: name || "Impresora BLE" });
          if (quietTimeout) clearTimeout(quietTimeout);
          quietTimeout = setTimeout(finish, 700);
        });
      });
      return [...devices.values()];
    } finally {
      ble.destroy();
    }
  } finally {
    busy = false;
  }
}

async function discoverPrinter(ble: BleManager, deviceId: string): Promise<{ device: Device; service: string; protocol: BlePrinterProtocol }> {
  try {
    if (await ble.state() !== "PoweredOn") throw new Error("Enciende el Bluetooth del teléfono.");
    let connected: Device;
    try {
      connected = await ble.connectToDevice(deviceId, { timeout: 6000 });
    } catch {
      throw { code: "ble_connection_failed" };
    }
    const device = await connected.discoverAllServicesAndCharacteristics();
    const services = await device.services();
    for (const service of services) {
      if (!isCatService(service.uuid)) continue;
      const characteristics = await device.characteristicsForService(service.uuid);
      const uuids = characteristics.map((characteristic) => characteristic.uuid.toLowerCase());
      const hasControl = uuids.includes(MXW_CONTROL);
      const hasNotify = uuids.includes(MXW_NOTIFY);
      if (!hasControl || !hasNotify) continue;
      // AE03 también aparece como canal TX alternativo en impresoras clásicas.
      // Solo MXW01 usa el protocolo 0x2221; C9/PD01 usan el protocolo 0x5178.
      const advertisedName = (device.name ?? "").trim();
      const protocol: BlePrinterProtocol = /^mxw01(?:[-_ ]|$)/i.test(advertisedName)
        ? "mxw01"
        : "pd01";
      if (protocol === "mxw01" && !uuids.includes(MXW_DATA)) {
        throw new Error("La impresora MXW01 no expone el canal BLE de datos.");
      }
      return { device, service: service.uuid, protocol };
    }
    throw new Error("La impresora respondió por Bluetooth, pero no usa un protocolo compatible (C9/MXW01 o PD01).");
  } catch (error) {
    await ble.cancelDeviceConnection(deviceId).catch(() => undefined);
    throw error;
  }
}

/** Connects briefly and confirms the printer exposes a supported print protocol before saving it. */
export async function verifyBlePrinter(deviceId: string): Promise<BlePrinterProtocol> {
  if (busy) throw new Error("Ya hay una operación Bluetooth en curso.");
  busy = true;
  let ble: BleManager | undefined;
  try {
    await permissions();
    ble = await manager();
    const found = await discoverPrinter(ble, deviceId);
    return found.protocol;
  } finally {
    if (ble) {
      await ble.cancelDeviceConnection(deviceId).catch(() => undefined);
      ble.destroy();
    }
    busy = false;
  }
}

function crc8(data: Uint8Array): number {
  let crc = 0;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc & 0x80) ? ((crc << 1) ^ 0x07) & 255 : (crc << 1) & 255;
  }
  return crc;
}

function mxwControlPacket(command: number, payload: Uint8Array): Uint8Array {
  const packet = new Uint8Array(8 + payload.length);
  packet.set([0x22, 0x21, command, 0x00, payload.length & 255, (payload.length >> 8) & 255], 0);
  packet.set(payload, 6);
  packet[6 + payload.length] = crc8(payload);
  packet[7 + payload.length] = 0xff;
  return packet;
}

function fromBase64(value: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const output: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of value.replace(/=+$/, "")) {
    const digit = alphabet.indexOf(char);
    if (digit < 0) continue;
    buffer = (buffer << 6) | digit;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output.push((buffer >> bits) & 255);
    }
  }
  return Uint8Array.from(output);
}

function notificationPayload(value: string, expectedCommand: number): Uint8Array | null {
  const packet = fromBase64(value);
  if (packet.length < 7 || packet[0] !== 0x22 || packet[1] !== 0x21 || packet[2] !== expectedCommand) return null;
  const length = packet[4] | (packet[5] << 8);
  if (packet.length < 7 + length) return null;
  return packet.slice(6, 6 + length);
}

async function printMxw01(device: Device, service: string, rows: Pd01Row[]) {
  const characteristics = await device.characteristicsForService(service);
  const control = characteristics.find((item) => item.uuid.toLowerCase() === MXW_CONTROL);
  const notifyCharacteristic = characteristics.find((item) => item.uuid.toLowerCase() === MXW_NOTIFY);
  const dataCharacteristic = characteristics.find((item) => item.uuid.toLowerCase() === MXW_DATA);
  if (!control || !notifyCharacteristic || !dataCharacteristic) {
    throw new Error("La impresora C9 no expone los canales BLE necesarios para imprimir.");
  }
  if (!rows.length || rows.some((row) => row.length !== 48)) {
    throw new Error("El recibo tiene un formato de imagen no compatible con la C9.");
  }
  if (rows.length > 65535) throw new Error("El recibo supera el largo máximo admitido por la C9.");

  const lineCount = Math.max(rows.length, 90);
  const image = new Uint8Array(Math.max(rows.length * 48, 4320));
  rows.forEach((row, index) => image.set(row, index * 48));
  let mtu = Math.max(23, device.mtu || 23);
  try {
    const negotiated = await device.requestMTU(185);
    mtu = Math.max(mtu, negotiated.mtu || mtu);
  } catch { /* Se usa el MTU que negoció Android. */ }

  let resolveAck!: (payload: Uint8Array) => void;
  let rejectAck!: (error: Error) => void;
  const ack = new Promise<Uint8Array>((resolve, reject) => {
    resolveAck = resolve;
    rejectAck = reject;
  });
  void ack.catch(() => undefined);
  const timer = setTimeout(() => rejectAck(new Error("La impresora MXW01 no confirmó el inicio de impresión.")), 4000);
  const subscription = device.monitorCharacteristicForService(service, notifyCharacteristic.uuid, (error, characteristic) => {
    if (error) {
      rejectAck(new Error(error.message));
      return;
    }
    if (!characteristic?.value) return;
    const payload = notificationPayload(characteristic.value, 0xa9);
    if (payload) resolveAck(payload);
  });

  try {
    await sleep(250);
    const start = mxwControlPacket(0xa9, Uint8Array.from([lineCount & 255, (lineCount >> 8) & 255, 0x30, 0x00]));
    await device.writeCharacteristicWithoutResponseForService(service, control.uuid, bytesToBase64(start));
    const response = await ack;
    if (response.length > 0 && response[0] !== 0) throw new Error("La impresora rechazó el recibo. Revisa el papel y vuelve a intentar.");

    const chunkSize = Math.min(180, Math.max(20, mtu - 3));
    for (let offset = 0; offset < image.length; offset += chunkSize) {
      const chunk = image.subarray(offset, Math.min(offset + chunkSize, image.length));
      await device.writeCharacteristicWithoutResponseForService(service, dataCharacteristic.uuid, bytesToBase64(chunk));
      if (offset + chunkSize < image.length) await sleep(5);
    }
    const flush = mxwControlPacket(0xad, Uint8Array.from([0x00]));
    await device.writeCharacteristicWithoutResponseForService(service, control.uuid, bytesToBase64(flush));
    await sleep(500);
  } finally {
    clearTimeout(timer);
    subscription.remove();
  }
}

async function printLegacyPd01(device: Device, service: string, rows: Pd01Row[]) {
  const characteristics = await device.characteristicsForService(service);
  const write = characteristics.find((item) => item.uuid.toLowerCase() === PD01_WRITE && item.isWritableWithoutResponse);
  const notifyCharacteristic = characteristics.find((item) => item.uuid.toLowerCase() === PD01_NOTIFY);
  if (!write || !notifyCharacteristic) throw new Error("La impresora BLE no es compatible con el protocolo PD01.");
  const subscription = device.monitorCharacteristicForService(service, notifyCharacteristic.uuid, () => {});
  try {
    let mtu = Math.max(23, device.mtu || 23);
    try {
      const negotiated = await device.requestMTU(185);
      mtu = Math.max(mtu, negotiated.mtu || mtu);
    } catch { /* Usar MTU por defecto. */ }
    const packetSize = Math.min(180, mtu - 3);
    const send = async (data: Uint8Array) => {
      for (let offset = 0; offset < data.length; offset += packetSize) {
        const chunk = data.subarray(offset, offset + packetSize);
        await device.writeCharacteristicWithoutResponseForService(service, write.uuid, bytesToBase64(chunk));
        await sleep(5);
      }
    };
    await sleep(250);
    for (const packet of PD01_BEGIN) await send(packet);
    for (const row of rows) await send(pd01RowPacket(row));
    for (const packet of PD01_END) await send(packet);
    await sleep(500);
  } finally {
    subscription.remove();
  }
}

/** Sends the receipt using the protocol advertised by the connected BLE printer (C9/MXW01 or legacy PD01). */
export async function sendPd01Bitmap(deviceId: string, rows: Pd01Row[]): Promise<void> {
  if (busy) throw new Error("Ya se está enviando un recibo. Espera a que termine.");
  if (!deviceId || !rows.length) throw new Error("No hay impresora o recibo para imprimir.");
  busy = true;
  let ble: BleManager | undefined;
  try {
    await permissions();
    ble = await manager();
    const found = await discoverPrinter(ble, deviceId);
    if (found.protocol === "mxw01") await printMxw01(found.device, found.service, rows);
    else await printLegacyPd01(found.device, found.service, rows);
  } finally {
    if (ble) {
      await ble.cancelDeviceConnection(deviceId).catch(() => undefined);
      ble.destroy();
    }
    busy = false;
  }
}
