import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// 🔥 IMPORTAMOS LA BURBUJA Y EL CONTEXTO
import { DeliveryProvider, useDeliveryContext } from '../../features/delivery/components/context/DeliveryContext';
import { TRANSLATIONS, LanguageCode } from '../../locales/DeliveryTranslations';

// 🔥 1. COMPONENTE INTERNO QUE ESCUCHA EL IDIOMA Y MODO OSCURO
function DeliveryTabs() {
  const router = useRouter();
  const { language, isDark } = useDeliveryContext();

  const t = TRANSLATIONS[language as LanguageCode] || TRANSLATIONS['es'];

  // 🔥 COLORES DINÁMICOS PARA LA BARRA INFERIOR
  const tabBarBg = isDark ? '#1E293B' : '#FFFFFF';
  const tabBarBorder = isDark ? '#334155' : '#E2E8F0';
  const inactiveColor = isDark ? '#64748B' : '#94A3B8';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: tabBarBg, borderTopColor: tabBarBorder }],
        tabBarActiveTintColor: '#E61C24',
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: { paddingVertical: Platform.OS === 'ios' ? 0 : 5 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          // (Si no agregaste tabHome al diccionario, puedes omitir la 't.' y dejar el string por ahora)
          title: t.tabHome || 'Envíos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bicycle-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabProfile || 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabSettings || 'Ajustes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      
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

// 🔥 2. EL LAYOUT PRINCIPAL ENVUELVE LAS PESTAÑAS EN LA BURBUJA (PROVIDER)
export default function DeliveryTabsLayout() {
  return (
    <DeliveryProvider>
      <DeliveryTabs />
    </DeliveryProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 85 : 65, 
    paddingBottom: Platform.OS === 'ios' ? 25 : 8,
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