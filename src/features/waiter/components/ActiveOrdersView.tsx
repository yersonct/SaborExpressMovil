import React, { useState } from 'react';
import { FlatList, Text, TouchableOpacity, View, LayoutAnimation, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './style/WaiterDashboardStyles';

export const ActiveOrdersView = ({ 
  activeOrders, 
  expandedOrderId, 
  setExpandedOrderId, 
  handleAddMoreToOrder, 
  handleCancelOrder,
  handleDeliverOrder 
}: any) => {

  // 🔥 1. ESTADOS PARA NUESTRO MODAL PERSONALIZADO
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'CANCEL' | 'DELIVER' | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Función para abrir el modal con el tipo específico
  const openModal = (type: 'CANCEL' | 'DELIVER', order: any) => {
    setModalType(type);
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  // Función para confirmar la acción
  const confirmAction = () => {
    if (modalType === 'CANCEL') {
      handleCancelOrder(selectedOrder);
    } else if (modalType === 'DELIVER') {
      handleDeliverOrder(selectedOrder);
    }
    setIsModalVisible(false);
    setSelectedOrder(null);
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
            <Text style={styles.emptyOrdersText}>No tienes órdenes activas.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isExpanded = expandedOrderId === item.id;
          const isReady = item.status === 'LISTO';
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
                  <View style={[styles.badgeStatus, isReady ? styles.badgeReady : styles.badgePrep]}>
                    <Text style={[styles.badgeStatusText, isReady ? styles.badgeReadyText : styles.badgePrepText]}>
                      {isReady ? '✅ Listo' : '👨‍🍳 Preparando'}
                    </Text>
                  </View>
                  <Text style={styles.expandText}>{isExpanded ? 'Ocultar' : 'Ver productos'}</Text>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.activeOrderDetails}>
                  <View style={styles.divider} />
                  {item.items.map((prod: any, idx: number) => (
                    <View key={idx} style={styles.orderItemRow}>
                      <View style={styles.orderItemMain}>
                        <Text style={styles.orderItemQty}>{prod.quantity}x</Text>
                        <View>
                          <Text style={styles.orderItemName}>{prod.name}</Text>
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                            {prod.isToGo ? <Text style={styles.badgeToGo}>🛍️ Empacar</Text> : <Text style={styles.badgeMesa}>🍽️ Mesa</Text>}
                            {prod.category === 'SOLO_PASAR' ? <Text style={styles.miniBadgeBarra}>🥤 Servir</Text> : <Text style={styles.miniBadgeCocina}>🔥 Cocina</Text>}
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}

                  <View style={styles.orderActions}>
                    <TouchableOpacity style={styles.actionAddBtn} onPress={() => handleAddMoreToOrder(item)}>
                      <Text style={styles.actionAddText}>+ Agregar productos</Text>
                    </TouchableOpacity>

                    {isReady && (
                      <TouchableOpacity style={styles.actionDeliverBtn} onPress={() => openModal('DELIVER', item)}>
                        <Text style={styles.actionDeliverText}>Entregado</Text>
                      </TouchableOpacity>
                    )}

                    {!isReady && (
                      <TouchableOpacity style={styles.actionCancelBtn} onPress={() => openModal('CANCEL', item)}>
                        <Text style={styles.actionCancelText}>Cancelar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* 🔥 2. AQUÍ ESTÁ EL MODAL PERSONALIZADO */}
      <Modal transparent visible={isModalVisible} animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.modalBox}>
            <View style={[modalStyles.iconCircle, modalType === 'CANCEL' ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#D1FAE5' }]}>
              <Ionicons 
                name={modalType === 'CANCEL' ? 'warning-outline' : 'checkmark-done-outline'} 
                size={32} 
                color={modalType === 'CANCEL' ? '#EF4444' : '#10B981'} 
              />
            </View>
            
            <Text style={modalStyles.title}>
              {modalType === 'CANCEL' ? '¿Cancelar Pedido?' : '¿Confirmar Entrega?'}
            </Text>
            <Text style={modalStyles.message}>
              {modalType === 'CANCEL' 
                ? `Estás a punto de anular el pedido de ${selectedOrder?.tableName}. Esta acción no se puede deshacer.`
                : `¿Estás seguro de que ya entregaste el pedido de ${selectedOrder?.tableName} al cliente?`}
            </Text>

            <View style={modalStyles.buttonContainer}>
              <TouchableOpacity style={modalStyles.cancelModalBtn} onPress={() => setIsModalVisible(false)} activeOpacity={0.8}>
                <Text style={modalStyles.cancelModalBtnText}>No, Volver</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[modalStyles.confirmModalBtn, modalType === 'CANCEL' ? { backgroundColor: '#EF4444' } : { backgroundColor: '#10B981' }]} 
                onPress={confirmAction}
                activeOpacity={0.8}
              >
                <Text style={modalStyles.confirmModalBtnText}>
                  {modalType === 'CANCEL' ? 'Sí, Cancelar' : 'Sí, Entregado'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// 🔥 3. ESTILOS EXCLUSIVOS PARA EL MODAL (Listos para lucir profesionales)
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelModalBtnText: {
    color: '#475569',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmModalBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});