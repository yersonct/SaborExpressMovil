import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
// Asegúrate de que esta ruta sea la correcta hacia tu componente de mesas
import { WaiterDashboard } from '../../features/waiter/components/WaiterDashboard';

export default function WaiterHome() {
  return (
    <SafeAreaView style={styles.container}>
      <WaiterDashboard />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' }
});