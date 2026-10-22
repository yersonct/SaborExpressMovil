import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import type { PrinterDevice } from '@ricka7x/expo-thermal-printer';
import { isPd01Available, verifyBlePrinter } from '@/features/printer/pd01Service';
import { loadPd01Printer } from '@/features/printer/pd01Prefs';
import type { ApiLanguage } from '@/features/auth/services/apiLanguage';
import {
  isClassicPrinterReachable,
  isNativePrinterAvailable,
  printerErrorMessage,
} from '../services/printerService';
import { loadPrinterSelection, loadSavedPrinter, type PrinterSelection } from '../services/printerStorage';
import type { InvoicePrintTarget } from '../services/invoicePrintService';

const COPY: Record<ApiLanguage, {
  title: string; description: string; selectedPrinter: string; noneSelected: string;
  checking: string; available: string; unavailable: string; nativeRequired: string;
  print: string; pdf: string; search: string; close: string;
}> = {
  es: {
    title: 'Imprimir factura',
    description: 'Se comprueba la impresora guardada en este celular. Si no está disponible, podrás abrir el PDF.',
    selectedPrinter: 'Impresora seleccionada', noneSelected: 'No hay una impresora seleccionada.',
    checking: 'Comprobando conexión Bluetooth…', available: 'Disponible para imprimir',
    unavailable: 'No está encendida o disponible. Se usará el PDF.',
    nativeRequired: 'La conexión Bluetooth requiere la APK de desarrollo. Se usará el PDF.',
    print: 'Imprimir factura', pdf: 'Abrir o guardar PDF', search: 'Volver a comprobar', close: 'Cerrar',
  },
  en: {
    title: 'Print invoice',
    description: 'Checking the printer saved on this phone. If it is unavailable, you can open the PDF.',
    selectedPrinter: 'Selected printer', noneSelected: 'No printer is selected.',
    checking: 'Checking Bluetooth connection…', available: 'Ready to print',
    unavailable: 'It is off or unavailable. The PDF will be used.',
    nativeRequired: 'Bluetooth requires the Android development APK. The PDF will be used.',
    print: 'Print invoice', pdf: 'Open or save PDF', search: 'Check again', close: 'Close',
  },
  pt: {
    title: 'Imprimir fatura',
    description: 'Verificando a impressora salva neste celular. Se estiver indisponível, você poderá abrir o PDF.',
    selectedPrinter: 'Impressora selecionada', noneSelected: 'Nenhuma impressora selecionada.',
    checking: 'Verificando a conexão Bluetooth…', available: 'Disponível para imprimir',
    unavailable: 'Está desligada ou indisponível. O PDF será usado.',
    nativeRequired: 'A conexão Bluetooth requer o APK de desenvolvimento. O PDF será usado.',
    print: 'Imprimir fatura', pdf: 'Abrir ou salvar PDF', search: 'Verificar novamente', close: 'Fechar',
  },
  fr: {
    title: 'Imprimer la facture',
    description: 'Vérification de l’imprimante enregistrée sur ce téléphone. Si elle est indisponible, vous pourrez ouvrir le PDF.',
    selectedPrinter: 'Imprimante sélectionnée', noneSelected: 'Aucune imprimante sélectionnée.',
    checking: 'Vérification de la connexion Bluetooth…', available: 'Disponible pour imprimer',
    unavailable: 'Elle est éteinte ou indisponible. Le PDF sera utilisé.',
    nativeRequired: 'La connexion Bluetooth nécessite l’APK de développement. Le PDF sera utilisé.',
    print: 'Imprimer la facture', pdf: 'Ouvrir ou enregistrer le PDF', search: 'Vérifier à nouveau', close: 'Fermer',
  },
};

interface Props {
  visible: boolean;
  language: ApiLanguage;
  isDark: boolean;
  onClose: () => void;
  onPrint: (target: InvoicePrintTarget) => Promise<void>;
}

export function InvoicePrinterPicker({ visible, language, isDark, onClose, onPrint }: Props) {
  const copy = COPY[language] ?? COPY.es;
  const [checking, setChecking] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [searchKey, setSearchKey] = useState(0);
  const [selectedName, setSelectedName] = useState('');
  const [availableTarget, setAvailableTarget] = useState<InvoicePrintTarget | null>(null);
  const [status, setStatus] = useState('');
  const [printError, setPrintError] = useState('');
  const canSearch = Platform.OS !== 'web' && (isNativePrinterAvailable() || isPd01Available());
  const colors = {
    overlay: 'rgba(15,23,42,0.68)',
    surface: isDark ? '#111827' : '#FFFFFF',
    raised: isDark ? '#1E293B' : '#F8FAFC',
    text: isDark ? '#F8FAFC' : '#172033',
    muted: isDark ? '#CBD5E1' : '#64748B',
    border: isDark ? '#334155' : '#CBD5E1',
    success: isDark ? '#6EE7B7' : '#047857',
    error: isDark ? '#FCA5A5' : '#B91C1C',
    errorBg: isDark ? '#3B1118' : '#FEF2F2',
    accent: '#DB2730',
  };

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setChecking(true);
    setSelectedName('');
    setAvailableTarget(null);
    setPrintError('');
    setStatus(copy.noneSelected);

    void (async () => {
      try {
        const [savedSelection, classicPrinter, pd01Printer] = await Promise.all([
          loadPrinterSelection().catch(() => null),
          loadSavedPrinter().catch(() => null),
          loadPd01Printer().catch(() => null),
        ]);
        if (!active) return;

        const selectedKind: PrinterSelection | null =
          savedSelection === 'classic' && classicPrinter ? 'classic'
            : savedSelection === 'pd01' && pd01Printer ? 'pd01'
              : pd01Printer ? 'pd01'
                : classicPrinter ? 'classic' : null;
        const name = selectedKind === 'classic'
          ? classicPrinter?.name ?? ''
          : selectedKind === 'pd01' ? pd01Printer?.name ?? '' : '';
        setSelectedName(name);

        if (!selectedKind || !name) {
          setStatus(copy.noneSelected);
          return;
        }
        if (!canSearch) {
          setStatus(copy.nativeRequired);
          return;
        }

        if (selectedKind === 'classic' && classicPrinter) {
          const device: PrinterDevice = {
            address: classicPrinter.address,
            name: classicPrinter.name,
            bonded: false,
          };
          if (await isClassicPrinterReachable(device.address)) {
            if (active) {
              setAvailableTarget({ kind: 'classic', device });
              setStatus(copy.available);
            }
          } else if (active) {
            setStatus(copy.unavailable);
          }
          return;
        }

        if (selectedKind === 'pd01' && pd01Printer && isPd01Available()) {
          // El ID ya está guardado; conectar directamente evita una búsqueda BLE
          // completa antes de comprobar si esta impresora sigue encendida.
          await verifyBlePrinter(pd01Printer.id);
          if (active) {
            setAvailableTarget({ kind: 'pd01', device: pd01Printer });
            setStatus(copy.available);
          }
        } else if (active) {
          setStatus(copy.unavailable);
        }
      } catch (error) {
        if (active) setStatus(printerErrorMessage(error, language) || copy.unavailable);
      } finally {
        if (active) setChecking(false);
      }
    })();

    return () => { active = false; };
  }, [canSearch, copy.available, copy.nativeRequired, copy.noneSelected, copy.unavailable, language, searchKey, visible]);

  const select = useCallback(async (target: InvoicePrintTarget) => {
    if (printing || checking) return;
    setPrinting(true);
    setPrintError('');
    try {
      await onPrint(target);
      onClose();
    } catch (error) {
      setPrintError(printerErrorMessage(error, language));
    } finally {
      setPrinting(false);
    }
  }, [checking, language, onClose, onPrint, printing]);

  const ready = Boolean(availableTarget);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 18, backgroundColor: colors.overlay }}>
        <View style={{ width: '100%', maxWidth: 520, maxHeight: '88%', alignSelf: 'center', backgroundColor: colors.surface, borderRadius: 18, padding: 18, gap: 12 }}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{copy.title}</Text>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>{copy.description}</Text>

          <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, gap: 5, backgroundColor: colors.raised }}>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>{copy.selectedPrinter}</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{selectedName || copy.noneSelected}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {checking && <ActivityIndicator size="small" color={colors.accent} />}
              <Text style={{ color: ready ? colors.success : colors.muted, fontSize: 13, lineHeight: 19 }}>
                {checking ? copy.checking : status}
              </Text>
            </View>
          </View>

          {printError ? <Text accessibilityRole="alert" style={{ color: colors.error, backgroundColor: colors.errorBg, borderRadius: 10, padding: 10 }}>{printError}</Text> : null}

          {checking ? (
            <Pressable disabled style={{ backgroundColor: colors.accent, borderRadius: 10, padding: 13, alignItems: 'center', opacity: 0.6 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{copy.checking}</Text>
            </Pressable>
          ) : ready && availableTarget ? (
            <Pressable
              disabled={printing}
              onPress={() => void select(availableTarget)}
              accessibilityRole="button"
              style={{ backgroundColor: colors.accent, borderRadius: 10, padding: 13, alignItems: 'center', opacity: printing ? 0.6 : 1 }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{printing ? copy.checking : copy.print}</Text>
            </Pressable>
          ) : (
            <Pressable
              disabled={printing}
              onPress={() => void select({ kind: 'pdf' })}
              accessibilityRole="button"
              style={{ backgroundColor: colors.accent, borderRadius: 10, padding: 13, alignItems: 'center', opacity: printing ? 0.6 : 1 }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{printing ? copy.checking : copy.pdf}</Text>
            </Pressable>
          )}

          {ready && !checking && (
            <Pressable
              disabled={printing}
              onPress={() => void select({ kind: 'pdf' })}
              accessibilityRole="button"
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, alignItems: 'center', opacity: printing ? 0.6 : 1 }}
            >
              <Text style={{ color: colors.text, fontWeight: '700' }}>{copy.pdf}</Text>
            </Pressable>
          )}

          {!checking && !ready && canSearch && (
            <Pressable
              disabled={printing}
              onPress={() => setSearchKey((value) => value + 1)}
              accessibilityRole="button"
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, alignItems: 'center', opacity: printing ? 0.6 : 1 }}
            >
              <Text style={{ color: colors.text, fontWeight: '700' }}>{copy.search}</Text>
            </Pressable>
          )}

          <Pressable disabled={printing} onPress={onClose} accessibilityRole="button" style={{ padding: 9, alignItems: 'center' }}>
            <Text style={{ color: colors.muted, fontWeight: '700' }}>{copy.close}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
