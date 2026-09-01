import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Order } from './DeliveryData';

// 🔥 IMPORTAMOS CONTEXTO Y TRADUCCIONES
import { useDeliveryContext } from './context/DeliveryContext';
import { TRANSLATIONS, LanguageCode } from '../../../locales/DeliveryTranslations';

interface DeliveryModalsProps {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  mapModalVisible: boolean;
  setMapModalVisible: (visible: boolean) => void;
  selectedOrder: Order | null;
  handleConfirmOrder: () => void;
  isSheetExpanded: boolean;
  toggleSheet: () => void;
  handleCallCustomer: (phone: string) => void;
  handleFinishDelivery: () => void;
  handleMarkPaymentReceived: () => void;
  styles: any;
}

export const DeliveryModals = ({
  modalVisible, setModalVisible, mapModalVisible, setMapModalVisible,
  selectedOrder, handleConfirmOrder, isSheetExpanded, toggleSheet,
  handleCallCustomer, handleFinishDelivery, handleMarkPaymentReceived, styles
}: DeliveryModalsProps) => {

  // 🔥 LECTURA DEL CONTEXTO
  const { language, isDark } = useDeliveryContext();
  const t = TRANSLATIONS[language as LanguageCode] || TRANSLATIONS['es'];

  // 🔥 PALETA DE COLORES DINÁMICA
  const colors = isDark ? {
    background: '#0F172A', card: '#1E293B', text: '#F8FAFC',
    muted: '#94A3B8', border: '#334155', accent: '#E61C24',
    btnCancelBg: '#334155', btnCancelText: '#F8FAFC',
    boxBg: '#0F172A', overlay: 'rgba(15, 23, 42, 0.85)',
    infoBg: '#1E3A8A', infoText: '#93C5FD',
    successBg: '#064E3B', successText: '#34D399',
    warningBg: '#78350F', warningText: '#FBBF24',
    dangerBg: '#7F1D1D', dangerText: '#FCA5A5'
  } : {
    background: '#F8FAFC', card: '#FFFFFF', text: '#1E293B',
    muted: '#64748B', border: '#E2E8F0', accent: '#E61C24',
    btnCancelBg: '#F1F5F9', btnCancelText: '#475569',
    boxBg: '#F8FAFC', overlay: 'rgba(15, 23, 42, 0.6)',
    infoBg: '#EFF6FF', infoText: '#1E3A8A',
    successBg: '#ECFDF5', successText: '#10B981',
    warningBg: '#FFFBEB', warningText: '#92400E',
    dangerBg: '#FEF2F2', dangerText: '#DC2626'
  };

  const [isConfirming, setIsConfirming] = useState(false);

  const executeConfirm = () => {
    setIsConfirming(false);
    handleConfirmOrder();
  };

  const isCashPayment = selectedOrder?.paymentMethod === 'Efectivo';
  const isPendingCashPayment = Boolean(selectedOrder && isCashPayment && selectedOrder.paymentStatus === 'Pendiente');
  
  // Traducir dinámicamente si es efectivo u otro
  const paymentMethodLabel = isCashPayment ? (t.payCash || 'Efectivo') : (selectedOrder?.paymentMethod ?? '');
  const paymentStatusLabel = isPendingCashPayment ? (t.toCollect || 'Por cobrar') : (t.paid || 'Pagado');

  return (
    <>
      {/* 1. MODAL DE DETALLES DEL VIAJE */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t.tripDetails || 'Detalles del Viaje'}</Text>
                
                {/* ESTADO LOCAL */}
                <View style={[styles.statusBox, { backgroundColor: colors.boxBg }]}>
                  <Text style={[styles.statusLabel, { color: colors.muted }]}>{t.localStatus || 'Estado en local:'}</Text>
                  <Text style={[styles.statusValue, { color: selectedOrder.restaurantStatus === 'Preparando' ? '#F59E0B' : colors.successText }]}>
                    {selectedOrder.restaurantStatus === 'Preparando' ? (t.statusPreparing || '🍳 Preparando...') : (t.statusReady || '✅ Listo para recoger')}
                  </Text>
                </View>

                {/* PRODUCTOS */}
                <View style={[styles.productsBox, { backgroundColor: colors.warningBg, borderColor: colors.border }]}>
                  <Text style={[styles.productsTitle, { color: colors.warningText }]}>{t.productsToCollect || 'Productos a recoger:'}</Text>
                  {selectedOrder.items.map((prod: any, index: number) => (
                    <View key={index} style={styles.productRow}>
                      <Text style={[styles.productQuantity, { color: colors.warningText }]}>{prod.quantity}x</Text>
                      <Text style={[styles.productName, { color: colors.text }]}>{prod.name}</Text>
                    </View>
                  ))}
                </View>

                {/* RECIBO DE COBRO */}
                <View style={[styles.receiptBox, { borderColor: colors.border }]}>
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptText, { color: colors.muted }]}>{t.orderCost || 'Costo del pedido:'}</Text>
                    <Text style={[styles.receiptText, { color: colors.muted }]}>${selectedOrder.subtotal.toLocaleString()}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptText, { color: colors.muted }]}>{t.deliveryFee || 'Tarifa de entrega:'}</Text>
                    <Text style={[styles.receiptBold, { color: colors.text }]}>+ ${selectedOrder.deliveryFee.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptTotal}>{t.toChargeCustomer || 'A cobrar al cliente:'}</Text>
                    <Text style={styles.receiptTotal}>${(selectedOrder.subtotal + selectedOrder.deliveryFee).toLocaleString()}</Text>
                  </View>

                  <View style={[styles.paymentMethodBox, { backgroundColor: colors.infoBg }]}>
                    <Text style={[styles.paymentLabel, { color: colors.infoText }]}>{t.paymentMethod || 'Método de pago:'}</Text>
                    <Text style={[styles.paymentValue, { color: colors.infoText }]}>📱 {paymentMethodLabel}</Text>
                  </View>
                  
                  <View style={[styles.paymentStateBox, isPendingCashPayment ? { backgroundColor: colors.dangerBg } : { backgroundColor: colors.successBg }]}>
                    <Text style={[styles.paymentStateLabel, { color: isPendingCashPayment ? colors.dangerText : colors.successText }]}>{t.paymentStatus || 'Estado del pago:'}</Text>
                    <Text style={[styles.paymentStateValue, { color: isPendingCashPayment ? colors.dangerText : colors.successText }]}>{paymentStatusLabel}</Text>
                  </View>
                  
                  <View style={[styles.paymentHintBox, { backgroundColor: colors.boxBg }]}>
                    <Text style={[styles.paymentHintText, { color: colors.muted }]}>
                      {selectedOrder.paymentMethod === 'Efectivo'
                        ? (t.paymentHintCash || 'Cobrar al cliente al entregar el pedido.')
                        : selectedOrder.paymentMethod === 'Datáfono'
                          ? (t.paymentHintCard || 'Cobro con datáfono en la entrega.')
                          : (t.paymentHintTransfer || 'Pago por transferencia ya registrado.')}
                    </Text>
                  </View>
                </View>

                {/* BOTONES DE ACCIÓN */}
                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.btnCancelBg }]} onPress={() => setModalVisible(false)}>
                    <Text style={[styles.cancelButtonText, { color: colors.btnCancelText }]}>{t.btnCancel || 'Cancelar'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.confirmButton, { backgroundColor: '#3B82F6' }]} onPress={() => setIsConfirming(true)}>
                    <Text style={[styles.confirmButtonText, { color: '#FFFFFF' }]}>{t.btnConfirmTrip || 'Confirmar Viaje'}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 2. MODAL DE CONFIRMACIÓN DE SEGURIDAD (PEQUEÑO) */}
      <Modal animationType="fade" transparent={true} visible={isConfirming} onRequestClose={() => setIsConfirming(false)}>
        <View style={[styles.modalOverlay, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.overlay }]}>
          <View style={{ backgroundColor: colors.card, padding: 24, borderRadius: 20, width: '85%', alignItems: 'center', elevation: 10, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: colors.infoBg, justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
              <Ionicons name="bicycle" size={40} color={colors.infoText} />
            </View>
            
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 8, textAlign: 'center' }}>
              {t.confirmTripTitle || '¿Tomar este viaje?'}
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
              {t.confirmTripDesc || 'Al confirmar, serás asignado como el repartidor exclusivo de este pedido.'}
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity style={[styles.cancelButton, { flex: 1, backgroundColor: colors.btnCancelBg }]} onPress={() => setIsConfirming(false)}>
                <Text style={[styles.cancelButtonText, { color: colors.btnCancelText }]}>{t.btnBack || 'Atrás'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmButton, { flex: 1, backgroundColor: '#3B82F6' }]} onPress={executeConfirm}>
                <Text style={[styles.confirmButtonText, { color: '#FFFFFF' }]}>{t.btnYesTakeIt || 'Sí, tomarlo'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. MODAL DE MAPA CON BOTTOM SHEET */}
      <Modal animationType="slide" transparent={false} visible={mapModalVisible} onRequestClose={() => setMapModalVisible(false)}>
        <View style={[styles.mapContainer, { backgroundColor: colors.background }]}>
          
          <View style={styles.mapHeader}>
            <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card }]} onPress={() => setMapModalVisible(false)}>
              <Ionicons name="chevron-down" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.mapHeaderTitle, { color: colors.text, textShadowColor: isDark ? '#000' : '#FFF' }]}>{t.onWayToCustomer || 'En camino al cliente'}</Text>
          </View>

          <Image source={{ uri: 'https://miro.medium.com/v2/resize:fit:1400/1*qYUvh-dpTfwv3E_XGu4_aQ.png' }} style={styles.fakeMapImage} resizeMode="cover" />

          <View style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={styles.dragHandleArea} onPress={toggleSheet} activeOpacity={0.8}>
              <View style={[styles.bottomSheetHandle, { backgroundColor: colors.border }]} />
              <Ionicons name={isSheetExpanded ? "chevron-down" : "chevron-up"} size={20} color={colors.muted} />
              <Text style={[styles.dragText, { color: colors.muted }]}>{isSheetExpanded ? (t.hideDetails || 'Ocultar detalles') : (t.viewOrderDetails || 'Ver detalles del pedido')}</Text>
            </TouchableOpacity>

            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <Text style={[styles.deliverToText, { color: colors.muted }]}>{t.deliverTo || 'Entregar a:'}</Text>
                
                <View style={styles.customerInfoRow}>
                  <View style={styles.customerTextContainer}>
                    <Text style={[styles.customerNameLarge, { color: colors.text }]}>{selectedOrder.customerName}</Text>
                    <Text style={[styles.customerAddressLarge, { color: colors.muted }]} numberOfLines={isSheetExpanded ? undefined : 1}>{selectedOrder.address}</Text>
                  </View>
                  <TouchableOpacity style={styles.callCircleButton} onPress={() => handleCallCustomer(selectedOrder.customerPhone)}>
                    <Ionicons name="call" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {isSheetExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={[styles.phoneBox, { backgroundColor: colors.boxBg, borderColor: colors.border }]}>
                      <Text style={[styles.phoneText, { color: colors.text }]}>{t.tel || 'Tel:'} {selectedOrder.customerPhone}</Text>
                    </View>
                    
                    <View style={[styles.paymentStateBox, selectedOrder.paymentMethod === 'Efectivo' && selectedOrder.paymentStatus === 'Pendiente' ? { backgroundColor: colors.dangerBg } : { backgroundColor: colors.successBg }]}>
                      <Text style={[styles.paymentStateLabel, { color: selectedOrder.paymentStatus === 'Pendiente' ? colors.dangerText : colors.successText }]}>{t.paymentStatus || 'Pago:'}</Text>
                      <Text style={[styles.paymentStateValue, { color: selectedOrder.paymentStatus === 'Pendiente' ? colors.dangerText : colors.successText }]}>{paymentMethodLabel} · {paymentStatusLabel}</Text>
                    </View>
                    
                    <View style={styles.mapProductsBox}>
                      <Text style={[styles.mapProductsTitle, { color: colors.muted }]}>{t.verifyDelivery || 'Verifica que entregas:'}</Text>
                      {selectedOrder.items.map((prod: any, index: number) => (
                        <Text key={index} style={[styles.mapProductText, { color: colors.text }]}>• {prod.quantity}x {prod.name}</Text>
                      ))}
                    </View>
                    
                    {selectedOrder.paymentMethod === 'Efectivo' && selectedOrder.paymentStatus === 'Pendiente' && (
                      <TouchableOpacity style={styles.paymentReceivedButton} onPress={handleMarkPaymentReceived}>
                        <Text style={styles.paymentReceivedText}>{t.btnMarkCashReceived || 'Marcar efectivo recibido'}</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity style={styles.finishDeliveryButton} onPress={handleFinishDelivery}>
                      <Text style={styles.finishDeliveryText}>{t.btnMarkDelivered || 'Marcar como Entregado'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};