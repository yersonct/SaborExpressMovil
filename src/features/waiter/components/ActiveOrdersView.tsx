import React, { useState } from 'react';
import { FlatList, Text, TouchableOpacity, View, LayoutAnimation, Modal, Platform, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './style/WaiterDashboardStyles';
import { localStyles, modalStyles } from './style/ActiveOrdersStyles';
import { useWaiterLanguage } from '@/features/waiter/context/WaiterLanguageContext';

export const ActiveOrdersView = ({
  activeOrders,
  expandedOrderId,
  setExpandedOrderId,
  handleAddMoreToOrder,
  handleMarkOrderReady,
  handleCancelOrder
}: any) => {
  const { t } = useWaiterLanguage();

  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [selectedOrderToCancel, setSelectedOrderToCancel] = useState<any>(null);
  const [cancelPin, setCancelPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const openCancelModal = (order: any) => {
    setSelectedOrderToCancel(order);
    setCancelPin('');
    setShowPin(false);
    setIsCancelModalVisible(true);
  };

  const confirmCancelAction = () => {
    // validate PIN stored in localStorage
    try {
      const stored = globalThis.localStorage?.getItem('saborexpress-waiter-profile');
      const profile = stored ? JSON.parse(stored) : null;
      const expectedPin = profile?.pin ?? null;
      if (!expectedPin) {
        // no pin set, allow cancellation
        if (selectedOrderToCancel) handleCancelOrder(selectedOrderToCancel);
      } else {
        if (cancelPin === expectedPin) {
          if (selectedOrderToCancel) handleCancelOrder(selectedOrderToCancel);
        } else {
          Alert.alert(t.orderCancelPinInvalidTitle || 'PIN incorrecto', t.orderCancelPinInvalidMessage || 'El PIN ingresado no es correcto.');
          return;
        }
      }
    } catch (e) {
      if (selectedOrderToCancel) handleCancelOrder(selectedOrderToCancel);
    }
    setIsCancelModalVisible(false);
    setSelectedOrderToCancel(null);
    setCancelPin('');
  };

  return (
    <>
      <FlatList
        data={activeOrders}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.emptyOrders}>
            <Ionicons name="checkmark-circle-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyOrdersText}>{t.ordersEmpty || 'No tienes órdenes activas.'}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isExpanded = expandedOrderId === item.id;

          // 🔥 LÓGICA CLAVE: La orden está completamente lista SOLO si TODO lo que hay adentro ya se entregó
          // (Asumimos que si no tiene la propiedad isDelivered, es nuevo y aún no sale)
          const isFullyReady = item.items.length > 0 && item.items.every((prod: any) => prod.isDelivered === true);

          return (
            <View style={styles.activeOrderCard}>
              <TouchableOpacity
                style={styles.activeOrderHeader}
                activeOpacity={0.8}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setExpandedOrderId(isExpanded ? null : item.id);
                }}
              >
                <View>
                  <Text style={styles.orderIdText}>{item.id}</Text>
                  <Text style={styles.orderTableText}>{item.tableName}</Text>
                  <Text style={styles.orderTimeText}>⌚ {item.time}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={[styles.badgeStatus, isFullyReady ? styles.badgeReady : styles.badgePrep]}>
                    <Text style={[styles.badgeStatusText, isFullyReady ? styles.badgeReadyText : styles.badgePrepText]}>
                      {isFullyReady ? `✅ ${t.ordersReady || 'Todo Entregado'}` : `👨‍🍳 ${t.ordersPreparing || 'Preparando'}`}
                    </Text>
                  </View>
                  <Text style={styles.expandText}>{isExpanded ? (t.ordersHide || 'Ocultar') : (t.ordersShowProducts || 'Ver productos')}</Text>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.activeOrderDetails}>
                  <View style={styles.divider} />
                  {item.items.map((prod: any, idx: number) => (
                    <View key={idx} style={[styles.orderItemRow, prod.isDelivered && { opacity: 0.6 }]}>
                      <View style={styles.orderItemMain}>

                        {/* 🔥 CHECKMARK VERDE SI YA FUE ENTREGADO, SINO MUESTRA LA CANTIDAD NORMAL */}
                        <View style={{ width: 35, alignItems: 'center' }}>
                          {prod.isDelivered ? (
                            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                          ) : (
                            <Text style={[styles.orderItemQty, { color: '#E61C24' }]}>{prod.quantity}x</Text>
                          )}
                        </View>

                        <View style={{ flex: 1, marginLeft: 5 }}>
                          <Text style={[styles.orderItemName, prod.isDelivered && { textDecorationLine: 'line-through', color: '#94A3B8' }]}>
                            {prod.name}
                          </Text>
                          {!!prod.note && <Text style={{ fontSize: 12, color: '#0F766E', fontWeight: '600', marginTop: 3, lineHeight: 16 }}>📝 {prod.note}</Text>}
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                            {prod.isToGo ? <Text style={styles.badgeToGo}>🛍️ {t.dashboardParaLlevar || 'Para Llevar'}</Text> : <Text style={styles.badgeMesa}>🍽️ {t.dashboardTabTables || 'Mesa'}</Text>}
                            {prod.category === 'SOLO_PASAR' ? <Text style={styles.miniBadgeBarra}>🥤 {t.ordersShowProducts || 'Servir'}</Text> : <Text style={styles.miniBadgeCocina}>🔥 {t.ordersPreparing || 'Cocina'}</Text>}
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}

                  <View style={localStyles.actionsContainer}>
                    <TouchableOpacity
                      style={localStyles.addMoreBtn}
                      onPress={() => handleAddMoreToOrder(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add-circle-outline" size={20} color="#475569" style={{ marginRight: 8 }} />
                      <Text style={localStyles.addMoreBtnText}>{t.ordersAddMore || 'Agregar productos a la mesa'}</Text>
                    </TouchableOpacity>

                    {/* 🔥 SOLO MOSTRAR SI FALTAN PRODUCTOS POR ENTREGAR */}
                    {!isFullyReady && (
                      <View style={localStyles.decisionRow}>

                        <TouchableOpacity
                          style={localStyles.cancelBtn}
                          onPress={() => openCancelModal(item)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="close-circle-outline" size={22} color="#EF4444" style={{ marginRight: 6 }} />
                          <Text style={localStyles.cancelBtnText}>{t.ordersCancel || 'Cancelar'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={localStyles.confirmBtn}
                          // Pasamos la orden completa para que tu función marque los items como entregados
                          onPress={() => {
                            // Simulamos marcar los productos como listos antes de llamar al padre
                            const updatedOrder = {
                              ...item,
                              items: item.items.map((i: any) => ({ ...i, isDelivered: true }))
                            };
                            handleMarkOrderReady(updatedOrder);
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="checkmark-done-circle-outline" size={22} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={localStyles.confirmBtnText}>{t.ordersDeliverYes || 'Sí, Entregado'}</Text>
                        </TouchableOpacity>

                      </View>
                    )}
                  </View>

                </View>
              )}
            </View>
          );
        }}
      />

      <Modal transparent visible={isCancelModalVisible} animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.modalBox}>
            <View style={modalStyles.iconCircle}>
              <Ionicons name="warning-outline" size={32} color="#EF4444" />
            </View>

            <Text style={modalStyles.title}>{t.ordersCancelTitle || '¿Cancelar Pedido?'}</Text>
            <Text style={modalStyles.message}>
              {t.ordersCancelMessage || `Estás a punto de anular el pedido de ${selectedOrderToCancel?.tableName}. La mesa quedará libre. Esta acción no se puede deshacer.`}
            </Text>

            <View style={{ marginTop: 12 }}>
              <Text style={{ marginBottom: 8, color: '#64748B' }}>{t.orderCancelPinPrompt || 'Ingresa tu PIN de autorización'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <TextInput
                  value={cancelPin}
                  onChangeText={setCancelPin}
                  placeholder={t.orderCancelPinPlaceholder || 'PIN (4 dígitos)'}
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPin}
                  keyboardType="numeric"
                  maxLength={4}
                  style={{ flex: 1, paddingVertical: 10 }}
                />
                <TouchableOpacity onPress={() => setShowPin(!showPin)} style={{ padding: 8 }}>
                  <Ionicons name={showPin ? 'eye-off' : 'eye'} size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={modalStyles.buttonContainer}>
              <TouchableOpacity style={modalStyles.cancelModalBtn} onPress={() => setIsCancelModalVisible(false)} activeOpacity={0.8}>
                <Text style={modalStyles.cancelModalBtnText}>{t.ordersCancelNo || 'No, Volver'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={modalStyles.confirmModalBtn} onPress={confirmCancelAction} activeOpacity={0.8}>
                <Text style={modalStyles.confirmModalBtnText}>{t.ordersCancelYes || 'Sí, Cancelar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// styles moved to ./style/ActiveOrdersStyles.ts