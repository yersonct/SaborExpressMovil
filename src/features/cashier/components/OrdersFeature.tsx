import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Image, LayoutAnimation, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MENU_ITEMS, Order } from './CashierData';
import { styles } from './style/CashierStyles';

export const OrdersFeature = ({ orders, setOrders, setPaidHistory, showToast, filterType, setActiveTab }: any) => {
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [cashierPaymentMethod, setCashierPaymentMethod] = useState<'efectivo' | 'transferencia' | 'datafono' | ''>('');
  const [catalogModalVisible, setCatalogModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [extraItemForTakeaway, setExtraItemForTakeaway] = useState(false);
  
  const [orderType, setOrderType] = useState<'mesa' | 'llevar'>('mesa');

  // 🔥 NUEVO ESTADO: Para saber si el cliente quiere factura física
  const [printReceipt, setPrintReceipt] = useState(false);

  const filteredMenu = useMemo(() => {
    return MENU_ITEMS.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const openPaymentModal = (order: Order) => {
    setSelectedOrder(order);
    setPrintReceipt(false); // 🔥 Por defecto, no imprimimos factura hasta que lo pidan
    setCashierPaymentMethod(order.status === 'pagando_transferencia' ? 'transferencia' : '');
    setOrderType(order.type);
    setOrderModalVisible(true);
  };

  const handleValidateTransfer = (isApproved: boolean) => {
    if (!selectedOrder) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (isApproved) {
      setOrders((prev: Order[]) => prev.filter(o => o.id !== selectedOrder.id));
      setPaidHistory((prev: Order[]) => [...prev, { ...selectedOrder, status: 'pagado', paymentMethod: 'transferencia', type: orderType }]);
      showToast(`✅ Transferencia de ${selectedOrder.id} validada.`);
      if(printReceipt) showToast('🖨️ Imprimiendo factura...'); // 🔥 Aviso de impresión
    } else {
      setOrders((prev: Order[]) => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'pendiente' } : o));
      showToast(`❌ Comprobante rechazado. Pasa a pendientes.`);
    }
    setOrderModalVisible(false);
    setSelectedOrder(null);
  };

  const handleSelectMenuItem = (item: typeof MENU_ITEMS[0]) => {
    if (selectedOrder) {
      const extraLabel = extraItemForTakeaway ? 'Extra Caja - Para Llevar' : 'Extra Caja - Mesa';
      const updatedOrder = { ...selectedOrder, items: selectedOrder.items + `\n1x ${item.name} (${extraLabel})`, total: selectedOrder.total + item.price };
      setSelectedOrder(updatedOrder);
      setOrders((prev: Order[]) => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      setCatalogModalVisible(false);
      setSearchQuery('');
      setExtraItemForTakeaway(false);
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
    setPaidHistory((prev: Order[]) => [...prev, { ...selectedOrder, status: 'pagado', paymentMethod: cashierPaymentMethod as any, type: orderType }]);
    setOrderModalVisible(false);
    
    showToast(`✅ Cobro exitoso por ${cashierPaymentMethod.toUpperCase()}`);
    // 🔥 Si el cliente pidió factura, simulamos la impresión
    if(printReceipt) {
      setTimeout(() => showToast('🖨️ Imprimiendo factura física...'), 1000);
    }

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
        <Text style={styles.orderTitle}>{isMesa ? `📍 Mesa ${item.table}` : isTransferPending ? '📱 Domicilio (Validar Pago)' : '📦 Para Llevar'}</Text>
        <Text style={styles.orderItemsPreview} numberOfLines={2}>{item.items.replace(/\n/g, ', ')}</Text>
        <TouchableOpacity style={[styles.payButton, isTransferPending && styles.payButtonReview]} onPress={() => openPaymentModal(item)}>
          <Text style={styles.payButtonText}>{isTransferPending ? '🔍 Revisar Comprobante' : 'Cobrar'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const displayData = orders.filter((o: Order) => o.type === filterType && o.status !== 'pagado');
  const emptyText = filterType === 'mesa' ? 'No hay pedidos en mesas pendientes por cobrar.' : 'No hay pedidos para llevar o domicilios pendientes.';

  return (
    <View style={styles.content}>
      <FlatList data={displayData} keyExtractor={item => item.id} renderItem={renderOrder} contentContainerStyle={styles.listPadding} ListEmptyComponent={<Text style={styles.emptyText}>{emptyText}</Text>} />
      
      {/* Modal Principal */}
      <Modal animationType="slide" transparent={true} visible={orderModalVisible} onRequestClose={() => setOrderModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedOrder?.status === 'pagando_transferencia' ? 'Validar Comprobante' : 'Cobrar Pedido'}</Text>
              <TouchableOpacity onPress={() => setOrderModalVisible(false)}><Text style={styles.closeIcon}>✕</Text></TouchableOpacity>
            </View>

            {selectedOrder && (
              <View style={styles.ticketContainer}>
                {selectedOrder.status === 'pagando_transferencia' ? (
                  <View style={styles.proofContainer}>
                    <Text style={styles.ticketItemsHeader}>El cliente subió esta imagen:</Text>
                    <Image source={{uri: selectedOrder.transferProofUrl}} style={styles.proofImage} resizeMode="contain" />
                    
                    {/* 🔥 Botón de Factura también disponible en transferencias */}
                    <TouchableOpacity 
                      style={[styles.addMissingBtn, {borderColor: printReceipt ? '#10B981' : '#E2E8F0', marginTop: 10, width: '100%'}]} 
                      onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setPrintReceipt(!printReceipt); }}
                    >
                      <Ionicons name={printReceipt ? "print" : "print-outline"} size={16} color={printReceipt ? '#10B981' : '#64748B'} style={{ marginRight: 5 }} />
                      <Text style={[styles.addMissingBtnText, {color: printReceipt ? '#10B981' : '#64748B'}]}>
                        {printReceipt ? 'Factura: SÍ (Se imprimirá al validar)' : '¿Imprimir Factura? (Toca aquí)'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>MONTO A VERIFICAR:</Text>
                      <Text style={styles.totalValue}>${selectedOrder.total.toLocaleString('es-CO')}</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={styles.ticketRow}>
                      <Text style={styles.ticketLabel}>Tipo de Pedido:</Text>
                      <Text style={styles.ticketValueLarge}>
                        {selectedOrder.type === 'mesa' ? `Mesa ${selectedOrder.table}` : 'Para Llevar'}
                      </Text>
                    </View>
                    <Text style={[styles.warningText, { marginTop: -4, marginBottom: 10 }]}>
                      Mesa = consumo en el local. Para llevar = pedido solicitado por el cliente para recoger.
                    </Text>
                    <View style={styles.ticketRow}><Text style={styles.ticketLabel}>Hora de pedido:</Text><Text style={styles.ticketValue}>{selectedOrder.time}</Text></View>
                    <View style={styles.divider} />
                    <Text style={styles.ticketItemsHeader}>Detalle de Consumo:</Text>
                    <ScrollView style={styles.itemsScroll}><Text style={styles.ticketItemsList}>{selectedOrder.items}</Text></ScrollView>
                    
                    <View style={{flexDirection: 'row', gap: 10, marginTop: 10}}>
                      <TouchableOpacity style={[styles.addMissingBtn, {flex: 1}]} onPress={() => setCatalogModalVisible(true)}>
                        <Ionicons name="add-circle" size={16} color="#3B82F6" style={{ marginRight: 5 }} />
                        <Text style={styles.addMissingBtnText}>Agregar extra</Text>
                      </TouchableOpacity>
                      
                      {/* 🔥 NUEVO BOTÓN: ¿IMPRIMIR FACTURA? */}
                      <TouchableOpacity 
                        style={[styles.addMissingBtn, {flex: 1, borderColor: printReceipt ? '#10B981' : '#E2E8F0'}]} 
                        onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setPrintReceipt(!printReceipt); }}
                      >
                        <Ionicons name={printReceipt ? "print" : "print-outline"} size={16} color={printReceipt ? '#10B981' : '#64748B'} style={{ marginRight: 5 }} />
                        <Text style={[styles.addMissingBtnText, {color: printReceipt ? '#10B981' : '#64748B'}]}>
                          {printReceipt ? 'Factura: SÍ' : '¿Imprimir Factura?'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>TOTAL A COBRAR:</Text>
                      <Text style={styles.totalValue}>${selectedOrder.total.toLocaleString('es-CO')}</Text>
                    </View>

                    <Text style={styles.paymentMethodTitle}>¿Cómo pagó el cliente?</Text>
                    
                    <View style={styles.paymentOptionsRow}>
                      <TouchableOpacity style={[styles.paymentMethodBtn, cashierPaymentMethod === 'efectivo' && styles.paymentMethodBtnActive]} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setCashierPaymentMethod('efectivo')}}>
                        <Ionicons name="cash" size={20} color={cashierPaymentMethod === 'efectivo' ? '#E61C24' : '#64748B'} />
                        <Text style={[styles.paymentMethodText, cashierPaymentMethod === 'efectivo' && styles.paymentMethodTextActive]}>Efectivo</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.paymentMethodBtn, cashierPaymentMethod === 'datafono' && styles.paymentMethodBtnActive]} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setCashierPaymentMethod('datafono')}}>
                        <Ionicons name="card" size={20} color={cashierPaymentMethod === 'datafono' ? '#E61C24' : '#64748B'} />
                        <Text style={[styles.paymentMethodText, cashierPaymentMethod === 'datafono' && styles.paymentMethodTextActive]}>Datáfono</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.paymentMethodBtn, cashierPaymentMethod === 'transferencia' && styles.paymentMethodBtnActive]} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setCashierPaymentMethod('transferencia')}}>
                        <Ionicons name="phone-portrait" size={20} color={cashierPaymentMethod === 'transferencia' ? '#E61C24' : '#64748B'} />
                        <Text style={[styles.paymentMethodText, cashierPaymentMethod === 'transferencia' && styles.paymentMethodTextActive]}>Transf.</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {cashierPaymentMethod === 'transferencia' && (
                      <View style={styles.warningBox}>
                        <Ionicons name="warning" size={16} color="#D97706" style={{marginRight: 5}}/>
                        <Text style={styles.warningText}>Revisa el comprobante o la app de Nequi/Banco antes de confirmar.</Text>
                      </View>
                    )}
                    {cashierPaymentMethod === 'datafono' && (
                      <View style={styles.warningBox}>
                        <Ionicons name="checkmark-circle" size={16} color="#059669" style={{marginRight: 5}}/>
                        <Text style={[styles.warningText, {color: '#065F46'}]}>Verifica que el datáfono aprobó la transacción e imprime el voucher.</Text>
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
                <Text style={styles.modalAcceptText}>{cashierPaymentMethod ? 'Confirmar Pago y Cerrar' : 'Selecciona el método de pago'}</Text>
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
            <Text style={[styles.warningText, { marginBottom: 10 }]}>¿Este producto extra es para llevar?</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <TouchableOpacity
                style={[styles.addMissingBtn, { flex: 1, marginTop: 0, borderColor: !extraItemForTakeaway ? '#10B981' : '#E2E8F0' }]}
                onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExtraItemForTakeaway(false); }}
              >
                <Ionicons name="restaurant" size={16} color={!extraItemForTakeaway ? '#10B981' : '#64748B'} style={{ marginRight: 5 }} />
                <Text style={[styles.addMissingBtnText, { color: !extraItemForTakeaway ? '#10B981' : '#64748B' }]}>Mesa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addMissingBtn, { flex: 1, marginTop: 0, borderColor: extraItemForTakeaway ? '#10B981' : '#E2E8F0' }]}
                onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExtraItemForTakeaway(true); }}
              >
                <Ionicons name="bag-outline" size={16} color={extraItemForTakeaway ? '#10B981' : '#64748B'} style={{ marginRight: 5 }} />
                <Text style={[styles.addMissingBtnText, { color: extraItemForTakeaway ? '#10B981' : '#64748B' }]}>Para llevar</Text>
              </TouchableOpacity>
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