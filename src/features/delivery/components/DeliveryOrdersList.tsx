import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, LayoutAnimation, Linking, Platform, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { CURRENT_DRIVER_NAME, generateMockOrders, Order } from './DeliveryData';
import { DeliveryModals } from './DeliveryModals';
import { useDeliveryContext } from './context/DeliveryContext';
import { TRANSLATIONS, LanguageCode } from '../../../locales/DeliveryTranslations';
// 🔥 IMPORTAMOS LOS ESTILOS DESDE EL NUEVO ARCHIVO
import { styles } from './style/DeliveryOrdersListStyles'; 

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const DeliveryOrdersList = () => {
  const { language, isDark } = useDeliveryContext();
  const t = TRANSLATIONS[language as LanguageCode] || TRANSLATIONS['es'];

  const colors = isDark ? {
    background: '#0F172A', card: '#1E293B', text: '#F8FAFC',
    muted: '#94A3B8', border: '#334155', accent: '#E61C24',
    tabActive: '#F8FAFC', tabInactive: '#64748B', tabBg: '#1E293B',
    btnPrimary: '#E61C24', btnPrimaryText: '#FFFFFF',
    btnDisabledBg: '#334155', btnDisabledText: '#94A3B8',
    badgeSuccessBg: '#064E3B', badgeSuccessText: '#34D399',
    badgeWarningBg: '#78350F', badgeWarningText: '#FBBF24',
    badgeInfoBg: '#1E3A8A', badgeInfoText: '#93C5FD',
    badgeDangerBg: '#7F1D1D', badgeDangerText: '#FCA5A5'
  } : {
    background: '#F8FAFC', card: '#FFFFFF', text: '#1E293B',
    muted: '#64748B', border: '#E2E8F0', accent: '#E61C24',
    tabActive: '#E61C24', tabInactive: '#64748B', tabBg: '#FFFFFF',
    btnPrimary: '#1A1A1A', btnPrimaryText: '#FFFFFF',
    btnDisabledBg: '#F1F5F9', btnDisabledText: '#94A3B8',
    badgeSuccessBg: '#ECFDF5', badgeSuccessText: '#10B981',
    badgeWarningBg: '#FEF3C7', badgeWarningText: '#D97706',
    badgeInfoBg: '#DBEAFE', badgeInfoText: '#2563EB',
    badgeDangerBg: '#FEE2E2', badgeDangerText: '#DC2626'
  };

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
      order.id === selectedOrder.id ? { ...order, paymentStatus: 'Pagado' } : order
    )));
    setSelectedOrder(prev => prev ? { ...prev, paymentStatus: 'Pagado' } : prev);
  };

  const handleFinishDelivery = () => {
    Alert.alert(t.successDeliveryTitle || '¡Entrega Exitosa!', t.successDeliveryMsg || 'Has completado este pedido.', [
      { text: t.greatBtn || 'Genial', onPress: () => {
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

  const renderOrderItem = ({ item }: { item: Order }) => {
    const isMine = item.assignedDriver === CURRENT_DRIVER_NAME;
    const isTakenByOther = item.assignedDriver !== null && !isMine;
    const totalItems = item.items.reduce((sum, current) => sum + current.quantity, 0);
    
    const isCashPayment = item.paymentMethod === 'Efectivo';
    const isPendingCashPayment = isCashPayment && item.paymentStatus === 'Pendiente';

    // 🔥 TRADUCCIÓN
    const translatedMethod = item.paymentMethod === 'Efectivo' ? (t.payCash || 'Efectivo') : 
                             item.paymentMethod === 'Datáfono' ? (t.payCard || 'Datáfono') : 
                             (t.payTransfer || 'Transferencia');

    const badgeStatusBg = isMine ? colors.badgeSuccessBg : isTakenByOther ? colors.btnDisabledBg : colors.badgeDangerBg;
    const badgeStatusText = isMine ? colors.badgeSuccessText : isTakenByOther ? colors.muted : colors.accent;
    const badgePayMethodBg = isCashPayment ? colors.badgeWarningBg : item.paymentMethod === 'Datáfono' ? colors.badgeInfoBg : colors.badgeSuccessBg;
    const badgePayMethodText = isCashPayment ? colors.badgeWarningText : item.paymentMethod === 'Datáfono' ? colors.badgeInfoText : colors.badgeSuccessText;
    const badgePayStatusBg = isPendingCashPayment ? colors.badgeDangerBg : colors.badgeSuccessBg;
    const badgePayStatusText = isPendingCashPayment ? colors.badgeDangerText : colors.badgeSuccessText;

    return (
      <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.orderHeader}>
          <Text style={[styles.orderId, { color: colors.text }]}>{item.id}</Text>
          <View style={[styles.orderStatus, { backgroundColor: badgeStatusBg }]}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: badgeStatusText }}>
              {isMine ? (t.myTrip || 'Mi Viaje') : isTakenByOther ? (t.notAvailable || 'No Disponible') : (t.newOrder || 'Nuevo Pedido')}
            </Text>
          </View>
        </View>

        <Text style={[styles.customerName, { color: colors.text }]}>🧑 {item.customerName}</Text>
        <Text style={[styles.addressText, { color: colors.muted }]}>📍 {item.address}</Text>
        <Text style={[styles.itemsSummaryText, { color: colors.accent }]}>🍔 {totalItems} {t.itemsToDeliver || 'artículos'}</Text>
        
        <View style={styles.paymentSummaryRow}>
          <View style={[styles.paymentBadge, { backgroundColor: badgePayMethodBg }]}>
            <Text style={[styles.paymentBadgeText, { color: badgePayMethodText }]}>{translatedMethod}</Text>
          </View>
          <View style={[styles.paymentBadge, { backgroundColor: badgePayStatusBg }]}>
            <Text style={[styles.paymentBadgeText, { color: badgePayStatusText }]}>
              {isPendingCashPayment ? (t.toCollect || 'Por cobrar') : (t.paid || 'Pagado')}
            </Text>
          </View>
        </View>

        {isMine && isPendingCashPayment && (
          <Text style={{ color: colors.badgeWarningText, marginBottom: 12, fontWeight: '600' }}>{t.cashNote || 'Cobro en efectivo'}</Text>
        )}
        
        <TouchableOpacity 
          style={[styles.acceptButton, isTakenByOther ? { backgroundColor: colors.btnDisabledBg } : isMine ? { backgroundColor: '#3B82F6' } : { backgroundColor: colors.btnPrimary }]} 
          onPress={() => isMine ? handleOpenMap(item) : handleOpenModal(item)}
          disabled={isTakenByOther}
        >
          <Text style={[styles.acceptButtonText, isTakenByOther ? { color: colors.btnDisabledText } : { color: '#FFFFFF' }]}>
            {isTakenByOther ? `${t.takenBy || 'Tomado por'} ${item.assignedDriver}` : isMine ? (t.viewRoute || 'Ver Ruta') : (t.goForOrder || 'Ir por el pedido')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (initialLoading) return <View style={styles.centered}><ActivityIndicator size="large" color={colors.accent} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabContainer, { backgroundColor: colors.tabBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'disponibles' && { backgroundColor: isDark ? '#334155' : '#FFF0EE' }]} onPress={() => setActiveTab('disponibles')}>
          <Text style={[styles.tabText, activeTab === 'disponibles' ? { color: colors.tabActive } : { color: colors.tabInactive }]}>{t.tabAvailable || 'Disponibles'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'mis_pedidos' && { backgroundColor: isDark ? '#334155' : '#FFF0EE' }]} onPress={() => setActiveTab('mis_pedidos')}>
          <Text style={[styles.tabText, activeTab === 'mis_pedidos' ? { color: colors.tabActive } : { color: colors.tabInactive }]}>{t.tabMyTrips || 'Mis Viajes'}</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'mis_pedidos' && (
        <View style={[styles.cashTripsBanner, { backgroundColor: colors.badgeWarningBg, borderColor: colors.border }]}>
          <Ionicons name="cash-outline" size={18} color={colors.badgeWarningText} />
          <Text style={[styles.cashTripsBannerText, { color: colors.badgeWarningText }]}>{t.cashBanner || 'Viajes en efectivo aquí'}</Text>
        </View>
      )}

      <FlatList
        data={orders.filter(order => activeTab === 'disponibles' ? order.assignedDriver !== CURRENT_DRIVER_NAME : order.assignedDriver === CURRENT_DRIVER_NAME)}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<View style={styles.emptyContainer}>
            <Ionicons name="bicycle-outline" size={60} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>{activeTab === 'disponibles' ? (t.noNewOrders || 'No hay pedidos') : (t.noAcceptedTrips || 'No tienes viajes')}</Text>
        </View>}
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