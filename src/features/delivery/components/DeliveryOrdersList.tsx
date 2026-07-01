import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutAnimation,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { CURRENT_DRIVER_NAME, generateMockOrders, Order } from './DeliveryData';
import { DeliveryModals } from './DeliveryModals';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const DeliveryOrdersList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'disponibles' | 'mis_pedidos'>('disponibles');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [modalVisible, setModalVisible] = useState(false); 
  const [mapModalVisible, setMapModalVisible] = useState(false); 
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
    setIsSheetExpanded(true);
    setMapModalVisible(true);
  };

  const toggleSheet = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSheetExpanded(!isSheetExpanded);
  };

  const handleConfirmOrder = () => {
    if (selectedOrder) {
      setOrders(prevOrders => prevOrders.map(o => o.id === selectedOrder.id ? { ...o, assignedDriver: CURRENT_DRIVER_NAME, status: 'Aceptado' } : o));
    }
    setModalVisible(false);
    setSelectedOrder(null);
    setActiveTab('mis_pedidos'); 
  };

  const handleMarkPaymentReceived = () => {
    if (!selectedOrder) return;

    setOrders(prevOrders => prevOrders.map(order => (
      order.id === selectedOrder.id
        ? { ...order, paymentStatus: 'Pagado' }
        : order
    )));

    setSelectedOrder(prev => prev ? { ...prev, paymentStatus: 'Pagado' } : prev);
  };

  const handleFinishDelivery = () => {
    Alert.alert("¡Entrega Exitosa!", "Has completado este pedido.", [
      { text: "Genial", onPress: () => {
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

  const displayedOrders = orders
    .filter(order => activeTab === 'disponibles' ? order.assignedDriver !== CURRENT_DRIVER_NAME : order.assignedDriver === CURRENT_DRIVER_NAME)
    .sort((left, right) => {
      if (activeTab !== 'mis_pedidos') return 0;

      const leftCashPending = left.paymentMethod === 'Efectivo' && left.paymentStatus === 'Pendiente';
      const rightCashPending = right.paymentMethod === 'Efectivo' && right.paymentStatus === 'Pendiente';

      if (leftCashPending === rightCashPending) return 0;
      return leftCashPending ? -1 : 1;
    });

  const renderOrderItem = ({ item }: { item: Order }) => {
    const isMine = item.assignedDriver === CURRENT_DRIVER_NAME;
    const isTakenByOther = item.assignedDriver !== null && !isMine;
    const totalItems = item.items.reduce((sum, current) => sum + current.quantity, 0);
    const isCashPayment = item.paymentMethod === 'Efectivo';
    const isPendingCashPayment = isCashPayment && item.paymentStatus === 'Pendiente';
    const paymentMethodLabel = item.paymentMethod;
    const paymentStatusLabel = isPendingCashPayment ? 'Por cobrar' : 'Pagado';

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>{item.id}</Text>
          <Text style={[styles.orderStatus, isTakenByOther && styles.orderStatusTaken, isMine && styles.orderStatusMine]}>
            {isMine ? 'Mi Viaje' : isTakenByOther ? 'No Disponible' : 'Nuevo Pedido'}
          </Text>
        </View>
        <Text style={styles.customerName}>🧑 {item.customerName}</Text>
        <Text style={styles.addressText}>📍 {item.address}</Text>
        <Text style={styles.itemsSummaryText}>🍔 {totalItems} artículos a entregar</Text>
        <View style={styles.paymentSummaryRow}>
          <View style={[styles.paymentBadge, isCashPayment ? styles.paymentBadgeCash : item.paymentMethod === 'Datáfono' ? styles.paymentBadgeCard : styles.paymentBadgeTransfer]}>
            <Text style={styles.paymentBadgeText}>{paymentMethodLabel}</Text>
          </View>
          <View style={[styles.paymentStatusBadge, isPendingCashPayment ? styles.paymentStatusBadgePending : styles.paymentStatusBadgePaid]}>
            <Text style={styles.paymentStatusBadgeText}>{paymentStatusLabel}</Text>
          </View>
        </View>
        {isMine && isPendingCashPayment && (
          <Text style={styles.cashCollectionNote}>💵 El repartidor cobra este pedido en efectivo al entregar.</Text>
        )}
        
        {isTakenByOther ? (
          <View style={[styles.acceptButton, styles.takenButton]}>
            <Text style={styles.takenButtonText}>🚫 Tomado por {item.assignedDriver}</Text>
          </View>
        ) : (
          <TouchableOpacity style={[styles.acceptButton, isMine && styles.routeButton]} onPress={() => isMine ? handleOpenMap(item) : handleOpenModal(item)}>
            <Text style={styles.acceptButtonText}>{isMine ? '🗺️ Ver Ruta al Cliente' : '🛵 Ir por el pedido'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (initialLoading) return <View style={styles.centered}><ActivityIndicator size="large" color="#E61C24" /></View>;

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

      {activeTab === 'mis_pedidos' && (
        <View style={styles.cashTripsBanner}>
          <Ionicons name="cash-outline" size={18} color="#B45309" />
          <Text style={styles.cashTripsBannerText}>
            Los viajes en efectivo aparecen aquí para que el repartidor vea la ruta y cobre al entregar.
          </Text>
        </View>
      )}

      <FlatList
        data={displayedOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        onEndReached={() => activeTab === 'disponibles' && loadMoreOrders()}
        onEndReachedThreshold={0.5} 
        ListFooterComponent={() => (!loading || activeTab === 'mis_pedidos') ? null : <View style={styles.footerLoader}><ActivityIndicator size="large" color="#E61C24" /><Text style={styles.loadingText}>Buscando más pedidos...</Text></View>}
        ListEmptyComponent={<View style={styles.emptyContainer}><Ionicons name="bicycle-outline" size={60} color="#CBD5E1" /><Text style={styles.emptyText}>{activeTab === 'disponibles' ? 'No hay pedidos nuevos en este momento.' : 'Aún no has aceptado ningún viaje.'}</Text></View>}
      />

      <DeliveryModals 
        modalVisible={modalVisible} setModalVisible={setModalVisible}
        mapModalVisible={mapModalVisible} setMapModalVisible={setMapModalVisible}
        selectedOrder={selectedOrder} handleConfirmOrder={handleConfirmOrder}
        isSheetExpanded={isSheetExpanded} toggleSheet={toggleSheet}
        handleCallCustomer={handleCallCustomer} handleFinishDelivery={handleFinishDelivery}
        handleMarkPaymentReceived={handleMarkPaymentReceived}
        styles={styles}
      />
    </View>
  );
};

// ... (Aquí van exactamente los mismos StyleSheet.create que tenías al final de tu código original, no los borres).
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  tabButtonActive: { backgroundColor: '#FFF0EE' },
  tabText: { fontSize: 15, fontWeight: 'bold', color: '#64748B' },
  tabTextActive: { color: '#E61C24' },
  cashTripsBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, padding: 12, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 12 },
  cashTripsBannerText: { flex: 1, fontSize: 13, color: '#92400E', fontWeight: '600', lineHeight: 18 },
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
  paymentSummaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  paymentBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  paymentBadgeCash: { backgroundColor: '#FEF3C7' },
  paymentBadgeCard: { backgroundColor: '#DBEAFE' },
  paymentBadgeTransfer: { backgroundColor: '#E0E7FF' },
  paymentBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#1E293B' },
  paymentStatusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  paymentStatusBadgePaid: { backgroundColor: '#DCFCE7' },
  paymentStatusBadgePending: { backgroundColor: '#FEE2E2' },
  paymentStatusBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#1E293B' },
  cashCollectionNote: { marginBottom: 12, fontSize: 13, color: '#B45309', fontWeight: '600' },
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
  paymentStateBox: { marginTop: 12, padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentStatePaid: { backgroundColor: '#ECFDF5' },
  paymentStatePending: { backgroundColor: '#FEF2F2' },
  paymentStateLabel: { fontSize: 14, fontWeight: '600', color: '#334155' },
  paymentStateValue: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  paymentHintBox: { marginTop: 10, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8 },
  paymentHintText: { fontSize: 13, color: '#475569', lineHeight: 18 },
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
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingBottom: 30, shadowColor: '#000', shadowOffset: {width: 0, height: -4}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10, maxHeight: '75%' },
  dragHandleArea: { alignItems: 'center', paddingTop: 15, paddingBottom: 10 },
  bottomSheetHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, marginBottom: 5 },
  dragText: { fontSize: 10, color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 },
  deliverToText: { fontSize: 12, color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  customerInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  customerTextContainer: { flex: 1, paddingRight: 15 },
  customerNameLarge: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 2 },
  customerAddressLarge: { fontSize: 15, color: '#475569' },
  callCircleButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  expandedContent: { marginTop: 10, overflow: 'hidden' },
  phoneBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  phoneText: { fontSize: 16, color: '#334155', fontWeight: '500', textAlign: 'center' },
  mapProductsBox: { marginBottom: 24, paddingHorizontal: 5 },
  mapProductsTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748B', marginBottom: 8 },
  mapProductText: { fontSize: 15, color: '#1E293B', marginBottom: 4 },
  paymentReceivedButton: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 14 },
  paymentReceivedText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  finishDeliveryButton: { backgroundColor: '#E61C24', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  finishDeliveryText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }
});