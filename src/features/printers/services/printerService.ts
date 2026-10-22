import {
  connectToPrinter,
  connectedAddress,
  disconnectPrinter,
  ensureBluetoothPermission,
  findPrinters,
  isBluetoothEnabled,
  isConnected,
  isPrintingSupported,
  printBytes,
  type PrinterDevice,
} from '@ricka7x/expo-thermal-printer';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { buildSalesReceipt, buildTestReceipt } from './receiptBuilder';
import {
  loadPrinterSelection,
  loadSavedPrinter,
  removePrinter,
  savePrinter,
  savePrinterSelection,
} from './printerStorage';
import type { PaperWidth, SalesReceipt, SavedPrinter } from '../types';
import type { ApiLanguage } from '@/features/auth/services/apiLanguage';
import { PRINTER_SETTINGS_COPY } from "@/locales/PrinterSettingsTranslations";
import { persistPrinterAfterSuccessfulTest } from './printerSelectionWorkflow';

/** The Bluetooth native module is not bundled in Expo Go. */
export function isNativePrinterAvailable(): boolean {
  return (Platform.OS === 'android' || Platform.OS === 'ios') &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

function requireSupported(): void {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    throw { code: 'expo_go' };
  }
  if (!isPrintingSupported()) throw { code: 'unsupported' };
}

async function requireBluetooth(): Promise<void> {
  requireSupported();
  const allowed = await ensureBluetoothPermission();
  if (!allowed) throw { code: 'permission_denied' };
  if (!isBluetoothEnabled()) throw { code: 'bluetooth_off' };
}

export async function listAvailablePrinters(): Promise<PrinterDevice[]> {
  await requireBluetooth();
  // En Android devuelve DISPOSITIVOS EMPAREJADOS (no efectúa búsqueda activa).
  const devices = await findPrinters();
  return Array.from(new Map(devices.map((device) => [device.address, device])).values());
}

/** Checks the saved classic printer over local Bluetooth, then releases the connection. */
export async function isClassicPrinterReachable(address: string): Promise<boolean> {
  await requireBluetooth();
  let connected = false;
  try {
    await connectToPrinter(address);
    connected = true;
    return true;
  } catch {
    return false;
  } finally {
    if (connected) {
      await disconnectPrinter().catch(() => undefined);
    }
  }
}

/** Conectar PRIMERO y guardar SOLO después de comprobar que conectó. */
export async function selectPrinter(
  device: PrinterDevice,
  paperWidth: PaperWidth,
  unnamedDeviceLabel = 'Impresora sin nombre',
  language: ApiLanguage = 'es',
): Promise<SavedPrinter> {
  await requireBluetooth();
  const selected: SavedPrinter = {
    address: device.address,
    name: device.name || unnamedDeviceLabel,
    paperWidth,
  };
  await withPrintLock(async () => {
    let connected = false;
    try {
      await connectToPrinter(device.address);
      connected = true;
      await persistPrinterAfterSuccessfulTest(
        selected,
        () => printBytes(buildTestReceipt(selected.name, selected.paperWidth, language)),
        async () => {
          await savePrinter(selected);
          await savePrinterSelection('classic');
        },
      );
    } finally {
      if (connected) await disconnectPrinter().catch(() => undefined);
    }
  });
  return selected;
}

export async function forgetPrinter(): Promise<void> {
  try { await disconnectPrinter(); } catch { /* Puede estar desconectada. */ }
  await removePrinter();
  if ((await loadPrinterSelection()) === 'classic') await savePrinterSelection(null);
}

export function currentPrinterIsConnected(address: string | undefined): boolean {
  try {
    return !!address && isConnected() && connectedAddress() === address;
  } catch { return false; }
}

/** Reconecta cuando la aplicación se reinicia o se pierde Bluetooth. */
async function connectSaved(): Promise<SavedPrinter> {
  const saved = await loadSavedPrinter();
  if (!saved) throw { code: 'printer_missing' };
  await requireBluetooth();
  if (!currentPrinterIsConnected(saved.address)) await connectToPrinter(saved.address);
  return saved;
}

let sending = false;
async function withPrintLock(job: () => Promise<void>): Promise<void> {
  // Evita comprobantes duplicados por doble pulsación durante la misma operación.
  if (sending) throw { code: 'busy' };
  sending = true;
  try { await job(); } finally { sending = false; }
}

export async function printTestReceipt(language: ApiLanguage = 'es'): Promise<void> {
  await withPrintLock(async () => {
    const saved = await connectSaved();
    await printBytes(buildTestReceipt(saved.name, saved.paperWidth, language));
  });
}

/** NO cambia el estado de pago: llamar únicamente DESPUÉS de confirmación de la API. */
export async function printSalesReceipt(receipt: SalesReceipt): Promise<void> {
  await withPrintLock(async () => {
    const saved = await connectSaved();
    await printBytes(buildSalesReceipt(receipt, saved.paperWidth));
  });
}

/** Prints once to the device selected for this invoice without changing the saved preference. */
export async function printSalesReceiptToPrinter(
  receipt: SalesReceipt,
  device: PrinterDevice,
  paperWidth: PaperWidth,
): Promise<void> {
  await withPrintLock(async () => {
    await requireBluetooth();
    await connectToPrinter(device.address);
    await printBytes(buildSalesReceipt(receipt, paperWidth));
  });
}

export function printerErrorMessage(error: unknown, language: ApiLanguage = 'es'): string {
  const copy = PRINTER_SETTINGS_COPY[language];
  const code = error && typeof error === 'object' && 'code' in error
    ? String((error as { code: unknown }).code) : '';
  if (code === 'bluetooth_off') return copy.bluetoothOn;
  if (code === 'permission_denied') return copy.permission;
  if (code === 'printer_missing') return copy.printerMissing;
  if (code === 'busy') return copy.busy;
  if (code === 'not_connected') return copy.disconnected;
  if (code === 'write_failed') return copy.sendFailed;
  if (code === 'unsupported') return copy.unsupported;
  if (code === 'expo_go') return copy.nativeBuildRequired;
  if (code === 'login_required') return copy.loginRequired;
  if (code === 'ble_connection_failed') return copy.bleConnectionFailed;
  if (code === 'pd01_missing') return copy.branch;
  if (error instanceof Error && error.message) {
    const message = error.message.toLocaleLowerCase();
    if (message.includes('no confirm')) return copy.bleNoAck;
    if (message.includes('encien') && message.includes('bluetooth')) return copy.bluetoothOn;
    if ((message.includes('permiso') && message.includes('dispositivos')) || message.includes('permission')) return copy.permission;
    if (message.includes('en curso') || message.includes('enviando un recibo')) return copy.busy;
    if (message.includes('protocolo') || message.includes('no expone')) return copy.bleProtocolError;
    return copy.generalError;
  }
  return copy.generalError;
}
