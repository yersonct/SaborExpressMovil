import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

function CustomClientDrawerContent(props: any) {
  const router = useRouter();

  return (
    <View style={styles.drawerContainer}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        <View style={styles.drawerHeader}>
          <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }} style={styles.profilePic} />
          <Text style={styles.userName}>Cliente Frecuente</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>MIEMBRO VIP</Text>
          </View>
        </View>

        <View style={styles.drawerItemsContainer}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      <View style={styles.drawerFooter}>
        <TouchableOpacity style={styles.logoutButton} onPress={() => router.replace('/')}>
          <Ionicons name="log-out-outline" size={24} color="#E61C24" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ClientDrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomClientDrawerContent {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: '#1E293B' },
          headerTintColor: '#FFFFFF',
          drawerActiveBackgroundColor: '#FEF2F2',
          drawerActiveTintColor: '#E61C24',
          drawerInactiveTintColor: '#334155',
          drawerLabelStyle: { fontSize: 16, fontWeight: 'bold', marginLeft: -10 },
          headerShown: false // Ocultamos el header para hacer uno personalizado
        }}
      >
        <Drawer.Screen 
          name="index" 
          options={{ 
            title: 'Hacer Pedido', 
            drawerLabel: 'Menú Principal',
            drawerIcon: ({ color }) => <Ionicons name="fast-food-outline" size={24} color={color} /> 
          }} 
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  drawerContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  drawerHeader: { backgroundColor: '#1E293B', padding: 30, paddingTop: 60, alignItems: 'center', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  profilePic: { width: 80, height: 80, borderRadius: 40, marginBottom: 10, borderWidth: 2, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
  userName: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  roleBadge: { backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#10B981' },
  roleText: { color: '#D1FAE5', fontSize: 12, fontWeight: 'bold' },
  drawerItemsContainer: { paddingTop: 20 },
  drawerFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FFFFFF' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  logoutText: { color: '#E61C24', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }
});