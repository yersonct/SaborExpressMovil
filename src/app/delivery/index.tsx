import React from 'react';
import { View, StyleSheet } from 'react-native';

// 🔥 AHORA SÍ IMPORTADO CON LLAVES CORRECTAMENTE
import { DeliveryOrdersList } from '../../features/delivery/components/DeliveryOrdersList';

export default function DeliveryScreen() {
  return (
    <View style={styles.container}>
      <DeliveryOrdersList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});