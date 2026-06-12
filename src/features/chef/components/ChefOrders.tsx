import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  SafeAreaView,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router'; 
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
}

interface Order {
  id: string;
  tableName: string;
  items: OrderItem[];
  time: string;
  timestamp: number; 
  status: 'PENDIENTE' | 'PREPARANDO';
}

const MOCK_ORDERS: Order[] = [
  { 
    id: 'TKT-102', 
    tableName: 'Mesa 4', 
    time: '12:35 PM', 
    timestamp: 1718109300000, 
    status: 'PENDIENTE',
    items: [
      { id: 'i1', name: 'Pizza Familiar Express', quantity: 1, notes: 'Masa delgada' },
      { id: 'i2', name: 'Gaseosa 500ml', quantity: 2 }
    ]
  },
  { 
    id: 'TKT-101', 
    tableName: 'Mesa 1', 
    time: '12:30 PM', 
    timestamp: 1718109000000, 
    status: 'PREPARANDO',
    items: [
      { id: 'i3', name: 'Hamburguesa Sabor', quantity: 2, notes: '1 sin cebolla, extra queso' },
      { id: 'i4', name: 'Papas Francesas', quantity: 1 }
    ]
  },
  { 
    id: 'TKT-103', 
    tableName: 'Para Llevar #1', 
    time: '12:40 PM', 
    timestamp: 1718109600000, 
    status: 'PENDIENTE',
    items: [
      { id: 'i5', name: 'Jugo Natural (Mango)', quantity: 3 }
    ]
  },
];

export const ChefOrders = () => {
  const navigation = useNavigation();

  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => a.timestamp - b.timestamp);
  }, [orders]);

  const handleOpenModal = (order: Order) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedOrder(null);
  };

  const handleStartPreparing = () => {
    if (selectedOrder) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      const updatedOrders = orders.map(order => 
        order.id === selectedOrder.id ? { ...order, status: 'PREPARANDO' as const } : order
      );
      setOrders(updatedOrders);
      setSelectedOrder({ ...selectedOrder, status: 'PREPARANDO' });
    }
  };

  const handleMarkAsReady = () => {
    if (selectedOrder) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      const updatedOrders = orders.filter(order => order.id !== selectedOrder.id);
      setOrders(updatedOrders);
      handleCloseModal();
    }
  };

  const handleSimulateNewOrder = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    
    const randomId = Math.floor(Math.random() * 1000) + 200;
    const newOrder: Order = {
      id: `TKT-${randomId}`,
      tableName: `Mesa ${Math.floor(Math.random() * 10) + 1}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(), 
      status: 'PENDIENTE',
      items: [
        { id: `i${randomId}`, name: 'Alitas BBQ (6 und)', quantity: 1 },
        { id: `i${randomId+1}`, name: 'Cerveza Artesanal', quantity: 2 }
      ]
    };
    
    setOrders([...orders, newOrder]);
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.topBar}>
        {/* BOTÓN DE MENÚ HAMBURGUESA */}
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={28} color="#1E293B" />
        </TouchableOpacity>

        {/* BOTÓN SIMULAR PEDIDO */}
        <TouchableOpacity style={styles.simulateButton} onPress={handleSimulateNewOrder}>
          <Text style={styles.simulateText}>+ Simular Pedido</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Cocina - saborExpress</Text>
          <Text style={styles.subtitle}>Tickets pendientes por orden de llegada</Text>
        </View>

        <FlatList
          data={sortedOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const isPreparing = item.status === 'PREPARANDO';
            return (
              <TouchableOpacity 
                style={[styles.ticketCard, isPreparing && styles.ticketCardPreparing]} 
                onPress={() => handleOpenModal(item)}
                activeOpacity={0.8}
              >
                <View style={styles.ticketHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.ticketId}>{item.id}</Text>
                    <View style={[styles.statusBadge, isPreparing ? styles.badgePreparing : styles.badgePending]}>
                      <Text style={[styles.statusText, isPreparing ? styles.textPreparing : styles.textPending]}>
                        {isPreparing ? '👨‍🍳 Preparando' : '⏳ Pendiente'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.ticketTime}>{item.time}</Text>
                </View>
                <Text style={styles.tableNameText}>{item.tableName}</Text>
                
                <Text style={styles.itemsSummary}>
                  {item.items.length} {item.items.length === 1 ? 'producto' : 'productos'} en este ticket
                </Text>
                <Text style={styles.tapToView}>👆 Tocar para ver detalles y gestionar</Text>
              </TouchableOpacity>
            )
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>¡Excelente trabajo!</Text>
              <Text style={styles.emptySubText}>No hay tickets pendientes.</Text>
            </View>
          }
        />

        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detalles del Ticket</Text>
                <TouchableOpacity onPress={handleCloseModal} style={styles.closeIcon}>
                  <Text style={styles.closeIconText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalMeta}>
                <Text style={styles.modalTicketId}>{selectedOrder?.id}</Text>
                <Text style={styles.modalTableName}>{selectedOrder?.tableName}</Text>
                <Text style={styles.modalTime}>Hora: {selectedOrder?.time}</Text>
              </View>
              
              <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
                <Text style={styles.detailLabel}>Productos a preparar:</Text>
                
                {selectedOrder?.items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemMain}>
                      <Text style={styles.itemQty}>{item.quantity}x</Text>
                      <Text style={styles.itemName}>{item.name}</Text>
                    </View>
                    {item.notes && (
                      <Text style={styles.itemNotes}>⚠️ {item.notes}</Text>
                    )}
                  </View>
                ))}
              </ScrollView>

              <View style={styles.modalButtonsContainer}>
                {selectedOrder?.status === 'PENDIENTE' ? (
                  <TouchableOpacity style={styles.startPrepButton} onPress={handleStartPreparing}>
                    <Text style={styles.startPrepText}>👨‍🍳 Empezar a Preparar</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.prepIndicatorText}>El equipo ya está preparando esto...</Text>
                )}
                
                <TouchableOpacity style={styles.readyButton} onPress={handleMarkAsReady}>
                  <Text style={styles.readyButtonText}>✅ ¡Todo Listo!</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  menuButton: { padding: 5 },
  simulateButton: { backgroundColor: '#10B981', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8 },
  simulateText: { color: '#FFF', fontWeight: 'bold' },
  
  container: { flex: 1 },
  header: { padding: 24, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 15, color: '#64748B', marginTop: 4 },
  
  listContainer: { padding: 16 },
  ticketCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 6, borderLeftColor: '#F59E0B', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  ticketCardPreparing: { borderLeftColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ticketId: { fontSize: 16, fontWeight: '900', color: '#0F172A', marginRight: 10 },
  ticketTime: { fontSize: 14, color: '#64748B', fontWeight: 'bold' },
  
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgePreparing: { backgroundColor: '#DBEAFE' },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  textPending: { color: '#B45309' },
  textPreparing: { color: '#1D4ED8' },
  
  tableNameText: { fontSize: 18, color: '#1E293B', fontWeight: 'bold', marginBottom: 8 },
  itemsSummary: { fontSize: 14, color: '#64748B', marginBottom: 12 },
  tapToView: { fontSize: 13, color: '#E61C24', fontWeight: '700' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#10B981', marginBottom: 5 },
  emptySubText: { fontSize: 15, color: '#64748B' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxHeight: '85%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#0F172A' },
  closeIcon: { padding: 5, backgroundColor: '#F1F5F9', borderRadius: 20, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeIconText: { fontSize: 16, color: '#64748B', fontWeight: 'bold' },
  
  modalMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 15, marginBottom: 15 },
  modalTicketId: { fontSize: 16, color: '#E61C24', fontWeight: '900' },
  modalTableName: { fontSize: 16, color: '#1E293B', fontWeight: 'bold' },
  modalTime: { fontSize: 14, color: '#64748B' },
  
  detailsContainer: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginBottom: 20 },
  detailLabel: { fontSize: 13, color: '#64748B', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 12 },
  
  itemRow: { borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 10, marginBottom: 10 },
  itemMain: { flexDirection: 'row', alignItems: 'flex-start' },
  itemQty: { fontSize: 16, fontWeight: '900', color: '#E61C24', width: 30 },
  itemName: { fontSize: 16, color: '#0F172A', fontWeight: '600', flex: 1 },
  itemNotes: { fontSize: 14, color: '#D97706', fontWeight: '600', fontStyle: 'italic', marginLeft: 30, marginTop: 4 },
  
  modalButtonsContainer: { marginTop: 10 },
  startPrepButton: { backgroundColor: '#F59E0B', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  startPrepText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  prepIndicatorText: { textAlign: 'center', color: '#3B82F6', fontWeight: 'bold', marginBottom: 15, fontStyle: 'italic' },
  
  readyButton: { backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 10, alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  readyButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 18 },
});