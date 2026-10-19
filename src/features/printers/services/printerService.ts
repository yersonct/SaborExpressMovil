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
import { buildSalesReceipt, buildTestReceipt } from './receiptBuilder';
import { loadSavedPrinter, removePrinter, savePrinter } from './printerStorage';
import type { PaperWidth, SalesReceipt, SavedPrinter } from '../types';

function requireSupported(): void {
  if (!isPrintingSupported()) throw new Error('La impresión Bluetooth requiere Android o iOS con una compilación nativa.');
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

/** Conectar PRIMERO y guardar SOLO después de comprobar que conectó. */
export async function selectPrinter(device: PrinterDevice, paperWidth: PaperWidth): Promise<SavedPrinter> {
  await requireBluetooth();
  await connectToPrinter(device.address);
  const selected: SavedPrinter = {
    address: device.address,
    name: device.name || 'Impresora sin nombre',
    paperWidth,
  };
  await savePrinter(selected);
  return selected;
}

export async function forgetPrinter(): Promise<void> {
  try { await disconnectPrinter(); } catch { /* Puede estar desconectada. */ }
  await removePrinter();
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

export async function printTestReceipt(): Promise<void> {
  await withPrintLock(async () => {
    const saved = await connectSaved();
    await printBytes(buildTestReceipt(saved.name, saved.paperWidth));
  });
}

/** NO cambia el estado de pago: llamar únicamente DESPUÉS de confirmación de la API. */
export async function printSalesReceipt(receipt: SalesReceipt): Promise<void> {
  await withPrintLock(async () => {
    const saved = await connectSaved();
    await printBytes(buildSalesReceipt(receipt, saved.paperWidth));
  });
}

export function printerErrorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error
    ? String((error as { code: unknown }).code) : '';
  if (code === 'bluetooth_off') return 'Activa Bluetooth en tu teléfono y vuelve a intentarlo.';
  if (code === 'permission_denied') return 'Autoriza el permiso de Dispositivos cercanos para conectar la impresora.';
  if (code === 'printer_missing') return 'Selecciona primero una impresora en Configuración.';
  if (code === 'busy') return 'Hay otro comprobante enviándose. Espera a que termine.';
  if (code === 'not_connected') return 'La impresora está desconectada. Comprueba que esté encendida y cerca.';
  if (code === 'write_failed') return 'No se pudo enviar el comprobante. Verifica la impresora antes de reimprimir.';
  if (code === 'unsupported') return 'La impresión Bluetooth no funciona en Expo Go ni en el navegador.';
  return error instanceof Error ? error.message : 'No se pudo completar la operación con la impresora.';
}
