import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Platform, Pressable, SafeAreaView, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { router } from 'expo-router';
import { onConnectionChanged, type PrinterDevice } from '@ricka7x/expo-thermal-printer';
import type { PaperWidth, SavedPrinter } from '../types';
import { loadSavedPrinter, savePrinter } from '../services/printerStorage';
import {
  currentPrinterIsConnected, forgetPrinter, listAvailablePrinters,
  printerErrorMessage, printTestReceipt, selectPrinter,
} from '../services/printerService';

const RED = '#DB2730';
const INK = '#192334';

export default function PrinterSettingsScreen() {
  const [saved, setSaved] = useState<SavedPrinter | null>(null);
  const [devices, setDevices] = useState<PrinterDevice[]>([]);
  const [width, setWidth] = useState<PaperWidth>(58);
  const [connected, setConnected] = useState(false);
  const [working, setWorking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    loadSavedPrinter().then((printer) => {
      if (active) {
        setSaved(printer);
        setWidth(printer?.paperWidth ?? 58);
        setConnected(currentPrinterIsConnected(printer?.address));
      }
    }).catch((e: unknown) => {
      if (active) { setMessage(printerErrorMessage(e)); setError(true); }
    }).finally(() => { if (active) setLoading(false); });

    let subscription: { remove(): void } | undefined;
    try {
      subscription = onConnectionChanged(() => {
        if (!active) return;
        loadSavedPrinter().then((printer) => {
          if (active) setConnected(currentPrinterIsConnected(printer?.address));
        }).catch(() => {});
      });
    } catch { /* Expo Go / build nativa sin el módulo; se informa al buscar. */ }
    return () => { active = false; subscription?.remove(); };
  }, []);

  const run = useCallback(async (operation: () => Promise<void>) => {
    if (working) return;
    setWorking(true);
    setMessage(''); setError(false);
    try { await operation(); }
    catch (e: unknown) { setError(true); setMessage(printerErrorMessage(e)); }
    finally { setWorking(false); }
  }, [working]);

  const refresh = () => run(async () => {
    const found = await listAvailablePrinters();
    setDevices(found);
    setMessage(found.length ? `${found.length} dispositivo(s) emparejado(s).` :
      'No se encontraron dispositivos emparejados. Vincula la impresora desde los ajustes Bluetooth del teléfono y vuelve a buscar.');
  });

  const choose = (device: PrinterDevice) => run(async () => {
    const printer = await selectPrinter(device, width);
    setSaved(printer); setConnected(true);
    setMessage(`Impresora ${printer.name} guardada correctamente.`);
  });

  const test = () => run(async () => {
    await printTestReceipt();
    setConnected(true);
    setMessage('Comprobante enviado. Comprueba que el papel haya salido correctamente.');
  });

  const forget = () => run(async () => {
    await forgetPrinter();
    setSaved(null); setConnected(false);
    setMessage('Se quitó la impresora guardada en este teléfono.');
  });

  const updateWidth = (next: PaperWidth) => run(async () => {
    setWidth(next);
    if (saved) {
      // Cambiar el ancho no debería obligar a reconectar por Bluetooth.
      const updated = { ...saved, paperWidth: next };
      await savePrinter(updated);
      setSaved(updated);
    }
  });

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.back}>
          <Text style={styles.backText}>‹ Volver</Text>
        </Pressable>
        <Text style={styles.eyebrow}>CONFIGURACIÓN DE CAJA</Text>
        <Text style={styles.title}>Impresora Bluetooth</Text>
        <Text style={styles.description}>Conecta una impresora térmica ESC/POS para imprimir los comprobantes de venta.</Text>

        {loading ? <ActivityIndicator color={RED} /> : (
          <View style={styles.card}>
            <Text style={styles.section}>Impresora predeterminada</Text>
            {saved ? (
              <>
                <Text style={styles.printerName}>{saved.name}</Text>
                <Text style={styles.muted}>{saved.paperWidth} mm · {connected ? 'Conectada' : 'Sin conexión (se reconectará al imprimir)'}</Text>
                <Pressable disabled={working} onPress={test} style={[styles.action, working && styles.disabled]} accessibilityRole="button">
                  <Text style={styles.actionText}>Imprimir prueba</Text>
                </Pressable>
                <Pressable disabled={working} onPress={forget} style={styles.outline} accessibilityRole="button">
                  <Text style={styles.outlineText}>Olvidar impresora</Text>
                </Pressable>
              </>
            ) : <Text style={styles.muted}>Todavía no hay ninguna impresora configurada.</Text>}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.section}>Ancho del papel</Text>
          <View style={styles.row}>
            {([58, 80] as const).map((value) => (
              <Pressable key={value} disabled={working} onPress={() => updateWidth(value)} accessibilityRole="radio"
                accessibilityState={{ checked: width === value }}
                style={[styles.chip, width === value && styles.selectedChip]}>
                <Text style={[styles.chipText, width === value && styles.selectedChipText]}>{value} mm</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>{Platform.OS === 'android' ? 'Dispositivos vinculados' : 'Impresoras cercanas'}</Text>
          <Text style={styles.muted}>
            {Platform.OS === 'android'
              ? 'Primero empareja la impresora en Ajustes → Bluetooth. Luego pulsa «Buscar dispositivos». No necesitas depuración USB.'
              : 'Activa Bluetooth para buscar impresoras térmicas compatibles con BLE.'}
          </Text>
          <Pressable disabled={working} onPress={refresh} style={[styles.action, working && styles.disabled]} accessibilityRole="button">
            <Text style={styles.actionText}>{working ? 'Procesando…' : 'Buscar dispositivos'}</Text>
          </Pressable>
          {devices.map((device) => (
            <Pressable key={device.address} disabled={working} onPress={() => choose(device)}
              accessibilityRole="button" style={styles.device}>
              <View style={{ flex: 1 }}>
                <Text style={styles.printerName}>{device.name || 'Dispositivo sin nombre'}</Text>
                <Text style={styles.muted}>{device.address}</Text>
                {saved?.address === device.address && <Text style={styles.current}>Seleccionada</Text>}
              </View>
              <Text style={styles.arrow}>Elegir ›</Text>
            </Pressable>
          ))}
        </View>
        {!!message && (
          <View accessibilityRole="alert" style={[styles.feedback, error && styles.feedbackError]}>
            <Text style={[styles.feedbackText, error && styles.feedbackErrorText]}>{message}</Text>
          </View>
        )}
        <Text style={styles.footnote}>La impresora se guarda solo en este dispositivo. La primera conexión puede pedir permiso para usar dispositivos cercanos.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F6F8' },
  content: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 40, gap: 16 },
  back: { alignSelf: 'flex-start', paddingVertical: 8 },
  backText: { color: RED, fontWeight: '700', fontSize: 16 },
  eyebrow: { fontSize: 11, letterSpacing: 1.5, color: '#747E8B', fontWeight: '700' },
  title: { fontSize: 27, fontWeight: '800', color: INK },
  description: { color: '#667080', lineHeight: 21, fontSize: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, gap: 13,
    borderWidth: 1, borderColor: '#E8ECF0' },
  section: { fontSize: 16, color: INK, fontWeight: '800' },
  printerName: { fontSize: 14, color: INK, fontWeight: '700' },
  muted: { color: '#667080', fontSize: 12, lineHeight: 20 },
  action: { backgroundColor: RED, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionText: { fontSize: 14, color: '#fff', fontWeight: '800' },
  disabled: { opacity: 0.55 },
  outline: { borderWidth: 1, borderColor: '#D9DCE1', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  outlineText: { color: '#404C5D', fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10 },
  chip: { paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#D6DCE4', flex: 1, alignItems: 'center' },
  selectedChip: { borderColor: RED, backgroundColor: '#FFF0F1' },
  chipText: { color: '#667080', fontWeight: '700' },
  selectedChipText: { color: RED },
  device: { flexDirection: 'row', alignItems: 'center', paddingTop: 15, paddingBottom: 5,
    borderTopWidth: 1, borderColor: '#EDF0F3', gap: 12 },
  current: { color: '#237A55', fontSize: 12, fontWeight: '700' },
  arrow: { color: RED, fontWeight: '700', fontSize: 13 },
  feedback: { borderRadius: 12, backgroundColor: '#E8F5EE', padding: 14 },
  feedbackError: { backgroundColor: '#FFF0F0' },
  feedbackText: { color: '#226044', fontWeight: '600', lineHeight: 20 },
  feedbackErrorText: { color: '#A12027' },
  footnote: { fontSize: 12, color: '#667080', lineHeight: 19 },
});
