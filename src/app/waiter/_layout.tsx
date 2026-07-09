import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WaiterThemeProvider } from '@/features/waiter/context/WaiterThemeContext';
import { WaiterLanguageProvider } from '@/features/waiter/context/WaiterLanguageContext';

export default function WaiterTabsLayout() {
  return (
    <WaiterThemeProvider>
      <WaiterLanguageProvider>
        <Tabs
          screenOptions={{
            headerShown: false, // Ocultamos la cabecera porque tu Dashboard ya tiene una
            tabBarShowLabel: true,
            tabBarStyle: {
              backgroundColor: '#1A1A1A', 
              borderTopWidth: 1,
              borderTopColor: '#333333',
              height: 65, 
              paddingBottom: 10,
              paddingTop: 5,
            },
            tabBarActiveTintColor: '#E61C24', 
            tabBarInactiveTintColor: '#94A3B8', 
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: 'bold',
            }
          }}
        >
          <Tabs.Screen 
            name="index" 
            options={{ 
              title: 'Inicio', 
              tabBarIcon: ({ color, size }) => <Ionicons name="restaurant-outline" size={size} color={color} /> 
            }} 
          />
          <Tabs.Screen 
            name="profile" 
            options={{ 
              title: 'Perfil',
              tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> 
            }} 
          />
          <Tabs.Screen 
            name="settings" 
            options={{ 
              title: 'Ajustes',
              tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} /> 
            }} 
          />
        </Tabs>
      </WaiterLanguageProvider>
    </WaiterThemeProvider>
  );
}