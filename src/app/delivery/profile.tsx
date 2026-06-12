import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DeliveryProfile() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil del Repartidor</Text>
      <Text style={styles.icon}>🛵</Text>
    </View>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }, title: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' }, icon: { fontSize: 80, marginTop: 20 } });