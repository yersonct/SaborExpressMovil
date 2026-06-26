import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, Image, LayoutAnimation, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './style/CashierStyles';
import { Order, MENU_ITEMS } from './CashierData';

export const OrdersFeature = ({ orders, setOrders, setPaidHistory, showToast, filterType, setActiveTab }: any) => {
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cashierPaymentMethod, setCashierPaymentMethod] = useState<'efectivo' | 'transferencia' | ''>('');
  const [catalogModalVisible, setCatalogModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMenu = useMemo(() => {
    return MENU_ITEMS.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const openPaymentModal = (order: Order) => {
    setSelectedOrder(order);
    setCashierPaymentMethod(order.status === 'pagando_transferencia' ? 'transferencia' : '');
    setOrderModalVisible(true);
  };

  const handleValidateTransfer = (isApproved: boolean) => {
    if (!selectedOrder) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (isApproved) {
      setOrders((prev: Order[]) => prev.filter(o => o.id !== selectedOrder.id));
      setPaidHistory((prev: Order[]) => [...prev, { ...selectedOrder, status: 'pagado', paymentMethod: 'transferencia' }]);
      showToast(`✅ Transferencia de ${selectedOrder.id} validada.`);
    } else {
      setOrders((prev: Order[]) => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'pendiente' } : o));
      showToast(`❌ Comprobante rechazado. Pasa a pendientes.`);
      setActiveTab('pedidos');
    }
    setOrderModalVisible(false);
    setSelectedOrder(null);
  };

  const handleSelectMenuItem = (item: typeof MENU_ITEMS[0]) => {
    if (selectedOrder) {
      const updatedOrder = { ...selectedOrder, items: selectedOrder.items + `\n1x ${item.name} (Extra Caja)`, total: selectedOrder.total + item.price };
      setSelectedOrder(updatedOrder);
      setOrders((prev: Order[]) => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      setCatalogModalVisible(false);
      setSearchQuery('');
      showToast(`✅ ${item.name} agregado a la cuenta`);
    }
  };

  const confirmOrderPayment = () => {
    if (!cashierPaymentMethod) return Alert.alert("Falta el Método de Pago", "Por favor selecciona un método.");
    if (cashierPaymentMethod === 'transferencia' && selectedOrder?.status !== 'pagando_transferencia') {
      Alert.alert("Verificación de Transferencia", "¿Confirmas que el dinero ingresó a Nequi/Banco?", [
        { text: "No, revisar", style: "cancel" },
        { text: "Sí, confirmado", onPress: () => processPaymentAndCloseMesa() }
      ]);
    } else {
      processPaymentAndCloseMesa();
    }
  };

  const processPaymentAndCloseMesa = () => {
    if (!selectedOrder || !cashierPaymentMethod) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOrders((prev: Order[]) => prev.filter(o => o.id !== selectedOrder.id));
    setPaidHistory((prev: Order[]) => [...prev, { ...selectedOrder, status: 'pagado', paymentMethod: cashierPaymentMethod as any }]);
    setOrderModalVisible(false);
    showToast(`✅ Mesa cobrada con éxito (${cashierPaymentMethod})`);
    setSelectedOrder(null);
    setCashierPaymentMethod('');
  };

  const renderOrder = ({ item }: { item: Order }) => {
    if (item.status === 'pagado') return null;
    const isMesa = item.type === 'mesa';
    const isTransferPending = item.status === 'pagando_transferencia';

    return (
      <View style={[styles.card, isMesa ? styles.cardMesa : styles.cardLlevar, isTransferPending && styles.cardTransfer]}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>{item.id} • {item.time}</Text>
          <Text style={styles.orderTotal}>${item.total.toLocaleString('es-CO')}</Text>
        </View>
        <Text style={styles.orderTitle}>{isMesa ? `📍 Mesa ${item.table}` : isTransferPending ? '📱 Domicilio (Validar Pago)' : '🛵 Domicilio (Pendiente)'}</Text>
        <Text style={styles.orderItemsPreview} numberOfLines={2}>{item.items.replace(/\n/g, ', ')}</Text>
        <TouchableOpacity style={[styles.payButton, isTransferPending && styles.payButtonReview]} onPress={() => openPaymentModal(item)}>
          <Text style={styles.payButtonText}>{isTransferPending ? '🔍 Revisar Comprobante' : 'Cobrar Mesa'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const displayData = filterType === 'pedidos' ? orders.filter((o: Order) => o.status === 'pendiente') : orders.filter((o: Order) => o.status === 'pagando_transferencia');
  const emptyText = filterType === 'pedidos' ? 'No hay pedidos pendientes por cobrar.' : 'No hay comprobantes pendientes de validación.';

  return (
    <View style={styles.content}>
      <FlatList data={displayData} keyExtractor={item => item.id} renderItem={renderOrder} contentContainerStyle={styles.listPadding} ListEmptyComponent={<Text style={styles.emptyText}>{emptyText}</Text>} />
      
      {/* Modal Principal */}
      <Modal animationType="slide" transparent={true} visible={orderModalVisible} onRequestClose={() => setOrderModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedOrder?.status === 'pagando_transferencia' ? 'Validar Comprobante' : 'Cobrar Mesa'}</Text>
              <TouchableOpacity onPress={() => setOrderModalVisible(false)}><Text style={styles.closeIcon}>✕</Text></TouchableOpacity>
            </View>

            {selectedOrder && (
              <View style={styles.ticketContainer}>
                {selectedOrder.status === 'pagando_transferencia' ? (
                  <View style={styles.proofContainer}>
                    <Text style={styles.ticketItemsHeader}>El cliente subió esta imagen:</Text>
                    <Image source={{uri: selectedOrder.transferProofUrl}} style={styles.proofImage} resizeMode="contain" />
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>MONTO A VERIFICAR:</Text>
                      <Text style={styles.totalValue}>${selectedOrder.total.toLocaleString('es-CO')}</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={styles.ticketRow}><Text style={styles.ticketLabel}>Mesa:</Text><Text style={styles.ticketValueLarge}>{selectedOrder.table || 'Para Llevar'}</Text></View>
                    <View style={styles.ticketRow}><Text style={styles.ticketLabel}>Hora de pedido:</Text><Text style={styles.ticketValue}>{selectedOrder.time}</Text></View>
                    <View style={styles.divider} />
                    <Text style={styles.ticketItemsHeader}>Detalle de Consumo:</Text>
                    <ScrollView style={styles.itemsScroll}><Text style={styles.ticketItemsList}>{selectedOrder.items}</Text></ScrollView>
                    <TouchableOpacity style={styles.addMissingBtn} onPress={() => setCatalogModalVisible(true)}>
                      <Ionicons name="add-circle" size={16} color="#3B82F6" style={{ marginRight: 5 }} />
                      <Text style={styles.addMissingBtnText}>Agregar producto extra</Text>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <View style={styles.totalRow}><Text style={styles.totalLabel}>TOTAL A COBRAR:</Text><Text style={styles.totalValue}>${selectedOrder.total.toLocaleString('es-CO')}</Text></View>

                    <Text style={styles.paymentMethodTitle}>¿Cómo pagó el cliente?</Text>
                    <View style={styles.paymentOptionsRow}>
                      <TouchableOpacity style={[styles.paymentMethodBtn, cashierPaymentMethod === 'efectivo' && styles.paymentMethodBtnActive]} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setCashierPaymentMethod('efectivo')}}>
                        <Ionicons name="cash" size={20} color={cashierPaymentMethod === 'efectivo' ? '#E61C24' : '#64748B'} />
                        <Text style={[styles.paymentMethodText, cashierPaymentMethod === 'efectivo' && styles.paymentMethodTextActive]}>Efectivo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.paymentMethodBtn, cashierPaymentMethod === 'transferencia' && styles.paymentMethodBtnActive]} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setCashierPaymentMethod('transferencia')}}>
                        <Ionicons name="phone-portrait" size={20} color={cashierPaymentMethod === 'transferencia' ? '#E61C24' : '#64748B'} />
                        <Text style={[styles.paymentMethodText, cashierPaymentMethod === 'transferencia' && styles.paymentMethodTextActive]}>Transferencia</Text>
                      </TouchableOpacity>
                    </View>
                    {cashierPaymentMethod === 'transferencia' && (
                      <View style={styles.warningBox}>
                        <Ionicons name="warning" size={16} color="#D97706" style={{marginRight: 5}}/>
                        <Text style={styles.warningText}>No olvides revisar el comprobante o tu app Nequi antes de confirmar.</Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {selectedOrder?.status === 'pagando_transferencia' ? (
              <View style={styles.validationButtonsRow}>
                <TouchableOpacity style={styles.btnReject} onPress={() => handleValidateTransfer(false)}><Text style={styles.modalAcceptText}>❌ Rechazar</Text></TouchableOpacity>
                <TouchableOpacity style={styles.btnApprove} onPress={() => handleValidateTransfer(true)}><Text style={styles.modalAcceptText}>✅ Aprobar Transferencia</Text></TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={[styles.modalAcceptBtn, !cashierPaymentMethod && styles.modalAcceptBtnDisabled]} onPress={confirmOrderPayment} disabled={!cashierPaymentMethod}>
                <Text style={styles.modalAcceptText}>{cashierPaymentMethod ? 'Confirmar Pago y Cerrar Mesa' : 'Selecciona el método de pago'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal del Catálogo */}
      <Modal animationType="fade" transparent={true} visible={catalogModalVisible} onRequestClose={() => setCatalogModalVisible(false)}>
        <View style={styles.catalogOverlay}>
          <View style={styles.catalogBox}>
            <View style={styles.catalogHeader}>
              <Text style={styles.catalogTitle}>Agregar a la cuenta</Text>
              <TouchableOpacity onPress={() => setCatalogModalVisible(false)}><Text style={styles.closeIcon}>✕</Text></TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#94A3B8" />
              <TextInput style={styles.searchInput} placeholder="Buscar empanada..." placeholderTextColor="#94A3B8" value={searchQuery} onChangeText={setSearchQuery} autoFocus={true} />
              {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={20} color="#94A3B8" /></TouchableOpacity>}
            </View>
            <FlatList data={filteredMenu} keyExtractor={item => item.id} contentContainerStyle={{ paddingBottom: 20 }} renderItem={({ item }) => (
              <TouchableOpacity style={styles.catalogItem} onPress={() => handleSelectMenuItem(item)}>
                <View><Text style={styles.catalogItemName}>{item.name}</Text><Text style={styles.catalogItemPrice}>+ ${item.price.toLocaleString('es-CO')}</Text></View>
                <View style={styles.catalogAddBtn}><Text style={styles.catalogAddBtnText}>Añadir</Text></View>
              </TouchableOpacity>
            )} ListEmptyComponent={<Text style={styles.emptyCatalogText}>No se encontraron productos con "{searchQuery}"</Text>} />
          </View>
        </View>
      </Modal>
    </View>
  );
};