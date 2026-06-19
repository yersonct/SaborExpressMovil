import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, 
  TouchableOpacity, Modal, Image, Linking, Alert, ScrollView,
  LayoutAnimation, Platform, UIManager 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Habilitar animaciones fluidas en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- CONFIGURACIÓN DEL REPARTIDOR ACTUAL ---
const CURRENT_DRIVER_NAME = "Carlos Gómez";

interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  status: 'Pendiente' | 'Aceptado';
  restaurantStatus: 'Preparando' | 'Listo para recoger';
  subtotal: number;
  deliveryFee: number;
  paymentMethod: string;
  assignedDriver: string | null;
  items: OrderItem[]; 
}

const SAMPLE_PRODUCTS = ["Hamburguesa Sabor", "Pizza Express", "Papas Francesas", "Gaseosa 500ml", "Empanada de Carne", "Jugo Natural"];

const generateMockOrders = (startIndex: number, count: number): Order[] => {
  const newOrders: Order[] = [];
  for (let i = startIndex; i < startIndex + count; i++) {
    const isTakenByOther = Math.random() > 0.8; 
    
    const numItems = Math.floor(Math.random() * 4) + 1;
    const orderItems: OrderItem[] = [];
    for (let j = 0; j < numItems; j++) {
      orderItems.push({
        name: SAMPLE_PRODUCTS[Math.floor(Math.random() * SAMPLE_PRODUCTS.length)],
        quantity: Math.floor(Math.random() * 3) + 1
      });
    }
    
    newOrders.push({
      id: `ORD-${1000 + i}`,
      customerName: `Cliente ${i + 1}`,
      customerPhone: `+57 300 ${Math.floor(1000000 + Math.random() * 9000000)}`,
      address: `Calle Falsa ${123 + i}, Barrio Centro`,
      status: isTakenByOther ? 'Aceptado' : 'Pendiente',
      restaurantStatus: Math.random() > 0.5 ? 'Preparando' : 'Listo para recoger',
      subtotal: Math.floor(Math.random() * 30000) + 15000,
      deliveryFee: 4500,
      paymentMethod: 'Transferencia',
      assignedDriver: isTakenByOther ? 'Pedro Pérez' : null,
      items: orderItems,
    });
  }
  return newOrders;
};

export const DeliveryOrdersList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'disponibles' | 'mis_pedidos'>('disponibles');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [modalVisible, setModalVisible] = useState(false); 
  const [mapModalVisible, setMapModalVisible] = useState(false); 
  
  // NUEVO ESTADO: Controla si la tarjeta inferior del mapa está expandida o colapsada
  const [isSheetExpanded, setIsSheetExpanded] = useState(true);

  useEffect(() => {
    loadMoreOrders();
    setInitialLoading(false);
  }, []);

  const loadMoreOrders = () => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      const currentLength = orders.length;
      const newOrders = generateMockOrders(currentLength, 10);
      setOrders([...orders, ...newOrders]);
      setLoading(false);
    }, 1500);
  };

  const handleOpenModal = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const handleOpenMap = (order: Order) => {
    setSelectedOrder(order);
    setIsSheetExpanded(true); // Que siempre empiece abierta al abrir el mapa
    setMapModalVisible(true);
  };

  // Función para subir/bajar la tarjeta con animación
  const toggleSheet = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSheetExpanded(!isSheetExpanded);
  };

  const handleConfirmOrder = () => {
    if (selectedOrder) {
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === selectedOrder.id 
            ? { ...o, assignedDriver: CURRENT_DRIVER_NAME, status: 'Aceptado' } 
            : o
        )
      );
    }
    setModalVisible(false);
    setSelectedOrder(null);
    setActiveTab('mis_pedidos'); 
  };

  const handleFinishDelivery = () => {
    Alert.alert("¡Entrega Exitosa!", "Has completado este pedido.", [
      { 
        text: "Genial", 
        onPress: () => {
          setOrders(orders.filter(o => o.id !== selectedOrder?.id));
          setMapModalVisible(false);
          setSelectedOrder(null);
        }
      }
    ]);
  };

  const handleCallCustomer = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const displayedOrders = orders.filter(order => {
    if (activeTab === 'disponibles') {
      return order.assignedDriver !== CURRENT_DRIVER_NAME;
    } else {
      return order.assignedDriver === CURRENT_DRIVER_NAME;
    }
  });

  const renderOrderItem = ({ item }: { item: Order }) => {
    const isMine = item.assignedDriver === CURRENT_DRIVER_NAME;
    const isTakenByOther = item.assignedDriver !== null && !isMine;
    const totalItems = item.items.reduce((sum, current) => sum + current.quantity, 0);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>{item.id}</Text>
          <Text style={[
            styles.orderStatus, 
            isTakenByOther && styles.orderStatusTaken,
            isMine && styles.orderStatusMine
          ]}>
            {isMine ? 'Mi Viaje' : isTakenByOther ? 'No Disponible' : 'Nuevo Pedido'}
          </Text>
        </View>
        
        <Text style={styles.customerName}>🧑 {item.customerName}</Text>
        <Text style={styles.addressText}>📍 {item.address}</Text>
        <Text style={styles.itemsSummaryText}>🍔 {totalItems} artículos a entregar</Text>
        
        {isTakenByOther ? (
          <View style={[styles.acceptButton, styles.takenButton]}>
            <Text style={styles.takenButtonText}>🚫 Tomado por {item.assignedDriver}</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.acceptButton, isMine && styles.routeButton]}
            onPress={() => isMine ? handleOpenMap(item) : handleOpenModal(item)}
          >
            <Text style={styles.acceptButtonText}>
              {isMine ? '🗺️ Ver Ruta al Cliente' : '🛵 Ir por el pedido'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || activeTab === 'mis_pedidos') return null; 
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="large" color="#E61C24" />
        <Text style={styles.loadingText}>Buscando más pedidos...</Text>
      </View>
    );
  };

  if (initialLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#E61C24" /></View>;
  }

  return (
    <View style={styles.container}>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'disponibles' && styles.tabButtonActive]} onPress={() => setActiveTab('disponibles')}>
          <Text style={[styles.tabText, activeTab === 'disponibles' && styles.tabTextActive]}>Disponibles</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'mis_pedidos' && styles.tabButtonActive]} onPress={() => setActiveTab('mis_pedidos')}>
          <Text style={[styles.tabText, activeTab === 'mis_pedidos' && styles.tabTextActive]}>Mis Viajes</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayedOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        onEndReached={() => activeTab === 'disponibles' && loadMoreOrders()}
        onEndReachedThreshold={0.5} 
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bicycle-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              {activeTab === 'disponibles' ? 'No hay pedidos nuevos en este momento.' : 'Aún no has aceptado ningún viaje.'}
            </Text>
          </View>
        }
      />

      {/* 1. MODAL DE CONFIRMACIÓN */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Detalles del Viaje</Text>
                
                <View style={styles.statusBox}>
                  <Text style={styles.statusLabel}>Estado en local:</Text>
                  <Text style={[styles.statusValue, { color: selectedOrder.restaurantStatus === 'Preparando' ? '#F59E0B' : '#10B981' }]}>
                    {selectedOrder.restaurantStatus === 'Preparando' ? '🍳 Preparando...' : '✅ Listo para recoger'}
                  </Text>
                </View>

                <View style={styles.productsBox}>
                  <Text style={styles.productsTitle}>Productos a recoger:</Text>
                  {selectedOrder.items.map((prod, index) => (
                    <View key={index} style={styles.productRow}>
                      <Text style={styles.productQuantity}>{prod.quantity}x</Text>
                      <Text style={styles.productName}>{prod.name}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.receiptBox}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptText}>Costo del pedido:</Text>
                    <Text style={styles.receiptText}>${selectedOrder.subtotal.toLocaleString()}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptText}>Tarifa de entrega:</Text>
                    <Text style={styles.receiptBold}>+ ${selectedOrder.deliveryFee.toLocaleString()}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptTotal}>A cobrar al cliente:</Text>
                    <Text style={styles.receiptTotal}>${(selectedOrder.subtotal + selectedOrder.deliveryFee).toLocaleString()}</Text>
                  </View>
                  <View style={styles.paymentMethodBox}>
                    <Text style={styles.paymentLabel}>Método de pago:</Text>
                    <Text style={styles.paymentValue}>📱 {selectedOrder.paymentMethod}</Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmOrder}>
                    <Text style={styles.confirmButtonText}>Confirmar Viaje</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 2. MODAL DE MAPA Y RUTA CON BOTTOM SHEET COLAPSABLE */}
      <Modal animationType="slide" transparent={false} visible={mapModalVisible} onRequestClose={() => setMapModalVisible(false)}>
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => setMapModalVisible(false)}>
              <Ionicons name="chevron-down" size={28} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={styles.mapHeaderTitle}>En camino al cliente</Text>
          </View>

          {/* Imagen de Mapa de Fondo */}
          <Image 
            source={{ uri: 'https://miro.medium.com/v2/resize:fit:1400/1*qYUvh-dpTfwv3E_XGu4_aQ.png' }} 
            style={styles.fakeMapImage} 
            resizeMode="cover"
          />

          {/* BOTTOM SHEET ANIMADO */}
          <View style={styles.bottomSheet}>
            {/* 👆 Área táctil para expandir/colapsar */}
            <TouchableOpacity style={styles.dragHandleArea} onPress={toggleSheet} activeOpacity={0.8}>
              <View style={styles.bottomSheetHandle} />
              <Ionicons 
                name={isSheetExpanded ? "chevron-down" : "chevron-up"} 
                size={20} 
                color="#94A3B8" 
              />
              <Text style={styles.dragText}>
                {isSheetExpanded ? "Ocultar detalles" : "Ver detalles del pedido"}
              </Text>
            </TouchableOpacity>

            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <Text style={styles.deliverToText}>Entregar a:</Text>
                
                <View style={styles.customerInfoRow}>
                  <View style={styles.customerTextContainer}>
                    <Text style={styles.customerNameLarge}>{selectedOrder.customerName}</Text>
                    {/* Si está colapsado, acortamos la dirección. Si no, la mostramos completa */}
                    <Text style={styles.customerAddressLarge} numberOfLines={isSheetExpanded ? undefined : 1}>
                      {selectedOrder.address}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.callCircleButton} onPress={() => handleCallCustomer(selectedOrder.customerPhone)}>
                    <Ionicons name="call" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* 👇 Esta sección se oculta/muestra automáticamente */}
                {isSheetExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={styles.phoneBox}>
                      <Text style={styles.phoneText}>Tel: {selectedOrder.customerPhone}</Text>
                    </View>

                    <View style={styles.mapProductsBox}>
                      <Text style={styles.mapProductsTitle}>Verifica que entregas:</Text>
                      {selectedOrder.items.map((prod, index) => (
                        <Text key={index} style={styles.mapProductText}>• {prod.quantity}x {prod.name}</Text>
                      ))}
                    </View>

                    <TouchableOpacity style={styles.finishDeliveryButton} onPress={handleFinishDelivery}>
                      <Text style={styles.finishDeliveryText}>Marcar como Entregado</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  tabButtonActive: { backgroundColor: '#FFF0EE' },
  tabText: { fontSize: 15, fontWeight: 'bold', color: '#64748B' },
  tabTextActive: { color: '#E61C24' },

  listContainer: { padding: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#94A3B8', fontSize: 16, marginTop: 10, textAlign: 'center' },

  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  orderStatus: { fontSize: 12, fontWeight: 'bold', color: '#E61C24', backgroundColor: '#FFF0EE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  orderStatusTaken: { color: '#64748B', backgroundColor: '#F1F5F9' },
  orderStatusMine: { color: '#10B981', backgroundColor: '#ECFDF5' },
  
  customerName: { fontSize: 16, color: '#334155', marginBottom: 4, fontWeight: '600' },
  addressText: { fontSize: 14, color: '#64748B', marginBottom: 8 },
  itemsSummaryText: { fontSize: 13, color: '#F59E0B', fontWeight: 'bold', marginBottom: 16 },
  
  acceptButton: { backgroundColor: '#1A1A1A', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  routeButton: { backgroundColor: '#3B82F6' },
  takenButton: { backgroundColor: '#F1F5F9' },
  acceptButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  takenButtonText: { color: '#94A3B8', fontWeight: 'bold', fontSize: 14 },

  footerLoader: { paddingVertical: 20, alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748B', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 16, textAlign: 'center' },
  statusBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginBottom: 16 },
  statusLabel: { fontSize: 16, color: '#64748B', fontWeight: '500' },
  statusValue: { fontSize: 16, fontWeight: 'bold' },

  productsBox: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 16 },
  productsTitle: { fontSize: 14, fontWeight: 'bold', color: '#92400E', marginBottom: 8, textTransform: 'uppercase' },
  productRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  productQuantity: { fontSize: 15, fontWeight: 'bold', color: '#D97706', width: 30 },
  productName: { fontSize: 15, color: '#1E293B', flex: 1 },

  receiptBox: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, marginBottom: 24 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  receiptText: { fontSize: 15, color: '#475569' },
  receiptBold: { fontSize: 15, color: '#1E293B', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  receiptTotal: { fontSize: 18, fontWeight: 'bold', color: '#E61C24' },
  paymentMethodBox: { marginTop: 12, backgroundColor: '#EFF6FF', padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between' },
  paymentLabel: { fontSize: 14, color: '#1E3A8A' },
  paymentValue: { fontSize: 14, fontWeight: 'bold', color: '#1E3A8A' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center' },
  cancelButtonText: { color: '#475569', fontWeight: 'bold', fontSize: 16 },
  confirmButton: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#E61C24', alignItems: 'center' },
  confirmButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },

  mapContainer: { flex: 1, backgroundColor: '#E5E7EB' },
  mapHeader: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
  backButton: { backgroundColor: '#FFFFFF', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  mapHeaderTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginRight: 44, textShadowColor: '#FFF', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 2 },
  fakeMapImage: { flex: 1, width: '100%', height: '100%' },
  
  /* ESTILOS DEL BOTTOM SHEET ANIMADO */
  bottomSheet: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    backgroundColor: '#FFFFFF', 
    borderTopLeftRadius: 30, borderTopRightRadius: 30, 
    paddingHorizontal: 24, paddingBottom: 30, 
    shadowColor: '#000', shadowOffset: {width: 0, height: -4}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10, 
    maxHeight: '75%' 
  },
  dragHandleArea: { alignItems: 'center', paddingTop: 15, paddingBottom: 10 },
  bottomSheetHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, marginBottom: 5 },
  dragText: { fontSize: 10, color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 },
  
  deliverToText: { fontSize: 12, color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  customerInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  customerTextContainer: { flex: 1, paddingRight: 15 },
  customerNameLarge: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 2 },
  customerAddressLarge: { fontSize: 15, color: '#475569' },
  callCircleButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  
  expandedContent: { marginTop: 10, overflow: 'hidden' }, // Contenedor que se oculta
  phoneBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  phoneText: { fontSize: 16, color: '#334155', fontWeight: '500', textAlign: 'center' },

  mapProductsBox: { marginBottom: 24, paddingHorizontal: 5 },
  mapProductsTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748B', marginBottom: 8 },
  mapProductText: { fontSize: 15, color: '#1E293B', marginBottom: 4 },

  finishDeliveryButton: { backgroundColor: '#E61C24', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  finishDeliveryText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }
});