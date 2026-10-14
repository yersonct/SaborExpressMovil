import React, { useState } from 'react';
import { FlatList, Text, TouchableOpacity, View, LayoutAnimation, Modal, Platform, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './style/WaiterDashboardStyles';
import { localStyles, modalStyles } from './style/ActiveOrdersStyles';
import { useWaiterLanguage } from '@/features/waiter/context/WaiterLanguageContext';
import { useWaiterTheme } from '@/features/waiter/context/WaiterThemeContext';
import { OrderType } from '@/features/orders/types/order.types';
import { BreakdownRows } from "@/features/orders/components/BreakdownRows";

export const ActiveOrdersView = ({
  activeOrders,
  expandedOrderId,
  setExpandedOrderId,
  handleAddMoreToOrder,
  handleMarkOrderReady,
  handleCancelOrder,
}: any) => {
  const { t } = useWaiterLanguage();
  const { colors } = useWaiterTheme();

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
    if (minutes < 1) return t.elapsedJustNow;
    if (minutes < 60) return t.elapsedMinutes.replace("{count}", String(minutes));
    const hours = Math.floor(minutes / 60);
    return t.elapsedHours.replace("{count}", String(hours));
  };
  return (
    <>
      <FlatList
        data={activeOrders}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.emptyOrders}>
            <Ionicons
              name="checkmark-circle-outline"
              size={60}
              color={colors.mutedText}
            />
            <Text style={[styles.emptyOrdersText, { color: colors.mutedText }]}>
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
            <View style={[styles.activeOrderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.orderIdText, { color: colors.mutedText }]}>{item.id}</Text>
                  <Text style={[styles.orderTableText, { color: colors.text }]}>{item.tableName}</Text>
                  {item.orderType === OrderType.ToGo && (
                    <Text
                      style={[
                        styles.badgeToGo,
                        {
                          backgroundColor: colors.accentSoft,
                          color: colors.accent,
                          alignSelf: 'flex-start',
                          marginBottom: 4,
                        },
                      ]}
                    >
                      🛍️ {t.dashboardParaLlevar || 'Para Llevar'}
                    </Text>
                  )}
                  <Text style={[styles.orderTimeText, { color: colors.mutedText }]}>
                    ⌚ {item.time} · {getElapsedLabel(item.createdAt)}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <View
                    style={[
                      styles.badgeStatus,
                      isFullyReady ? styles.badgeReady : styles.badgePrep,
                      { backgroundColor: isFullyReady ? `${colors.success}22` : `${colors.warning}22` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeStatusText,
                        isFullyReady
                          ? [styles.badgeReadyText, { color: colors.success }]
                          : [styles.badgePrepText, { color: colors.warning }],
                      ]}
                    >
                      {isFullyReady
                        ? `✅ ${t.ordersReady || "Todo Entregado"}`
                        : `👨‍🍳 ${t.ordersPreparing || "Preparando"}`}
                    </Text>
                  </View>
                  <Text style={[styles.expandText, { color: colors.accent }]}>
                    {isExpanded
                      ? t.ordersHide || "Ocultar"
                      : t.ordersShowProducts || "Ver productos"}
                  </Text>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.activeOrderDetails}>
                  <View style={[styles.divider, { backgroundColor: colors.divider }]} />
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
                              color={colors.success}
                            />
                          ) : (
                            <Text
                              style={[
                                styles.orderItemQty,
                                { color: colors.accent },
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
                              { color: colors.text },
                              prod.isDelivered && {
                                textDecorationLine: "line-through",
                                color: colors.mutedText,
                              },
                            ]}
                          >
                            {prod.name}
                          </Text>
                          {!!prod.note && (
                            <Text
                              style={{
                                fontSize: 12,
                                color: colors.success,
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
                              <Text style={[styles.badgeToGo, { backgroundColor: colors.accentSoft, color: colors.accent }]}>
                                🛍️ {t.dashboardParaLlevar || "Para Llevar"}
                              </Text>
                            ) : (
                              <Text style={[styles.badgeMesa, { backgroundColor: colors.elevatedSurface, color: colors.mutedText }]}>
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
                                  color: prod.status === "Ready"
                                    ? colors.success
                                    : prod.status === "InPreparation"
                                      ? colors.accent
                                      : colors.warning,
                                  backgroundColor: prod.status === "Ready"
                                    ? `${colors.success}22`
                                    : prod.status === "InPreparation"
                                      ? `${colors.accent}22`
                                      : `${colors.warning}22`,
                                }}
                              >
                                {prod.status === "Ready"
                                  ? `✅ ${t.orderReadyInKitchen}`
                                  : prod.status === "InPreparation"
                                    ? `🔥 ${t.ordersPreparing}`
                                    : `⏳ ${t.orderWaiting}`}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}

<View style={{ marginTop: 10 }}>
                    <BreakdownRows
                      subTotal={item.subTotal}
                      tax={item.tax}
                      taxRate={item.taxRate}
                      taxIncludedInPrice={item.taxIncludedInPrice}
                      deliveryFee={0}
                      lang={t.language}
                      textColor={colors.text}
                      mutedColor={colors.mutedText}
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: colors.text, fontWeight: '800' }}>Total</Text>
                      <Text style={{ color: colors.accent, fontWeight: '800' }}>
                        ${Math.round(item.total).toLocaleString('es-CO')}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      localStyles.actionsContainer,
                      { borderTopColor: colors.border },
                    ]}
                  >
                    {!item.isFullyPaid && (
                      <TouchableOpacity
                      style={[localStyles.addMoreBtn, { backgroundColor: colors.elevatedSurface, borderColor: colors.border }]}
                        onPress={() => handleAddMoreToOrder(item)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="add-circle-outline"
                          size={20}
                          color={colors.mutedText}
                          style={{ marginRight: 8 }}
                        />
                        <Text style={[localStyles.addMoreBtnText, { color: colors.text }]}>
                          {t.ordersAddMore || "Agregar productos a la mesa"}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* 🔥 SOLO MOSTRAR SI FALTAN PRODUCTOS POR ENTREGAR */}
                    {!isFullyReady && (
                      <View style={localStyles.decisionRow}>
                        {canCancel && (
                          <TouchableOpacity
                            style={[localStyles.cancelBtn, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}
                            onPress={() => openCancelModal(item)}
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name="close-circle-outline"
                              size={22}
                              color={colors.danger}
                              style={{ marginRight: 6 }}
                            />
                            <Text style={[localStyles.cancelBtnText, { color: colors.danger }]}>
                              {t.ordersCancel || "Cancelar"}
                            </Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={[
                            localStyles.confirmBtn,
                            { flex: 1, minWidth: 0, backgroundColor: colors.success, shadowColor: colors.success },
                            !canDeliver && { opacity: 0.4 },
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
                          <Text
                            style={[localStyles.confirmBtnText, { flexShrink: 1 }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.75}
                          >
                            {canDeliver
                              ? t.ordersDeliverYes || "Sí, Entregado"
                              : t.orderPreparingShort}
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
          <View style={[modalStyles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={[modalStyles.iconCircle, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="warning-outline" size={32} color={colors.danger} />
            </View>

            <Text style={[modalStyles.title, { color: colors.text }]}>
              {t.ordersCancelTitle || "¿Cancelar Pedido?"}
            </Text>
            <Text style={[modalStyles.message, { color: colors.mutedText }]}>{cancelMessage}</Text>

            <View style={modalStyles.buttonContainer}>
              <TouchableOpacity
                style={[modalStyles.cancelModalBtn, { backgroundColor: colors.elevatedSurface }]}
                onPress={() => setIsCancelModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={[modalStyles.cancelModalBtnText, { color: colors.text }]}>
                  {t.ordersCancelNo || "No, Volver"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[modalStyles.confirmModalBtn, { backgroundColor: colors.danger }]}
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
