import React from 'react';
import { StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// 🔥 1. Importamos el Provider y el Contexto del cajero
import { CashierProvider, useCashierContext } from '../../features/cashier/components/context/CashierContext';
import { TRANSLATIONS, LanguageCode } from '../../locales/CashierTranslations';

// 🔥 2. Creamos un componente interno exclusivo para las pestañas.
// Esto es OBLIGATORIO porque para leer el idioma, este componente debe existir
// "por dentro" de la burbuja del CashierProvider.
function CashierTabs() {
  const router = useRouter();
  
  // Leemos el idioma y el modo oscuro en tiempo real
  const { language, isDark } = useCashierContext();
  const t = TRANSLATIONS[language as LanguageCode] || TRANSLATIONS['es'];

  // Colores dinámicos para que la barra inferior también reaccione al modo oscuro
  const tabBarBg = isDark ? '#1E293B' : '#FFFFFF';
  const tabBarBorder = isDark ? '#334155' : '#E2E8F0';
  const inactiveColor = isDark ? '#64748B' : '#94A3B8';

  return (
    <Tabs
      screenOptions={{
        headerShown: false, 
        tabBarStyle: [styles.tabBar, { backgroundColor: tabBarBg, borderTopColor: tabBarBorder }],
        tabBarActiveTintColor: '#E61C24', // Rojo SaborExpress siempre activo
        tabBarInactiveTintColor: inactiveColor, 
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {/* PESTAÑA 1: INICIO (CAJA) */}
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabHome || 'Caja',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
        }}
      />

      {/* PESTAÑA 2: PERFIL */}
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabProfile || 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 🔥 PESTAÑA 3: CONFIGURACIÓN (La que hicimos hace un rato) */}
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabSettings || 'Ajustes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      
      {/* PESTAÑA 4: SALIR */}
      <Tabs.Screen
        name="logout"
        options={{
          title: t.tabLogout || 'Salir',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="log-out-outline" size={size} color={color} />
          ),
        }}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault(); 
            router.replace('/');
          },
        })}
      />
    </Tabs>
  );
}

// 🔥 3. Este es el componente Layout que se exporta. 
// Su única función es crear la "Burbuja" y meter las pestañas adentro.
export default function CashierTabsLayout() {
  return (
    <CashierProvider>
      <CashierTabs />
    </CashierProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});