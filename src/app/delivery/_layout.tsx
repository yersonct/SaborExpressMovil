import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function DeliveryTabsLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#E61C24',   
                headerShown: false,
                tabBarLabelStyle: { fontSize: 10 },
                tabBarStyle: { height: 60 },
            }}
        >
            <Tabs.Screen name="index" options={{ title: 'Envíos', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🛵</Text> }} />
            <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }} />
            <Tabs.Screen name="settings" options={{ title: 'Ajustes', tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚙️</Text> }} />
        </Tabs>
    );
}