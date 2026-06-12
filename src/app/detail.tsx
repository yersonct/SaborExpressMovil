import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function DetailScreen() {
  const router = useRouter();
  const { mesa } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalle del Pedido</Text>
      <View style={styles.card}>
        <Text style={styles.mesaText}>Estás atendiendo la: {mesa}</Text>
        <Text style={styles.infoText}>Aquí iría la lista de platos seleccionados por el cliente.</Text>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>⬅ Volver a las mesas</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0F172A', marginBottom: 20, textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', marginBottom: 30 },
  mesaText: { fontSize: 20, fontWeight: 'bold', color: '#E61C24', marginBottom: 10 },
  infoText: { fontSize: 16, color: '#64748B' },
  backButton: { backgroundColor: '#0F172A', paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
  backButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }
});