import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../features/auth/context/AuthContext';
import { resolveEffectiveRole } from '../features/auth/services/roleMap';
import PrinterSettingsScreen from '../features/printers/components/PrinterSettingsScreen';
import { CashierProvider } from '../features/cashier/context/CashierContext';

/** Acceso reservado al cajero con turno activo; no depende de ocultar un botón. */
export default function PrinterRoute() {
  const { user, initializing } = useAuth();
  if (initializing) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;
  if (!user) return <Redirect href="/" />;

  const effectiveRole = resolveEffectiveRole(user.roles, user.hasActiveShift, user.activeShiftRoleName);
  const normalized = String(effectiveRole || '').toLocaleLowerCase();
  // Cambiar aquí si roleMap utiliza identificadores especiales para CAJERO.
  if (!normalized.includes('cajer') && !normalized.includes('cashier')) {
    return <Redirect href="/" />;
  }
  return <CashierProvider><PrinterSettingsScreen /></CashierProvider>;
}
