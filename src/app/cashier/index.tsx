import React from 'react';
import { StatusBar } from 'react-native';
import CashierDashboard from '../../features/cashier/components/CashierDashboard';

export default function CashierScreen() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <CashierDashboard />
    </>
  );
}