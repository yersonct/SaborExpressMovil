import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// --- 1. COMPONENTE DEL MENÚ PERSONALIZADO ---
function CustomDeliveryDrawerContent(props: any) {
  const router = useRouter();

  return (
    <View style={styles.drawerContainer}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        {/* Cabecera del Menú con Foto e Información */}
        <View style={styles.drawerHeader}>
          {/* Usamos un ícono de repartidor genérico por ahora */}
          <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png' }} style={styles.profilePic} />
          <Text style={styles.userName}>Carlos Gómez</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>REPARTIDOR ACTIVO</Text>
          </View>
        </View>

        {/* Lista de Rutas (Index, Profile, Settings) */}
        <View style={styles.drawerItemsContainer}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      {/* Pie del Menú con Botón de Cerrar Sesión fijo */}
      <View style={styles.drawerFooter}>
        <TouchableOpacity style={styles.logoutButton} onPress={() => router.replace('/')}>
          <Ionicons name="log-out-outline" size={24} color="#E61C24" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- 2. CONFIGURACIÓN DEL ROUTER ---
export default function DeliveryLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDeliveryDrawerContent {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: '#1A1A1A' }, // Cabecera oscura elegante
          headerTintColor: '#FFFFFF',
          drawerActiveBackgroundColor: '#FFF0EE', // Fondo rojizo suave cuando está seleccionado
          drawerActiveTintColor: '#E61C24', // Letra roja corporativa
          drawerInactiveTintColor: '#334155',
          drawerLabelStyle: { fontSize: 16, fontWeight: 'bold', marginLeft: -10 },
          headerTitleAlign: 'center',
        }}
      >
        <Drawer.Screen 
          name="index" 
          options={{ 
            title: 'Pedidos Disponibles', 
            drawerLabel: 'Envíos',
            drawerIcon: ({ color }) => <Ionicons name="bicycle-outline" size={24} color={color} /> 
          }} 
        />
        <Drawer.Screen 
          name="profile" 
          options={{ 
            title: 'Mi Perfil', 
            drawerLabel: 'Perfil',
            drawerIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} /> 
          }} 
        />
        <Drawer.Screen 
          name="settings" 
          options={{ 
            title: 'Configuración', 
            drawerLabel: 'Ajustes',
            drawerIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} /> 
          }} 
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

// --- 3. ESTILOS ---
const styles = StyleSheet.create({
  drawerContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  drawerHeader: { 
    backgroundColor: '#1A1A1A', 
    padding: 30, 
    paddingTop: 60, 
    alignItems: 'center', 
    borderBottomLeftRadius: 20, 
    borderBottomRightRadius: 20 
  },
  profilePic: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    marginBottom: 10, 
    borderWidth: 2, 
    borderColor: '#333333', 
    backgroundColor: '#FFF' 
  },
  userName: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  roleBadge: { 
    backgroundColor: 'rgba(16, 185, 129, 0.2)', 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#10B981' 
  },
  roleText: { color: '#D1FAE5', fontSize: 12, fontWeight: 'bold' },
  drawerItemsContainer: { paddingTop: 20 },
  drawerFooter: { 
    padding: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9', 
    backgroundColor: '#FFFFFF' 
  },
  logoutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  logoutText: { color: '#E61C24', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }
});