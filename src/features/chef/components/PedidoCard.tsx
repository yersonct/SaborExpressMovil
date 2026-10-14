import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { OrderDetailStatus } from "@/features/orders/types/order.types";
import { chefStyles } from "./style/ChefStyles";
import { useChefTheme } from "../context/ChefThemeContext";
import { useChefLanguage } from "../context/ChefLanguageContext";
import type { KitchenBatch } from "./ChefOrders";
import { formatColombiaTime } from "@/features/shared/utils/colombia-date";

const STATUS_COLOR: Partial<Record<OrderDetailStatus, string>> = {
  [OrderDetailStatus.Pending]: "#f97316",
  [OrderDetailStatus.InPreparation]: "#3b82f6",
  [OrderDetailStatus.Ready]: "#22c55e",
  [OrderDetailStatus.Delivered]: "#64748b",
};

const getElapsedLabel = (createdAt: string, t: ReturnType<typeof useChefLanguage>["t"]) => {
  const minutes = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / 60000,
  );
  if (minutes < 1) return t.justNow;
  if (minutes < 60) return t.minutesAgo(minutes);
  const hours = Math.floor(minutes / 60);
  return t.hoursAgo(hours);
};

interface PedidoCardProps {
  batch: KitchenBatch;
  onAvanzarEstado: (batch: KitchenBatch) => void;
  canUpdateStatus?: boolean;
}

export default function PedidoCard({
  batch,
  onAvanzarEstado,
  canUpdateStatus = true,
}: PedidoCardProps) {
  const { colors } = useChefTheme();
  const { language, t } = useChefLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  const buttonLabel = !canUpdateStatus
    ? undefined
    : batch.status === OrderDetailStatus.Pending
      ? t.startPrep
      : batch.status === OrderDetailStatus.InPreparation
        ? t.markReady
        : undefined;
  const statusLabel = batch.status === OrderDetailStatus.Pending
    ? t.status_Pendiente
    : batch.status === OrderDetailStatus.InPreparation
      ? t.status_EnPreparacion
      : batch.status === OrderDetailStatus.Ready
        ? t.statusReady
        : t.status_Entregado;
  const statusColor = STATUS_COLOR[batch.status] ?? colors.mutedText;

  const handleConfirmar = () => {
    onAvanzarEstado(batch);
    setModalVisible(false);
  };

  const isDelivered = batch.status === OrderDetailStatus.Delivered;

  const contenido = (
    <View
      style={[
        chefStyles.card,
        { backgroundColor: colors.background, borderColor: colors.border },
        isDelivered && { opacity: 0.55 },
      ]}
    >
      <View style={chefStyles.cardHeaderRow}>
        <View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {!batch.tableNumber && (
              <Ionicons name="bag-handle" size={14} color={colors.mutedText} />
            )}
            <Text style={[chefStyles.mesaBadge, { color: colors.text }]}>
              {batch.tableNumber
                ? `${t.tablePrefix} ${batch.tableNumber}`
                : batch.customerName || t.takeaway}
            </Text>
          </View>
          {!!batch.employeeName && (
            <Text style={[chefStyles.mesero, { color: colors.mutedText }]}>
              {t.waiterPrefix} {batch.employeeName}
            </Text>
          )}
          {batch.orderType === "Delivery" && (
            <Text
              style={[
                chefStyles.mesero,
                {
                  color: batch.assignedDeliveryPersonName
                    ? colors.mutedText
                    : "#EF4444",
                },
              ]}
            >
              🛵{" "}
              {batch.assignedDeliveryPersonName
                ? `${t.deliveryPersonPrefix} ${batch.assignedDeliveryPersonName}`
                : t.noDeliveryPerson}
            </Text>
          )}
        </View>
        <Text style={[chefStyles.infoValor, { color: colors.mutedText }]}>
          #{batch.orderId}
        </Text>
      </View>

      <View
        style={[
          chefStyles.estadoBadge,
          { backgroundColor: statusColor + "26" },
        ]}
      >
        <Text style={{ color: statusColor, fontSize: 12, fontWeight: "700" }}>
          {statusLabel}
        </Text>
      </View>

      {batch.awaitingCashierConfirmation && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
            padding: 10,
            marginBottom: 8,
            borderRadius: 10,
            backgroundColor: "#FEF3C7",
            borderWidth: 1,
            borderColor: "#FCD34D",
          }}
        >
          <Ionicons name="lock-closed" size={16} color="#92400E" />
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#78350F", fontSize: 12, fontWeight: "800" }}>
              {t.waitingCashierTitle}
            </Text>
            <Text style={{ color: "#78350F", fontSize: 11, marginTop: 2 }}>
              {t.waitingCashierDetail}
            </Text>
          </View>
        </View>
      )}

      <View style={chefStyles.tagTiempo}>
        <Ionicons name="time-outline" size={12} color={colors.mutedText} />
        <Text style={{ fontSize: 11, color: colors.mutedText }}>
          {formatColombiaTime(batch.createdAt, language === "en" ? "en-US" : language === "pt" ? "pt-BR" : language === "fr" ? "fr-FR" : "es-CO", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          · {getElapsedLabel(batch.createdAt, t)}
        </Text>
      </View>

      {batch.batchNumber > 1 && (
        <Text
          style={{
            color: "#F59E0B",
            fontSize: 12,
            fontWeight: "700",
            marginBottom: 6,
          }}
        >
          🔁 {t.tablePrefix} {batch.batchNumber} {t.batchAdded}
        </Text>
      )}

      <View style={chefStyles.menuList}>
        {batch.items.map((item, idx) => (
          <View key={item.id}>
            {idx > 0 && (
              <View
                style={[chefStyles.itemDivider, { backgroundColor: colors.border }]}
              />
            )}
            <View style={chefStyles.menuItemRow}>
              <View style={chefStyles.itemNombreRow}>
                <Text style={[chefStyles.cantidad, { color: colors.text }]}>
                  {item.quantity}x
                </Text>
                <Text style={[chefStyles.platillo, { color: colors.text }]}>
                  {item.productName}
                </Text>
              </View>
              {item.isToGo && (
                <Text
                  style={[
                    chefStyles.togoTag,
                    {
                      color: colors.accent ?? "#E61C24",
                      backgroundColor: (colors.accent ?? "#E61C24") + "1A",
                    },
                  ]}
                >
                  {t.takeaway}
                </Text>
              )}
            </View>
            {!!item.notes && (
              <Text style={[chefStyles.nota, { color: colors.mutedText }]}>
                {t.notePrefix} {item.notes}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <>
      {/* La tarjeta SOLO abre el modal, nunca cambia el estado */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
      >
        {contenido}
        {buttonLabel && (
          <View style={chefStyles.btnAccion}>
            <Text style={chefStyles.btnAccionText}>{buttonLabel} →</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={{
              width: "100%",
              maxWidth: 380,
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: "hidden",
            }}
            onPress={() => {}}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 17,
                    fontWeight: "700",
                  }}
                >
                  {batch.tableNumber
                    ? `${t.tablePrefix} ${batch.tableNumber}`
                    : batch.customerName || t.takeaway}
                </Text>
                <Text
                  style={{
                    color: colors.mutedText,
                    fontSize: 13,
                    marginTop: 2,
                  }}
                >
                  {t.orderPrefix} #{batch.orderId}
                </Text>
                <Text
                  style={{
                    color: colors.mutedText,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {formatColombiaTime(batch.createdAt, language === "en" ? "en-US" : language === "pt" ? "pt-BR" : language === "fr" ? "fr-FR" : "es-CO", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {getElapsedLabel(batch.createdAt, t)}
                </Text>
              </View>

              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <View
                  style={{
                    backgroundColor: statusColor + "26",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      color: statusColor,
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
                    {statusLabel}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={20} color={colors.mutedText} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ padding: 16, gap: 12 }}>
              {batch.awaitingCashierConfirmation && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: "#FEF3C7",
                  }}
                >
                  <Ionicons name="lock-closed" size={16} color="#92400E" />
                  <Text style={{ color: "#78350F", fontSize: 12, flex: 1 }}>
                    {t.waitingCashierNotice}
                  </Text>
                </View>
              )}
              {batch.items.map((item) => (
                <View key={item.id}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: colors.text, fontSize: 15 }}>
                      {item.quantity}x {item.productName}
                    </Text>
                    {item.isToGo && (
                      <Text
                        style={{
                          color: "#3b82f6",
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        {t.takeaway}
                      </Text>
                    )}
                  </View>
                  {!!item.notes && (
                    <Text
                      style={{
                        color: colors.mutedText,
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      {t.notePrefix} {item.notes}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {buttonLabel && (
              <View style={{ padding: 16, paddingTop: 4 }}>
                <TouchableOpacity
                  onPress={handleConfirmar}
                  style={{
                    backgroundColor: statusColor,
                    borderRadius: 10,
                    paddingVertical: 13,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}
                  >
                    {buttonLabel} →
                  </Text>
                </TouchableOpacity>
                <Text
                  style={{
                    color: colors.mutedText,
                    fontSize: 12,
                    textAlign: "center",
                    marginTop: 8,
                  }}
                >
                  {t.stateOnlyOnButton}
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
