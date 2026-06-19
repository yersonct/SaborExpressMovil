import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView
} from 'react-native';
import { useNavigation } from 'expo-router'; 
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Habilitar animaciones en Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  category: 'COCINA' | 'SOLO_PASAR';
}

interface Order {
  id: string;
  tableName: string;
  waiterName: string; 
  time: string; // Hora en que el mesero tomó el pedido
  startTime?: string; // 🔥 NUEVO: Hora en que cocina empezó a prepararlo
  endTime?: string;   // ✅ NUEVO: Hora en que cocina lo terminó
  timestamp: number; 
  status: 'PENDIENTE' | 'PREPARANDO' | 'LISTO'; 
  items: OrderItem[];
}

const MOCK_ORDERS: Order[] = [
  { 
    id: 'TKT-102', 
    tableName: 'Mesa 4', 
    waiterName: 'Juan Pérez',
    time: '12:35 PM', 
    timestamp: 1718109300000, 
    status: 'PENDIENTE',
    // No tiene startTime ni endTime porque apenas entró
    items: [
      { id: 'i1', name: 'Pizza Familiar Express', quantity: 1, notes: 'Masa delgada', category: 'COCINA' },
      { id: 'i2', name: 'Gaseosa Coca-Cola 2L', quantity: 1, category: 'SOLO_PASAR' } 
    ]
  },
  { 
    id: 'TKT-101', 
    tableName: 'Mesa 1', 
    waiterName: 'María Gómez',
    time: '12:30 PM', 
    startTime: '12:32 PM', // Ya lo empezaron
    timestamp: 1718109000000, 
    status: 'PREPARANDO',
    items: [
      { id: 'i3', name: 'Hamburguesa Sabor', quantity: 2, notes: '1 sin cebolla, extra queso', category: 'COCINA' },
      { id: 'i4', name: 'Papas Francesas', quantity: 1, category: 'COCINA' },
      { id: 'i4b', name: 'Limonada de Coco', quantity: 2, category: 'SOLO_PASAR' }
    ]
  },
  { 
    id: 'TKT-099', 
    tableName: 'Mesa 7', 
    waiterName: 'Carlos Ruiz',
    time: '12:10 PM', 
    startTime: '12:12 PM',
    endTime: '12:25 PM', // Ya lo terminaron
    timestamp: 1718108000000, 
    status: 'LISTO',
    items: [
      { id: 'i5', name: 'Alitas BBQ (12 und)', quantity: 1, category: 'COCINA' },
      { id: 'i6', name: 'Cerveza Club Colombia', quantity: 3, category: 'SOLO_PASAR' }
    ]
  },
];

export const ChefOrders = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [activeTab, setActiveTab] = useState<'EN_PROCESO' | 'LISTOS'>('EN_PROCESO');

  const displayedOrders = useMemo(() => {
    return orders
      .filter(order => {
        if (activeTab === 'EN_PROCESO') {
          return order.status === 'PENDIENTE' || order.status === 'PREPARANDO';
        } else {
          return order.status === 'LISTO';
        }
      })
      .sort((a, b) => {
        return activeTab === 'EN_PROCESO' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
      });
  }, [orders, activeTab]);

  // 🔥 NUEVA LÓGICA DE TIEMPOS AL PRESIONAR EL BOTÓN
  const handleNextStatus = (orderId: string, currentStatus: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // Obtenemos la hora exacta del momento en que presionan el botón
    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (currentStatus === 'PENDIENTE') {
      // Pasa a Preparando y guarda la Hora de Inicio
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'PREPARANDO', startTime: currentTimeStr } : o));
    } else if (currentStatus === 'PREPARANDO') {
      // Pasa a Listo y guarda la Hora de Fin
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'LISTO', endTime: currentTimeStr } : o));
    }
  };

  const handleSimulateNewOrder = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    const randomId = Math.floor(Math.random() * 1000) + 200;
    
    const newOrder: Order = {
      id: `TKT-${randomId}`,
      tableName: `Mesa ${Math.floor(Math.random() * 10) + 1}`,
      waiterName: Math.random() > 0.5 ? 'Juan Pérez' : 'María Gómez',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(), 
      status: 'PENDIENTE',
      items: [
        { id: `i${randomId}_1`, name: 'Carne Asada (300g)', quantity: 2, notes: 'Término medio', category: 'COCINA' },
        { id: `i${randomId}_2`, name: 'Pechuga a la Plancha', quantity: 1, category: 'COCINA' },
        { id: `i${randomId}_3`, name: 'Sopa de la Casa', quantity: 3, category: 'COCINA' },
        { id: `i${randomId}_4`, name: 'Ensalada Mixta', quantity: 1, notes: 'Sin vinagreta', category: 'COCINA' },
        { id: `i${randomId}_5`, name: 'Porción de Papas', quantity: 2, category: 'COCINA' },
        { id: `i${randomId}_6`, name: 'Gaseosa Manzana', quantity: 4, category: 'SOLO_PASAR' },
        { id: `i${randomId}_7`, name: 'Jugo de Mora', quantity: 2, category: 'SOLO_PASAR' },
      ]
    };
    setOrders([...orders, newOrder]);
    setActiveTab('EN_PROCESO'); 
  };

  const renderTicket = ({ item }: { item: Order }) => {
    const isPreparing = item.status === 'PREPARANDO';
    const isReady = item.status === 'LISTO';

    return (
      <View style={[
        styles.ticketCard, 
        isPreparing && styles.ticketCardPreparing,
        isReady && styles.ticketCardReady
      ]}>
        
        <View style={[
          styles.ticketHeader, 
          isPreparing ? styles.headerPreparing : isReady ? styles.headerReady : styles.headerPending
        ]}>
          <View>
            <Text style={[styles.ticketId, (isPreparing || isReady) && styles.textWhite]}>{item.id}</Text>
            <Text style={[styles.tableNameText, (isPreparing || isReady) && styles.textWhite]}>{item.tableName}</Text>
          </View>
        </View>

        <View style={styles.waiterInfoBar}>
          <Ionicons name="person-circle-outline" size={18} color="#475569" />
          <Text style={styles.waiterInfoText}>Mesero: <Text style={{fontWeight: 'bold'}}>{item.waiterName}</Text></Text>
        </View>

        {/* 🔥 BARRA DE TIEMPOS (NUEVO) */}
        <View style={styles.timesBar}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Recibido</Text>
            <Text style={styles.timeValue}>{item.time}</Text>
          </View>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Iniciado</Text>
            <Text style={[styles.timeValue, !item.startTime && styles.timePending]}>
              {item.startTime || '--:--'}
            </Text>
          </View>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Terminado</Text>
            <Text style={[styles.timeValue, !item.endTime && styles.timePending]}>
              {item.endTime || '--:--'}
            </Text>
          </View>
        </View>

        <ScrollView 
          style={styles.itemsContainer} 
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true} 
        >
          {item.items.map((prod) => (
            <View key={prod.id} style={styles.itemRow}>
              <Text style={[styles.itemQty, isReady && { color: '#64748B' }]}>{prod.quantity}</Text>
              <View style={styles.itemDetails}>
                <Text style={[styles.itemName, isReady && { color: '#64748B', textDecorationLine: 'line-through' }]}>
                  {prod.name}
                </Text>
                
                {prod.category === 'COCINA' ? (
                  <View style={styles.badgeCocina}>
                    <Text style={styles.badgeCocinaText}>🔥 Preparar en Cocina</Text>
                  </View>
                ) : (
                  <View style={styles.badgeBarra}>
                    <Text style={styles.badgeBarraText}>🥤 Solo Pasar (Nevera/Barra)</Text>
                  </View>
                )}

                {prod.notes && <Text style={styles.itemNotes}>⚠️ {prod.notes}</Text>}
              </View>
            </View>
          ))}
        </ScrollView>

        {!isReady && (
          <TouchableOpacity 
            style={[styles.actionButton, isPreparing ? styles.btnReady : styles.btnStart]}
            onPress={() => handleNextStatus(item.id, item.status)}
          >
            <Text style={styles.actionButtonText}>
              {isPreparing ? '✅ MARCAR COMO LISTO' : '👨‍🍳 EMPEZAR PREPARACIÓN'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Ionicons name="menu" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>KDS - Cocina</Text>
        <TouchableOpacity style={styles.simulateButton} onPress={handleSimulateNewOrder}>
          <Text style={styles.simulateText}>+ Pedido Masivo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'EN_PROCESO' && styles.activeTab]} onPress={() => setActiveTab('EN_PROCESO')}>
          <Text style={[styles.tabText, activeTab === 'EN_PROCESO' && styles.activeTabText]}>
            🔥 En Proceso ({orders.filter(o => o.status !== 'LISTO').length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.tab, activeTab === 'LISTOS' && styles.activeTab]} onPress={() => setActiveTab('LISTOS')}>
          <Text style={[styles.tabText, activeTab === 'LISTOS' && styles.activeTabText]}>
            ✅ Listos / Historial
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <FlatList
          data={displayedOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          horizontal={true} 
          showsHorizontalScrollIndicator={true} 
          renderItem={renderTicket}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name={activeTab === 'EN_PROCESO' ? "checkmark-done-circle" : "receipt-outline"} size={80} color="#CBD5E1" />
              <Text style={styles.emptyText}>
                {activeTab === 'EN_PROCESO' ? 'Cocina al Día' : 'Sin historial'}
              </Text>
              <Text style={styles.emptySubText}>
                {activeTab === 'EN_PROCESO' ? 'No hay preparaciones pendientes.' : 'No has terminado pedidos aún.'}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#E2E8F0' }, 
  topBar: { padding: 15, paddingTop: Platform.OS === 'android' ? 40 : 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF' },
  menuButton: { padding: 5 },
  topBarTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', textTransform: 'uppercase' },
  simulateButton: { backgroundColor: '#1E293B', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8 },
  simulateText: { color: '#FFF', fontWeight: 'bold' },
  
  tabsContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#CBD5E1' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#E61C24' },
  tabText: { fontSize: 16, fontWeight: 'bold', color: '#64748B' },
  activeTabText: { color: '#E61C24' },

  container: { flex: 1 },
  listContainer: { padding: 16, gap: 16 },
  
  ticketCard: { 
    width: 340, 
    maxHeight: '100%', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    overflow: 'hidden', 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8 
  },
  ticketCardPreparing: { borderWidth: 2, borderColor: '#3B82F6' },
  ticketCardReady: { opacity: 0.8 }, 
  
  ticketHeader: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerPending: { backgroundColor: '#FEF3C7' }, 
  headerPreparing: { backgroundColor: '#3B82F6' }, 
  headerReady: { backgroundColor: '#10B981' }, 
  
  ticketId: { fontSize: 16, fontWeight: 'bold', color: '#92400E' },
  tableNameText: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginTop: 4 },
  textWhite: { color: '#FFFFFF' },

  waiterInfoBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  waiterInfoText: { fontSize: 14, color: '#475569', marginLeft: 6 },

  // 🔥 NUEVOS ESTILOS PARA LA BARRA DE TIEMPOS
  timesBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 8 },
  timeBlock: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#F1F5F9' },
  timeLabel: { fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 },
  timeValue: { fontSize: 14, color: '#0F172A', fontWeight: '900' },
  timePending: { color: '#CBD5E1' }, // Color gris para los tiempos que aún no suceden

  itemsContainer: { padding: 16, flex: 1 }, 
  itemRow: { flexDirection: 'row', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 10 },
  itemQty: { fontSize: 22, fontWeight: '900', color: '#E61C24', width: 40 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 18, color: '#0F172A', fontWeight: 'bold' },
  itemNotes: { fontSize: 15, color: '#D97706', fontWeight: 'bold', marginTop: 4, backgroundColor: '#FFFBEB', padding: 4, borderRadius: 4 },

  badgeCocina: { backgroundColor: '#FEE2E2', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginTop: 4 },
  badgeCocinaText: { color: '#B91C1C', fontSize: 11, fontWeight: 'bold' },
  badgeBarra: { backgroundColor: '#E0F2FE', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginTop: 4 },
  badgeBarraText: { color: '#0369A1', fontSize: 11, fontWeight: 'bold' },

  actionButton: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  btnStart: { backgroundColor: '#F59E0B' }, 
  btnReady: { backgroundColor: '#10B981' }, 
  actionButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', width: 400, marginLeft: 50 },
  emptyText: { fontSize: 28, fontWeight: 'bold', color: '#64748B', marginTop: 10 },
  emptySubText: { fontSize: 18, color: '#94A3B8', marginTop: 5 },
});