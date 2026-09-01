import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Image, LayoutAnimation, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MENU_ITEMS, Order } from './CashierData';
import { styles } from './style/CashierStyles';
import { TRANSLATIONS, LanguageCode } from './../../../locales/CashierTranslations';

// 🔥 AÑADIMOS 'isDark' A LOS PROPS PARA ESCUCHAR EL MODO OSCURO
export const OrdersFeature = ({ orders, setOrders, setPaidHistory, showToast, filterType, setActiveTab, lang = 'es', isDark = false }: any) => {
  
  const t = TRANSLATIONS[lang as LanguageCode] || TRANSLATIONS['es'];

  // 🔥 PALETA DE COLORES DINÁMICA COMPLETA PARA EL CAJERO 🔥
  const colors = {
    background: isDark ? '#0F172A' : '#F8FAFC',
    card: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#F8FAFC' : '#1E293B',
    muted: isDark ? '#94A3B8' : '#64748B',
    border: isDark ? '#334155' : '#E2E8F0',
    inputBg: isDark ? '#0F172A' : '#F1F5F9',
    warningBg: isDark ? '#451a03' : '#FEF3C7',
    warningText: isDark ? '#fde68a' : '#92400E',
    warningBorder: isDark ? '#78350f' : '#FDE68A',
  };

  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [cashierPaymentMethod, setCashierPaymentMethod] = useState<'efectivo' | 'transferencia' | 'datafono' | ''>('');
  const [catalogModalVisible, setCatalogModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [extraItemForTakeaway, setExtraItemForTakeaway] = useState(false);
  
  const [orderType, setOrderType] = useState<'mesa' | 'llevar'>('mesa');
  const [printReceipt, setPrintReceipt] = useState(false);

  const filteredMenu = useMemo(() => {
    return MENU_ITEMS.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const openPaymentModal = (order: Order) => {
    setSelectedOrder(order);
    setPrintReceipt(false);
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
      showToast(t.toastTransferValidated);
      if(printReceipt) showToast(t.toastPrinting);
    } else {
      setOrders((prev: Order[]) => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'pendiente' } : o));
      showToast(t.toastProofRejected);
    }
    setOrderModalVisible(false);
    setSelectedOrder(null);
  };

  const handleSelectMenuItem = (item: typeof MENU_ITEMS[0]) => {
    if (selectedOrder) {
      const extraLabel = extraItemForTakeaway ? `Extra Caja - ${t.catalogTakeaway}` : `Extra Caja - ${t.catalogTable}`;
      const updatedOrder = { ...selectedOrder, items: selectedOrder.items + `\n1x ${item.name} (${extraLabel})`, total: selectedOrder.total + item.price };
      setSelectedOrder(updatedOrder);
      setOrders((prev: Order[]) => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      setCatalogModalVisible(false);
      setSearchQuery('');
      setExtraItemForTakeaway(false);
      showToast(`✅ ${item.name} ${t.toastItemAdded.replace('{item}', '')}`);
    }
  };

  const confirmOrderPayment = () => {
    if (!cashierPaymentMethod) return Alert.alert(t.alertMissingPayment, t.alertSelectPayment);
    if (cashierPaymentMethod === 'transferencia' && selectedOrder?.status !== 'pagando_transferencia') {
      Alert.alert(t.alertVerifyTransfer, t.alertConfirmTransfer, [
        { text: t.btnNoReview, style: "cancel" },
        { text: t.btnYesConfirm, onPress: () => processPaymentAndCloseMesa() }
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
    
    const translatedMethod = cashierPaymentMethod === 'efectivo' ? t.payCash : cashierPaymentMethod === 'datafono' ? t.payCard : t.payTransfer;
    showToast(`✅ ${t.toastPaymentSuccess.replace('{method}', translatedMethod.toUpperCase())}`);
    
    if(printReceipt) {
      setTimeout(() => showToast(t.toastPrinting), 1000);
    }

    setSelectedOrder(null);
    setCashierPaymentMethod('');
  };

  const renderOrder = ({ item }: { item: Order }) => {
    if (item.status === 'pagado') return null;
    const isMesa = item.type === 'mesa';
    const isTransferPending = item.status === 'pagando_transferencia';

    const orderTitle = isMesa 
      ? t.orderTable.replace('{table}', String(item.table || '')) 
      : isTransferPending ? t.orderDelivery : t.orderTakeaway;

    return (
      // 🔥 APLICAMOS COLORES A LAS TARJETAS Y A SUS TEXTOS INTERNOS 🔥
      <View style={[styles.card, { backgroundColor: colors.card }, isMesa ? styles.cardMesa : styles.cardLlevar, isTransferPending && styles.cardTransfer]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.orderId, { color: colors.muted }]}>{item.id} • {item.time}</Text>
          <Text style={[styles.orderTotal, { color: colors.text }]}>${item.total.toLocaleString('es-CO')}</Text>
        </View>
        <Text style={[styles.orderTitle, { color: colors.text }]}>{orderTitle}</Text>
        <Text style={[styles.orderItemsPreview, { color: colors.muted }]} numberOfLines={2}>{item.items.replace(/\n/g, ', ')}</Text>
        <TouchableOpacity style={[styles.payButton, isTransferPending && styles.payButtonReview]} onPress={() => openPaymentModal(item)}>
          <Text style={styles.payButtonText}>{isTransferPending ? t.btnReviewProof : t.btnCharge}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const displayData = orders.filter((o: Order) => o.type === filterType && o.status !== 'pagado');
  const emptyText = filterType === 'mesa' ? t.emptyTables : t.emptyOthers;

  return (
    <View style={styles.content}>
      <FlatList 
        data={displayData} 
        keyExtractor={item => item.id} 
        renderItem={renderOrder} 
        contentContainerStyle={styles.listPadding} 
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.muted }]}>{emptyText}</Text>} 
      />
      
      <Modal animationType="slide" transparent={true} visible={orderModalVisible} onRequestClose={() => setOrderModalVisible(false)}>
        <View style={styles.modalOverlay}>
          {/* 🔥 MODAL DE COBRO DINÁMICO 🔥 */}
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedOrder?.status === 'pagando_transferencia' ? t.modalValidateProof : t.modalChargeOrder}</Text>
              <TouchableOpacity onPress={() => setOrderModalVisible(false)}><Text style={[styles.closeIcon, { color: colors.muted }]}>✕</Text></TouchableOpacity>
            </View>

            {selectedOrder && (
              <View style={[styles.ticketContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                {selectedOrder.status === 'pagando_transferencia' ? (
                  <View style={styles.proofContainer}>
                    <Text style={[styles.ticketItemsHeader, { color: colors.muted }]}>{t.proofClientUploaded}</Text>
                    <Image source={{uri: selectedOrder.transferProofUrl}} style={styles.proofImage} resizeMode="contain" />
                    
                    <TouchableOpacity 
                      style={[styles.addMissingBtn, {borderColor: printReceipt ? '#10B981' : colors.border, marginTop: 10, width: '100%'}]} 
                      onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setPrintReceipt(!printReceipt); }}
                    >
                      <Ionicons name={printReceipt ? "print" : "print-outline"} size={16} color={printReceipt ? '#10B981' : colors.muted} style={{ marginRight: 5 }} />
                      <Text style={[styles.addMissingBtnText, {color: printReceipt ? '#10B981' : colors.muted}]}>
                        {printReceipt ? t.btnReceiptYes : t.btnReceiptAsk}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.totalRow}>
                      <Text style={[styles.totalLabel, { color: colors.text }]}>{t.amountToVerify}</Text>
                      <Text style={styles.totalValue}>${selectedOrder.total.toLocaleString('es-CO')}</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={styles.ticketRow}>
                      <Text style={[styles.ticketLabel, { color: colors.muted }]}>{t.orderTypeLabel}</Text>
                      <Text style={styles.ticketValueLarge}>
                        {selectedOrder.type === 'mesa' ? t.orderTable.replace('{table}', String(selectedOrder.table || '')) : t.catalogTakeaway}
                      </Text>
                    </View>
                    <Text style={[styles.warningText, { color: colors.muted, marginTop: -4, marginBottom: 10 }]}>{t.warningTableTakeaway}</Text>
                    <View style={styles.ticketRow}><Text style={[styles.ticketLabel, { color: colors.muted }]}>{t.orderTimeLabel}</Text><Text style={[styles.ticketValue, { color: colors.text }]}>{selectedOrder.time}</Text></View>
                    
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    
                    <Text style={[styles.ticketItemsHeader, { color: colors.muted }]}>{t.consumptionDetail}</Text>
                    <ScrollView style={styles.itemsScroll}><Text style={[styles.ticketItemsList, { color: colors.text }]}>{selectedOrder.items}</Text></ScrollView>
                    
                    <View style={{flexDirection: 'row', gap: 10, marginTop: 10}}>
                      <TouchableOpacity style={[styles.addMissingBtn, {flex: 1, borderColor: '#3B82F6', backgroundColor: isDark ? '#1e3a8a' : '#EFF6FF'}]} onPress={() => setCatalogModalVisible(true)}>
                        <Ionicons name="add-circle" size={16} color="#3B82F6" style={{ marginRight: 5 }} />
                        <Text style={styles.addMissingBtnText}>{t.btnAddExtra}</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.addMissingBtn, {flex: 1, borderColor: printReceipt ? '#10B981' : colors.border, backgroundColor: isDark ? 'transparent' : '#FFFFFF'}]} 
                        onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setPrintReceipt(!printReceipt); }}
                      >
                        <Ionicons name={printReceipt ? "print" : "print-outline"} size={16} color={printReceipt ? '#10B981' : colors.muted} style={{ marginRight: 5 }} />
                        <Text style={[styles.addMissingBtnText, {color: printReceipt ? '#10B981' : colors.muted}]}>
                          {printReceipt ? t.btnReceiptYes : t.btnReceiptAsk}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    
                    <View style={styles.totalRow}>
                      <Text style={[styles.totalLabel, { color: colors.text }]}>{t.totalToCharge}</Text>
                      <Text style={styles.totalValue}>${selectedOrder.total.toLocaleString('es-CO')}</Text>
                    </View>

                    <Text style={[styles.paymentMethodTitle, { color: colors.muted }]}>{t.howDidClientPay}</Text>
                    
                    <View style={styles.paymentOptionsRow}>
                      <TouchableOpacity style={[styles.paymentMethodBtn, { backgroundColor: colors.card, borderColor: colors.border }, cashierPaymentMethod === 'efectivo' && styles.paymentMethodBtnActive]} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setCashierPaymentMethod('efectivo')}}>
                        <Ionicons name="cash" size={20} color={cashierPaymentMethod === 'efectivo' ? '#E61C24' : colors.muted} />
                        <Text style={[styles.paymentMethodText, { color: colors.muted }, cashierPaymentMethod === 'efectivo' && styles.paymentMethodTextActive]}>{t.payCash}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.paymentMethodBtn, { backgroundColor: colors.card, borderColor: colors.border }, cashierPaymentMethod === 'datafono' && styles.paymentMethodBtnActive]} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setCashierPaymentMethod('datafono')}}>
                        <Ionicons name="card" size={20} color={cashierPaymentMethod === 'datafono' ? '#E61C24' : colors.muted} />
                        <Text style={[styles.paymentMethodText, { color: colors.muted }, cashierPaymentMethod === 'datafono' && styles.paymentMethodTextActive]}>{t.payCard}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.paymentMethodBtn, { backgroundColor: colors.card, borderColor: colors.border }, cashierPaymentMethod === 'transferencia' && styles.paymentMethodBtnActive]} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setCashierPaymentMethod('transferencia')}}>
                        <Ionicons name="phone-portrait" size={20} color={cashierPaymentMethod === 'transferencia' ? '#E61C24' : colors.muted} />
                        <Text style={[styles.paymentMethodText, { color: colors.muted }, cashierPaymentMethod === 'transferencia' && styles.paymentMethodTextActive]}>{t.payTransfer}</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {cashierPaymentMethod === 'transferencia' && (
                      <View style={[styles.warningBox, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
                        <Ionicons name="warning" size={16} color={colors.warningText} style={{marginRight: 5}}/>
                        <Text style={[styles.warningText, { color: colors.warningText }]}>{t.warningTransfer}</Text>
                      </View>
                    )}
                    {cashierPaymentMethod === 'datafono' && (
                      <View style={[styles.warningBox, { backgroundColor: isDark ? '#064e3b' : '#d1fae5', borderColor: isDark ? '#065f46' : '#a7f3d0' }]}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{marginRight: 5}}/>
                        <Text style={[styles.warningText, {color: isDark ? '#34d399' : '#065F46'}]}>{t.warningCard}</Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {selectedOrder?.status === 'pagando_transferencia' ? (
              <View style={styles.validationButtonsRow}>
                <TouchableOpacity style={styles.btnReject} onPress={() => handleValidateTransfer(false)}>
                  <Text style={styles.modalAcceptText}>{t.btnReject}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnApprove} onPress={() => handleValidateTransfer(true)}>
                  <Text style={styles.modalAcceptText}>{t.btnApproveTransfer}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={[styles.modalAcceptBtn, !cashierPaymentMethod && { backgroundColor: isDark ? '#475569' : '#FDA4AF' }]} onPress={confirmOrderPayment} disabled={!cashierPaymentMethod}>
                <Text style={styles.modalAcceptText}>{cashierPaymentMethod ? t.btnConfirmAndClose : t.btnSelectMethod}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* 🔥 MODAL DE CATÁLOGO (AGREGAR EXTRA) DINÁMICO 🔥 */}
      <Modal animationType="fade" transparent={true} visible={catalogModalVisible} onRequestClose={() => setCatalogModalVisible(false)}>
        <View style={styles.catalogOverlay}>
          <View style={[styles.catalogBox, { backgroundColor: colors.card }]}>
            <View style={styles.catalogHeader}>
              <Text style={[styles.catalogTitle, { color: colors.text }]}>{t.catalogTitle}</Text>
              <TouchableOpacity onPress={() => setCatalogModalVisible(false)}><Text style={[styles.closeIcon, { color: colors.muted }]}>✕</Text></TouchableOpacity>
            </View>
            
            <Text style={[styles.warningText, { color: colors.muted, marginBottom: 10 }]}>{t.catalogExtraQuestion}</Text>
            
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <TouchableOpacity
                style={[styles.addMissingBtn, { flex: 1, marginTop: 0, borderColor: !extraItemForTakeaway ? '#10B981' : colors.border, backgroundColor: isDark ? 'transparent' : '#FFFFFF' }]}
                onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExtraItemForTakeaway(false); }}
              >
                <Ionicons name="restaurant" size={16} color={!extraItemForTakeaway ? '#10B981' : colors.muted} style={{ marginRight: 5 }} />
                <Text style={[styles.addMissingBtnText, { color: !extraItemForTakeaway ? '#10B981' : colors.muted }]}>{t.catalogTable}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addMissingBtn, { flex: 1, marginTop: 0, borderColor: extraItemForTakeaway ? '#10B981' : colors.border, backgroundColor: isDark ? 'transparent' : '#FFFFFF' }]}
                onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExtraItemForTakeaway(true); }}
              >
                <Ionicons name="bag-outline" size={16} color={extraItemForTakeaway ? '#10B981' : colors.muted} style={{ marginRight: 5 }} />
                <Text style={[styles.addMissingBtnText, { color: extraItemForTakeaway ? '#10B981' : colors.muted }]}>{t.catalogTakeaway}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colors.inputBg }]}>
              <Ionicons name="search" size={20} color={colors.muted} />
              <TextInput 
                style={[styles.searchInput, { color: colors.text }]} 
                placeholder={t.catalogSearchPlaceholder} 
                placeholderTextColor={colors.muted} 
                value={searchQuery} 
                onChangeText={setSearchQuery} 
                autoFocus={true} 
              />
              {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={20} color={colors.muted} /></TouchableOpacity>}
            </View>
            
            <FlatList 
              data={filteredMenu} 
              keyExtractor={item => item.id} 
              contentContainerStyle={{ paddingBottom: 20 }} 
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.catalogItem, { borderBottomColor: colors.border }]} onPress={() => handleSelectMenuItem(item)}>
                  <View>
                    <Text style={[styles.catalogItemName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={styles.catalogItemPrice}>+ ${item.price.toLocaleString('es-CO')}</Text>
                  </View>
                  <View style={[styles.catalogAddBtn, { backgroundColor: isDark ? '#451a03' : '#FEF2F2' }]}>
                     <Text style={styles.catalogAddBtnText}>{t.catalogBtnAdd}</Text>
                  </View>
                </TouchableOpacity>
              )} 
              ListEmptyComponent={<Text style={[styles.emptyCatalogText, { color: colors.muted }]}>{t.catalogEmptySearch.replace('{query}', searchQuery)}</Text>} 
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};