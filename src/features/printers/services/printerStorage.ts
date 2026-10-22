import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SavedPrinter } from '../types';

const STORAGE_KEY = '@saborexpress/pos/impresora-preferida/v1';
const SELECTION_KEY = '@saborexpress/pos/impresora-seleccionada/v1';

export type PrinterSelection = 'classic' | 'pd01';

export async function loadPrinterSelection(): Promise<PrinterSelection | null> {
  const value = await AsyncStorage.getItem(SELECTION_KEY);
  return value === 'classic' || value === 'pd01' ? value : null;
}

export async function savePrinterSelection(value: PrinterSelection | null): Promise<void> {
  if (value) await AsyncStorage.setItem(SELECTION_KEY, value);
  else await AsyncStorage.removeItem(SELECTION_KEY);
}

/** Preferencia local POR DISPOSITIVO; no se sincroniza entre empleados. */
export async function loadSavedPrinter(): Promise<SavedPrinter | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      value && typeof value === 'object' &&
      'address' in value && typeof value.address === 'string' &&
      'name' in value && typeof value.name === 'string' &&
      'paperWidth' in value && (value.paperWidth === 58 || value.paperWidth === 80)
    ) return value as SavedPrinter;
  } catch { /* Valor antiguo o corrupto. */ }
  return null;
}

export async function savePrinter(printer: SavedPrinter): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(printer));
}

export async function removePrinter(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
