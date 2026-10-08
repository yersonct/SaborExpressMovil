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
  handleCancelOrder,
}: any) => {
  const { t } = useWaiterLanguage();

  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [selectedOrderToCancel, setSelectedOrderToCancel] = useState<any>(null);

  const openCancelModal = (order: any) => {
    setSelectedOrderToCancel(order);
    setIsCancelModalVisible(true);
  };

  const confirmCancelAction = () => {
    if (selectedOrderToCancel) handleCancelOrder(selectedOrderToCancel);
    setIsCancelModalVisible(false);
    setSelectedOrderToCancel(null);
  };

  // Al presionar "Cancelar" siempre se anula el pedido COMPLETO — el backend
  // ya no lo permite si algo avanzó en cocina o si el pedido está pagado,
  // así que si el botón está habilitado, es porque el pedido todavía se
  // puede cancelar entero sin problema.
  const cancelMessage = (
    t.ordersCancelMessage ||
    "Estás a punto de anular el pedido de {tableName}. La mesa quedará libre. Esta acción no se puede deshacer."
  ).replace("{tableName}", selectedOrderToCancel?.tableName ?? "");
  
  const getElapsedLabel = (createdAt: string) => {
    const minutes = Math.floor(
      (Date.now() - new Date(createdAt).getTime()) / 60000,
    );
    if (minutes < 1) return "recién";
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `hace ${hours} h`;
  };
  return (
    <>
      <FlatList
        data={activeOrders}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.emptyOrders}>
            <Ionicons
              name="checkmark-circle-outline"
              size={60}
              color="#CBD5E1"
            />
            <Text style={styles.emptyOrdersText}>
              {t.ordersEmpty || "No tienes órdenes activas."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isExpanded = expandedOrderId === item.id;

          // Todo entregado (para el badge de arriba)
          const isFullyReady =
            item.items.length > 0 &&
            item.items.every((prod: any) => prod.isDelivered === true);

          // El botón "Sí, Entregado" solo se habilita si TODO lo que falta
          // por entregar ya está "Ready" (Listo) en cocina.
          const pendingItems = item.items.filter(
            (prod: any) => !prod.isDelivered,
          );
          const canDeliver =
            pendingItems.length > 0 &&
            pendingItems.every((prod: any) => prod.status === "Ready");

          // Solo se puede cancelar si: (1) el pedido NO está pagado, y
          // (2) TODOS los platos siguen "en espera" — basta con que UNO
          // ya esté en preparación/listo para bloquear la cancelación
          // completa (así coincide exactamente con la regla del backend).
          const canCancel =
            !item.isFullyPaid &&
            pendingItems.length > 0 &&
            pendingItems.every((prod: any) => prod.status === "Pending");

          return (
            <View style={styles.activeOrderCard}>
              <TouchableOpacity
                style={styles.activeOrderHeader}
                activeOpacity={0.8}
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  );
                  setExpandedOrderId(isExpanded ? null : item.id);
                }}
              >
                <View>
                  <Text style={styles.orderIdText}>{item.id}</Text>
                  <Text style={styles.orderTableText}>{item.tableName}</Text>
                  <Text style={styles.orderTimeText}>
                    ⌚ {item.time} · {getElapsedLabel(item.createdAt)}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <View
                    style={[
                      styles.badgeStatus,
                      isFullyReady ? styles.badgeReady : styles.badgePrep,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeStatusText,
                        isFullyReady
                          ? styles.badgeReadyText
                          : styles.badgePrepText,
                      ]}
                    >
                      {isFullyReady
                        ? `✅ ${t.ordersReady || "Todo Entregado"}`
                        : `👨‍🍳 ${t.ordersPreparing || "Preparando"}`}
                    </Text>
                  </View>
                  <Text style={styles.expandText}>
                    {isExpanded
                      ? t.ordersHide || "Ocultar"
                      : t.ordersShowProducts || "Ver productos"}
                  </Text>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.activeOrderDetails}>
                  <View style={styles.divider} />
                  {item.items.map((prod: any, idx: number) => (
                    <View
                      key={idx}
                      style={[
                        styles.orderItemRow,
                        prod.isDelivered && { opacity: 0.6 },
                      ]}
                    >
                      <View style={styles.orderItemMain}>
                        {/* 🔥 CHECKMARK VERDE SI YA FUE ENTREGADO, SINO MUESTRA LA CANTIDAD NORMAL */}
                        <View style={{ width: 35, alignItems: "center" }}>
                          {prod.isDelivered ? (
                            <Ionicons
                              name="checkmark-circle"
                              size={24}
                              color="#10B981"
                            />
                          ) : (
                            <Text
                              style={[
                                styles.orderItemQty,
                                { color: "#E61C24" },
                              ]}
                            >
                              {prod.quantity}x
                            </Text>
                          )}
                        </View>

                        <View style={{ flex: 1, marginLeft: 5 }}>
                          <Text
                            style={[
                              styles.orderItemName,
                              prod.isDelivered && {
                                textDecorationLine: "line-through",
                                color: "#94A3B8",
                              },
                            ]}
                          >
                            {prod.name}
                          </Text>
                          {!!prod.note && (
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#0F766E",
                                fontWeight: "600",
                                marginTop: 3,
                                lineHeight: 16,
                              }}
                            >
                              📝 {prod.note}
                            </Text>
                          )}
                          <View
                            style={{
                              flexDirection: "row",
                              gap: 6,
                              marginTop: 4,
                              flexWrap: "wrap",
                            }}
                          >
                            {prod.isToGo ? (
                              <Text style={styles.badgeToGo}>
                                🛍️ {t.dashboardParaLlevar || "Para Llevar"}
                              </Text>
                            ) : (
                              <Text style={styles.badgeMesa}>
                                🍽️ {t.dashboardTabTables || "Mesa"}
                              </Text>
                            )}
                            {!prod.isDelivered && (
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontWeight: "700",
                                  paddingHorizontal: 8,
                                  paddingVertical: 3,
                                  borderRadius: 8,
                                  overflow: "hidden",
                                  color:
                                    prod.status === "Ready"
                                      ? "#065F46"
                                      : prod.status === "InPreparation"
                                        ? "#1D4ED8"
                                        : "#92400E",
                                  backgroundColor:
                                    prod.status === "Ready"
                                      ? "#D1FAE5"
                                      : prod.status === "InPreparation"
                                        ? "#DBEAFE"
                                        : "#FEF3C7",
                                }}
                              >
                                {prod.status === "Ready"
                                  ? "✅ Listo en cocina"
                                  : prod.status === "InPreparation"
                                    ? "🔥 Preparando"
                                    : "⏳ En espera"}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}

                  <View style={localStyles.actionsContainer}>
                    {!item.isFullyPaid && (
                      <TouchableOpacity
                        style={localStyles.addMoreBtn}
                        onPress={() => handleAddMoreToOrder(item)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="add-circle-outline"
                          size={20}
                          color="#475569"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={localStyles.addMoreBtnText}>
                          {t.ordersAddMore || "Agregar productos a la mesa"}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* 🔥 SOLO MOSTRAR SI FALTAN PRODUCTOS POR ENTREGAR */}
                    {!isFullyReady && (
                      <View style={localStyles.decisionRow}>
                        {canCancel && (
                          <TouchableOpacity
                            style={localStyles.cancelBtn}
                            onPress={() => openCancelModal(item)}
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name="close-circle-outline"
                              size={22}
                              color="#EF4444"
                              style={{ marginRight: 6 }}
                            />
                            <Text style={localStyles.cancelBtnText}>
                              {t.ordersCancel || "Cancelar"}
                            </Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={[
                            localStyles.confirmBtn,
                            !canDeliver && { opacity: 0.4 },
                            !canCancel && { flex: 1 },
                          ]}
                          onPress={() => canDeliver && handleMarkOrderReady(item)}
                          activeOpacity={canDeliver ? 0.8 : 1}
                          disabled={!canDeliver}
                        >
                          <Ionicons
                            name="checkmark-done-circle-outline"
                            size={22}
                            color="#FFFFFF"
                            style={{ marginRight: 6 }}
                          />
                          <Text style={localStyles.confirmBtnText}>
                            {canDeliver
                              ? t.ordersDeliverYes || "Sí, Entregado"
                              : "Esperando a cocina..."}
                          </Text>
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
              {t.ordersCancelTitle || "¿Cancelar Pedido?"}
            </Text>
            <Text style={modalStyles.message}>{cancelMessage}</Text>

            <View style={modalStyles.buttonContainer}>
              <TouchableOpacity
                style={modalStyles.cancelModalBtn}
                onPress={() => setIsCancelModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={modalStyles.cancelModalBtnText}>
                  {t.ordersCancelNo || "No, Volver"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={modalStyles.confirmModalBtn}
                onPress={confirmCancelAction}
                activeOpacity={0.8}
              >
                <Text style={modalStyles.confirmModalBtnText}>
                  {t.ordersCancelYes || "Sí, Cancelar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// styles moved to ./style/ActiveOrdersStyles.ts