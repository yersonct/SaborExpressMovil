import React from 'react';
import { StatusBar, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { DeliveryOrdersList } from '../../features/delivery/components/DeliveryOrdersList';

export default function DeliveryScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutButton} onPress={() => router.replace('/')}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
      <StatusBar barStyle="dark-content" />
      <DeliveryOrdersList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  logoutButton: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#E61C24', borderRadius: 6 },
  logoutText: { color: '#fff', fontWeight: '600' },
});
