import React, { useState } from 'react';
import { FlatList, Text, TouchableOpacity, View, LayoutAnimation, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './style/WaiterDashboardStyles';
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

  const openCancelModal = (order: any) => {
    setSelectedOrderToCancel(order);
    setIsCancelModalVisible(true);
  };

  const confirmCancelAction = () => {
    if (selectedOrderToCancel) {
      handleCancelOrder(selectedOrderToCancel);
    }
    setIsCancelModalVisible(false);
    setSelectedOrderToCancel(null);
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
                            {prod.isToGo ? <Text style={styles.badgeToGo}>🛍️ Empacar</Text> : <Text style={styles.badgeMesa}>🍽️ Mesa</Text>}
                            {prod.category === 'SOLO_PASAR' ? <Text style={styles.miniBadgeBarra}>🥤 Servir</Text> : <Text style={styles.miniBadgeCocina}>🔥 Cocina</Text>}
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
                          <Text style={localStyles.confirmBtnText}>Confirmar Salida</Text>
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
            
            <Text style={modalStyles.title}>
              {t.ordersCancelTitle || '¿Cancelar Pedido?'}
            </Text>
            <Text style={modalStyles.message}>
              {t.ordersCancelMessage || `Estás a punto de anular el pedido de ${selectedOrderToCancel?.tableName}. La mesa quedará libre. Esta acción no se puede deshacer.`}
            </Text>

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

const localStyles = StyleSheet.create({
  actionsContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  addMoreBtn: {
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  addMoreBtnText: {
    color: '#475569',
    fontWeight: 'bold',
    fontSize: 15,
  },
  decisionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelBtn: {
    flex: 0.8, 
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelBtnText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 15,
  },
  confirmBtn: {
    flex: 1.2, 
    backgroundColor: '#10B981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 10 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16, backgroundColor: '#FEE2E2' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  buttonContainer: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelModalBtn: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelModalBtnText: { color: '#475569', fontWeight: 'bold', fontSize: 16 },
  confirmModalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#EF4444' },
  confirmModalBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});