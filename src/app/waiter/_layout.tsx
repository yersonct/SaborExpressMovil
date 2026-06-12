import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

function CustomDrawerContent(props: any) {
  const router = useRouter();

  return (
    <View style={styles.drawerContainer}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        <View style={styles.drawerHeader}>
          <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} style={styles.profilePic} />
          <Text style={styles.userName}>Juan Pérez</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>MESERO</Text>
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

export default function WaiterDrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: '#1E293B' },
          headerTintColor: '#FFFFFF',
          drawerActiveBackgroundColor: '#FEF2F2',
          drawerActiveTintColor: '#E61C24',
          drawerInactiveTintColor: '#334155',
          drawerLabelStyle: { fontSize: 16, fontWeight: 'bold', marginLeft: -10 },
        }}
      >
        <Drawer.Screen 
          name="index" 
          options={{ 
            title: 'Inicio', 
            drawerLabel: 'Panel Principal',
            drawerIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} /> 
          }} 
        />
        <Drawer.Screen 
          name="profile" 
          options={{ 
            title: 'Mi Perfil',
            drawerIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} /> 
          }} 
        />
        <Drawer.Screen 
          name="settings" 
          options={{ 
            title: 'Configuración',
            drawerIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} /> 
          }} 
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  drawerContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  drawerHeader: { backgroundColor: '#1E293B', padding: 30, paddingTop: 60, alignItems: 'center', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  profilePic: { width: 80, height: 80, borderRadius: 40, marginBottom: 10, borderWidth: 2, borderColor: '#E2E8F0' },
  userName: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  roleBadge: { backgroundColor: 'rgba(230, 28, 36, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#E61C24' },
  roleText: { color: '#FFD7D9', fontSize: 12, fontWeight: 'bold' },
  drawerItemsContainer: { paddingTop: 20 },
  drawerFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FFFFFF' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  logoutText: { color: '#E61C24', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }
});