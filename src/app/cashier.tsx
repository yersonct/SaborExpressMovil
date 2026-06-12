import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../features/auth/hooks/useAuth'; 
import { CashierCalculator } from '../features/cashier/components/CashierCalculator'; 

export default function CashierScreen() {
  const router = useRouter();
  
  const { handleLogout } = useAuth();

  const onLogoutPress = async () => {
    await handleLogout(); 
    router.replace('/'); 
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogoutPress}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
      <CashierCalculator />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 15, alignItems: 'flex-end', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  logoutButton: { backgroundColor: '#E61C24', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: '#FFF', fontWeight: 'bold' }
});