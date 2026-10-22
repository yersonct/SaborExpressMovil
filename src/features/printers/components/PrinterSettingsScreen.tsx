import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Platform, Pressable, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { onConnectionChanged, type PrinterDevice } from '@ricka7x/expo-thermal-printer';
import type { PaperWidth, SavedPrinter } from '../types';
import {
  loadPrinterSelection, loadSavedPrinter, savePrinter, savePrinterSelection,
  type PrinterSelection,
} from '../services/printerStorage';
import { useAuth } from '@/features/auth/context/AuthContext';
import { loadPd01Printer, savePd01Printer, type SavedPd01Printer } from '@/features/printer/pd01Prefs';
import { isPd01Available, printPd01Test, scanPd01Printers } from '@/features/printer/pd01Service';
import {
  currentPrinterIsConnected, forgetPrinter, listAvailablePrinters,
  isNativePrinterAvailable, printerErrorMessage, printTestReceipt, selectPrinter,
} from '../services/printerService';
import { PRINTER_SETTINGS_COPY } from "@/locales/PrinterSettingsTranslations";
import { useCashierContext } from '@/features/cashier/context/CashierContext';
import type { ApiLanguage } from '@/features/auth/services/apiLanguage';

const RED = '#DB2730';
const INK = '#192334';

export default function PrinterSettingsScreen() {
  const { user } = useAuth();
  const { language: contextLanguage, isDark: contextIsDark, hydrated: preferencesHydrated } = useCashierContext();
  const params = useLocalSearchParams<{ lang?: string; dark?: string }>();
  const routeLanguage = Array.isArray(params.lang) ? params.lang[0] : params.lang;
  const language = (["es", "en", "pt", "fr"] as string[]).includes(routeLanguage ?? "")
    ? routeLanguage as ApiLanguage
    : contextLanguage;
  const isDark = params.dark === "1" ? true : params.dark === "0" ? false : contextIsDark;
  const t = PRINTER_SETTINGS_COPY[language];
  const colors = {
    background: isDark ? '#0B1220' : '#F5F6F8',
    card: isDark ? '#111827' : '#FFFFFF',
    text: isDark ? '#F8FAFC' : '#192334',
    muted: isDark ? '#CBD5E1' : '#667080',
    border: isDark ? '#334155' : '#E8ECF0',
    outlineBorder: isDark ? '#475569' : '#D9DCE1',
    selectedBorder: isDark ? '#F87171' : RED,
    selectedBackground: isDark ? '#3B1D28' : '#FFF0F1',
    success: isDark ? '#6EE7B7' : '#237A55',
    successBackground: isDark ? '#123329' : '#E8F5EE',
    error: isDark ? '#FCA5A5' : '#A12027',
    errorBackground: isDark ? '#3B1118' : '#FFF0F0',
    progressBackground: isDark ? '#422006' : '#FFF5E8',
  };
  const cardStyle = [styles.card, { backgroundColor: colors.card, borderColor: colors.border }];
  const sectionTextStyle = [styles.section, { color: colors.text }];
  const mutedTextStyle = [styles.muted, { color: colors.muted }];
  const printerNameStyle = [styles.printerName, { color: colors.text }];
  const outlineStyle = [styles.outline, { borderColor: colors.outlineBorder }];
  const outlineTextStyle = [styles.outlineText, { color: colors.text }];
  const nativePrinterAvailable = isNativePrinterAvailable();
  const [saved, setSaved] = useState<SavedPrinter | null>(null);
  const [pd01, setPd01] = useState<SavedPd01Printer | null>(null);
  const [pd01Devices, setPd01Devices] = useState<SavedPd01Printer[]>([]);
  const [selectedKind, setSelectedKind] = useState<PrinterSelection | null>(null);
  const [devices, setDevices] = useState<PrinterDevice[]>([]);
  const [showOtherPrinters, setShowOtherPrinters] = useState(false);
  const [width, setWidth] = useState<PaperWidth>(58);
  const [connected, setConnected] = useState(false);
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState('');
  const workingRef = useRef(false);
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
      if (active) { setMessage(printerErrorMessage(e, language)); setError(true); }
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
  }, [language]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      loadPrinterSelection().catch(() => null),
      loadSavedPrinter().catch(() => null),
      loadPd01Printer(user?.token).catch(() => null),
    ]).then(([selection, classicPrinter, pd01Printer]) => {
      if (!active) return;
      setPd01(pd01Printer);
      const availableSelection =
        (selection === 'classic' && classicPrinter ? 'classic' : null) ||
        (selection === 'pd01' && pd01Printer ? 'pd01' : null);
      setSelectedKind(availableSelection ?? (pd01Printer ? 'pd01' : classicPrinter ? 'classic' : null));
    });
    return () => { active = false; };
  }, [user?.token]);

  const run = useCallback(async (operation: () => Promise<void>, status: string) => {
    if (workingRef.current) return;
    workingRef.current = true;
    setWorking(true);
    setProgress(status);
    setMessage(''); setError(false);
    try { await operation(); }
    catch (e: unknown) { setError(true); setMessage(printerErrorMessage(e, language)); }
    finally { workingRef.current = false; setWorking(false); setProgress(''); }
  }, [language]);

  const refresh = () => run(async () => {
    const found = await listAvailablePrinters();
    setDevices(found);
    setMessage(found.length ? `${found.length} ${t.linkedDevices.toLocaleLowerCase()}.` : t.noPairedDevices);
  }, t.pairing);

  const choose = (device: PrinterDevice) => run(async () => {
    const printer = await selectPrinter(device, width, t.noName);
    setSaved(printer); setConnected(true); setSelectedKind('classic');
    setMessage(t.printerSaved.replace('{name}', printer.name));
  }, t.pairing);

  const refreshPd01 = () => run(async () => {
    const found = await scanPd01Printers();
    setPd01Devices(found);
    setMessage(found.length ? t.pd01Found.replace('{count}', String(found.length)) : t.noPd01);
  }, t.searching);

  const choosePd01 = (device: SavedPd01Printer) => run(async () => {
    if (!user?.token) throw { code: 'login_required' };
    // Confirmar significa imprimir realmente. Si la prueba falla, no se guarda
    // una impresora que luego aparezca seleccionada pero no pueda imprimir.
    await printPd01Test(device.id, language);
    await savePd01Printer(user.token, device);
    await savePrinterSelection('pd01');
    setPd01(device); setSelectedKind('pd01'); setPd01Devices([]);
    setMessage(t.pd01Saved.replace('{name}', device.name));
  }, t.savingPd01);

  const test = () => run(async () => {
    if (selectedKind === 'pd01') {
      if (!pd01) throw { code: 'pd01_missing' };
      await printPd01Test(pd01.id, language);
    } else {
      await printTestReceipt(language);
    }
    if (selectedKind === 'classic') setConnected(true);
    setMessage(t.sent);
  }, t.testPrint);

  const forget = () => run(async () => {
    await forgetPrinter();
    const next = pd01 ? 'pd01' : null;
    await savePrinterSelection(next);
    setSaved(null); setConnected(false); setSelectedKind(next);
    setMessage(t.printerRemoved);
  }, t.removing);

  const forgetPd01 = () => run(async () => {
    if (user?.token) await savePd01Printer(user.token, null);
    const next = selectedKind === 'pd01' && saved ? 'classic' : selectedKind === 'pd01' ? null : selectedKind ?? (saved ? 'classic' : null);
    await savePrinterSelection(next);
    setPd01(null); setSelectedKind(next);
    setMessage(t.pd01Removed);
  }, t.removing);

  const updateWidth = (next: PaperWidth) => run(async () => {
    setWidth(next);
    if (saved) {
      // Cambiar el ancho no debería obligar a reconectar por Bluetooth.
      const updated = { ...saved, paperWidth: next };
      await savePrinter(updated);
      setSaved(updated);
    }
  }, t.savingWidth);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.root, { backgroundColor: colors.background }]}>
      {!preferencesHydrated ? <ActivityIndicator color={RED} /> : (
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.back}>
          <Text style={styles.backText}>‹ {t.back}</Text>
        </Pressable>
        <Text style={[styles.eyebrow, { color: colors.muted }]}>{t.eyebrow}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{t.title}</Text>
        <Text style={[styles.description, { color: colors.muted }]}>{t.description}</Text>

        {loading ? <ActivityIndicator color={RED} /> : (
          <View style={cardStyle}>
            <Text style={sectionTextStyle}>{t.defaultPrinter}</Text>
            {selectedKind === 'pd01' && pd01 ? (
              <>
                <Text style={printerNameStyle}>{pd01.name}</Text>
                <Text style={[styles.current, { color: colors.success }]}>{t.selected}</Text>
                <Pressable disabled={working || !isPd01Available()} onPress={test} style={[styles.action, (working || !isPd01Available()) && styles.disabled]} accessibilityRole="button">
                  <Text style={styles.actionText}>{t.printPd01}</Text>
                </Pressable>
                <Pressable disabled={working} onPress={forgetPd01} style={outlineStyle} accessibilityRole="button">
                  <Text style={outlineTextStyle}>{t.forgetPd01}</Text>
                </Pressable>
              </>
            ) : selectedKind === 'classic' && saved ? (
              <>
                <Text style={printerNameStyle}>{saved.name}</Text>
                <Text style={[styles.current, { color: connected ? colors.success : colors.muted }]}>{connected ? t.connected : t.reconnect}</Text>
                <Text style={mutedTextStyle}>{saved.paperWidth} mm</Text>
                <Pressable disabled={working || !nativePrinterAvailable} onPress={test} style={[styles.action, (working || !nativePrinterAvailable) && styles.disabled]} accessibilityRole="button">
                  <Text style={styles.actionText}>{t.testPrint}</Text>
                </Pressable>
                <Pressable disabled={working} onPress={forget} style={outlineStyle} accessibilityRole="button">
                  <Text style={outlineTextStyle}>{t.forget}</Text>
                </Pressable>
              </>
            ) : <Text style={mutedTextStyle}>{t.noPrinter}</Text>}
          </View>
        )}

        <View style={cardStyle}>
          <Text style={sectionTextStyle}>{t.pd01Title}</Text>
          <Text style={mutedTextStyle}>{t.pd01Description}</Text>
          <Pressable disabled={working || !isPd01Available()} onPress={refreshPd01} style={[styles.action, (working || !isPd01Available()) && styles.disabled]} accessibilityRole="button">
            <Text style={styles.actionText}>{working ? t.processing : t.searchPd01}</Text>
          </Pressable>
          {pd01Devices.map((device) => (
            <Pressable key={device.id} disabled={working} onPress={() => choosePd01(device)} style={[styles.device, { borderColor: colors.border }]} accessibilityRole="button">
              <View style={{ flex: 1 }}>
                <Text style={printerNameStyle}>{device.name}</Text>
                <Text style={mutedTextStyle}>{device.id}</Text>
              </View>
              <Text style={styles.arrow}>{t.choosePd01} ›</Text>
            </Pressable>
          ))}
          {!isPd01Available() && <Text style={mutedTextStyle}>{t.unavailable}</Text>}
          <Pressable disabled={working || !nativePrinterAvailable} onPress={() => { setShowOtherPrinters(true); refresh(); }} style={[outlineStyle, (working || !nativePrinterAvailable) && styles.disabled]} accessibilityRole="button">
            <Text style={outlineTextStyle}>{t.searchDevices}</Text>
          </Pressable>
          {showOtherPrinters && (
            <>
              <Text style={mutedTextStyle}>{Platform.OS === 'android' ? t.pairInstructions : t.nearbyInstructions}</Text>
              {devices.map((device) => (
                <Pressable key={device.address} disabled={working} onPress={() => choose(device)}
                  accessibilityRole="button" style={[styles.device, { borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={printerNameStyle}>{device.name || t.noName}</Text>
                    <Text style={mutedTextStyle}>{device.address}</Text>
                  </View>
                  <Text style={styles.arrow}>{t.select} ›</Text>
                </Pressable>
              ))}
            </>
          )}
        </View>

        {selectedKind === 'classic' && saved && (
          <View style={cardStyle}>
            <Text style={sectionTextStyle}>{t.paperWidth}</Text>
            <View style={styles.row}>
              {([58, 80] as const).map((value) => (
                <Pressable key={value} disabled={working} onPress={() => updateWidth(value)} accessibilityRole="radio"
                  accessibilityState={{ checked: width === value }}
                  style={[styles.chip, { borderColor: colors.outlineBorder }, width === value && { borderColor: colors.selectedBorder, backgroundColor: colors.selectedBackground }]}>
                  <Text style={[styles.chipText, { color: colors.muted }, width === value && { color: colors.selectedBorder }]}>{value} mm</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
        {working && (
          <View style={[styles.progress, { backgroundColor: colors.progressBackground }]} accessibilityLiveRegion="polite">
            <ActivityIndicator color={RED} />
            <Text style={[styles.progressText, { color: colors.text }]}>{progress}</Text>
          </View>
        )}
        {!!message && (
          <View accessibilityRole="alert" style={[styles.feedback, { backgroundColor: error ? colors.errorBackground : colors.successBackground }]}>
            <Text style={[styles.feedbackText, { color: error ? colors.error : colors.success }]}>{message}</Text>
          </View>
        )}
        {Platform.OS !== 'web' && <Text style={[styles.footnote, { color: colors.muted }]}>{t.permission}</Text>}
      </ScrollView>
      )}
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
  progress: { flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, backgroundColor: '#FFF5E8', padding: 14 },
  progressText: { color: INK, flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  feedbackError: { backgroundColor: '#FFF0F0' },
  feedbackText: { color: '#226044', fontWeight: '600', lineHeight: 20 },
  feedbackErrorText: { color: '#A12027' },
  footnote: { fontSize: 12, color: '#667080', lineHeight: 19 },
});
