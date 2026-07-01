import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Order } from './DeliveryData';

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
  styles: any; // Pasamos los estilos como prop para no duplicarlos
}

export const DeliveryModals = ({
  modalVisible, setModalVisible, mapModalVisible, setMapModalVisible,
  selectedOrder, handleConfirmOrder, isSheetExpanded, toggleSheet,
  handleCallCustomer, handleFinishDelivery, handleMarkPaymentReceived, styles
}: DeliveryModalsProps) => {

  // 🔥 NUEVO ESTADO: Controla el modal pequeñito de confirmación
  const [isConfirming, setIsConfirming] = useState(false);

  // Función que ejecuta la confirmación final y cierra los modales
  const executeConfirm = () => {
    setIsConfirming(false);
    handleConfirmOrder();
  };

  const isCashPayment = selectedOrder?.paymentMethod === 'Efectivo';
  const isPendingCashPayment = Boolean(selectedOrder && isCashPayment && selectedOrder.paymentStatus === 'Pendiente');
  const paymentMethodLabel = selectedOrder?.paymentMethod ?? '';
  const paymentStatusLabel = isPendingCashPayment ? 'Por cobrar' : 'Pagado';

  return (
    <>
      {/* 1. MODAL DE DETALLES DEL VIAJE */}
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
                  {selectedOrder.items.map((prod: any, index: number) => (
                    <View key={index} style={styles.productRow}>
                      <Text style={styles.productQuantity}>{prod.quantity}x</Text>
                      <Text style={styles.productName}>{prod.name}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.receiptBox}>
                  {(() => {
                    const isCashPayment = selectedOrder.paymentMethod === 'Efectivo';
                    const isPendingCashPayment = isCashPayment && selectedOrder.paymentStatus === 'Pendiente';
                    const paymentMethodLabel = selectedOrder.paymentMethod;
                    const paymentStatusLabel = isPendingCashPayment ? 'Por cobrar' : 'Pagado';

                    return (
                      <>
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
                    <Text style={styles.paymentValue}>📱 {paymentMethodLabel}</Text>
                  </View>
                  <View style={[styles.paymentStateBox, isPendingCashPayment ? styles.paymentStatePending : styles.paymentStatePaid]}>
                    <Text style={styles.paymentStateLabel}>Estado del pago:</Text>
                    <Text style={styles.paymentStateValue}>{paymentStatusLabel}</Text>
                  </View>
                  <View style={styles.paymentHintBox}>
                    <Text style={styles.paymentHintText}>
                      {selectedOrder.paymentMethod === 'Efectivo'
                        ? 'Cobrar al cliente al entregar el pedido.'
                        : selectedOrder.paymentMethod === 'Datáfono'
                          ? 'Cobro con datáfono en la entrega.'
                          : 'Pago por transferencia ya registrado.'}
                    </Text>
                  </View>
                      </>
                    );
                  })()}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  {/* 🔥 MODIFICADO: Ahora abre el modal de confirmación en vez de confirmar de una */}
                  <TouchableOpacity style={styles.confirmButton} onPress={() => setIsConfirming(true)}>
                    <Text style={styles.confirmButtonText}>Confirmar Viaje</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 🔥 NUEVO MODAL: CONFIRMACIÓN DE SEGURIDAD PARA EL REPARTIDOR */}
      <Modal animationType="fade" transparent={true} visible={isConfirming} onRequestClose={() => setIsConfirming(false)}>
        <View style={[styles.modalOverlay, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.8)' }]}>
          <View style={{ backgroundColor: '#FFFFFF', padding: 24, borderRadius: 20, width: '85%', alignItems: 'center', elevation: 10 }}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
              <Ionicons name="bicycle" size={40} color="#3B82F6" />
            </View>
            
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 8, textAlign: 'center' }}>
              ¿Tomar este viaje?
            </Text>
            <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
              Al confirmar, serás asignado como el repartidor exclusivo de este pedido y el cliente será notificado.
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity style={[styles.cancelButton, { flex: 1 }]} onPress={() => setIsConfirming(false)}>
                <Text style={styles.cancelButtonText}>Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmButton, { flex: 1, backgroundColor: '#3B82F6' }]} onPress={executeConfirm}>
                <Text style={styles.confirmButtonText}>Sí, tomarlo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. MODAL DE MAPA CON BOTTOM SHEET */}
      <Modal animationType="slide" transparent={false} visible={mapModalVisible} onRequestClose={() => setMapModalVisible(false)}>
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => setMapModalVisible(false)}>
              <Ionicons name="chevron-down" size={28} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={styles.mapHeaderTitle}>En camino al cliente</Text>
          </View>

          <Image source={{ uri: 'https://miro.medium.com/v2/resize:fit:1400/1*qYUvh-dpTfwv3E_XGu4_aQ.png' }} style={styles.fakeMapImage} resizeMode="cover" />

          <View style={styles.bottomSheet}>
            <TouchableOpacity style={styles.dragHandleArea} onPress={toggleSheet} activeOpacity={0.8}>
              <View style={styles.bottomSheetHandle} />
              <Ionicons name={isSheetExpanded ? "chevron-down" : "chevron-up"} size={20} color="#94A3B8" />
              <Text style={styles.dragText}>{isSheetExpanded ? "Ocultar detalles" : "Ver detalles del pedido"}</Text>
            </TouchableOpacity>

            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <Text style={styles.deliverToText}>Entregar a:</Text>
                <View style={styles.customerInfoRow}>
                  <View style={styles.customerTextContainer}>
                    <Text style={styles.customerNameLarge}>{selectedOrder.customerName}</Text>
                    <Text style={styles.customerAddressLarge} numberOfLines={isSheetExpanded ? undefined : 1}>{selectedOrder.address}</Text>
                  </View>
                  <TouchableOpacity style={styles.callCircleButton} onPress={() => handleCallCustomer(selectedOrder.customerPhone)}>
                    <Ionicons name="call" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {isSheetExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={styles.phoneBox}><Text style={styles.phoneText}>Tel: {selectedOrder.customerPhone}</Text></View>
                    <View style={[styles.paymentStateBox, selectedOrder.paymentMethod === 'Efectivo' && selectedOrder.paymentStatus === 'Pendiente' ? styles.paymentStatePending : styles.paymentStatePaid]}>
                      <Text style={styles.paymentStateLabel}>Pago:</Text>
                      <Text style={styles.paymentStateValue}>{paymentMethodLabel} · {paymentStatusLabel}</Text>
                    </View>
                    <View style={styles.mapProductsBox}>
                      <Text style={styles.mapProductsTitle}>Verifica que entregas:</Text>
                      {selectedOrder.items.map((prod: any, index: number) => (
                        <Text key={index} style={styles.mapProductText}>• {prod.quantity}x {prod.name}</Text>
                      ))}
                    </View>
                    {selectedOrder.paymentMethod === 'Efectivo' && selectedOrder.paymentStatus === 'Pendiente' && (
                      <TouchableOpacity style={styles.paymentReceivedButton} onPress={handleMarkPaymentReceived}>
                        <Text style={styles.paymentReceivedText}>Marcar efectivo recibido</Text>
                      </TouchableOpacity>
                    )}
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
    </>
  );
};