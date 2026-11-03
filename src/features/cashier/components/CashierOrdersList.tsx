import { Ionicons } from "@expo/vector-icons";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { Order } from "./CashierData";
import { styles } from "../style/CashierStyles";
import type { CashierOrdersModel } from "./cashier-orders-model";

export function CashierOrdersList({model}:{model:CashierOrdersModel}){
const { orders, filterType, t, colors, showAllOrders, setShowAllOrders, openPaymentModal }=model;
  const renderOrder = ({ item }: { item: Order }) => {
    if (item.status === "pagado") return null;
    const isMesa = item.type === "mesa";

    const orderTitle = isMesa
      ? t.orderTable.replace("{table}", String(item.table || ""))
      : t.orderTakeaway;

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card },
          isMesa ? styles.cardMesa : styles.cardLlevar,
        ]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t.viewOrderDetails}
          activeOpacity={0.75}
          onPress={() => void openPaymentModal(item)}
        >
        <View style={styles.cardHeader}>
          <Text
            style={[styles.orderId, { color: colors.muted }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.id} • {item.time}
          </Text>
          <Text
            style={[styles.orderTotal, { color: colors.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            ${item.total.toLocaleString("es-CO")}
          </Text>
        </View>
        <Text
          style={[styles.orderTitle, { color: colors.text }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {orderTitle}
          {!isMesa && item.customerName ? ` — ${item.customerName}` : ""}
        </Text>
        {!!item.employeeName && (
          <Text
            style={{
              fontSize: 11,
              color: colors.muted,
              marginTop: -4,
              marginBottom: 4,
            }}
          >
            {t.takenBy.replace("{name}", item.employeeName)}
          </Text>
        )}

        <View style={{ marginBottom: 4 }}>
          {item.items
            .split("\n")
            .filter(Boolean)
            .slice(0, 4)
            .map((line: string, idx: number) => (
              <Text
                key={idx}
                style={[styles.orderItemsPreview, { color: colors.muted }]}
                numberOfLines={1}
              >
                • {line}
              </Text>
            ))}
          {(() => {
            const totalLines = item.items.split("\n").filter(Boolean).length;
            const remaining = totalLines - 4;
            if (remaining <= 0) return null;
            return (
              <Text
                style={[
                  styles.orderItemsPreview,
                  { color: colors.muted, fontStyle: "italic" },
                ]}
              >
                {t.moreProducts.replace("{count}", String(remaining))}
              </Text>
            );
          })()}
        </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.payButton}
          onPress={() => openPaymentModal(item)}
        >
          <Text style={styles.payButtonText}>{t.btnCharge}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const displayData = orders.filter(
    (o: Order) => o.type === filterType && o.status !== "pagado",
  );
  const ORDERS_PAGE_SIZE = 8;
  const visibleOrders = showAllOrders
    ? displayData
    : displayData.slice(0, ORDERS_PAGE_SIZE);
  const emptyText = filterType === "mesa" ? t.emptyTables : t.emptyOthers;

return (<>
      <FlatList
        data={visibleOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.listPadding}
        ListFooterComponent={
          displayData.length > ORDERS_PAGE_SIZE ? (
            <TouchableOpacity
              style={styles.showOrdersButton}
              activeOpacity={0.75}
              onPress={() => setShowAllOrders((current) => !current)}
              accessibilityRole="button"
            >
              <Text style={styles.showOrdersButtonText}>
                {showAllOrders ? t.showLessOrders : t.showMoreOrders}
              </Text>
              <Ionicons
                name={showAllOrders ? "chevron-up" : "chevron-down"}
                size={18}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            {emptyText}
          </Text>
        }
      />
</>);
}
