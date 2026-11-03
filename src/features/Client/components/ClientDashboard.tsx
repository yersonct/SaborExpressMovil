import { View, Text, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CancelOrderButton } from "@/features/orders/components/CancelOrderButton";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { DeliveryStatus } from "@/features/delivery/types/delivery.types";
import { useClientDashboard } from "./useClientDashboard";
import { ClientDeliveryOptions } from "./ClientDeliveryOptions";
import { ClientCatalog } from "./ClientCatalog";
import { ClientCartOverlays } from "./ClientCartOverlays";
export default function ClientDashboard() {
const model = useClientDashboard();
const { styles, colors, t, activeOrder, refetchActiveOrder, customerDisplayName, cart, setTrackingOrderId, setCartModalVisible, toastAnim, toastMessage } = model;
return (
      <SafeAreaView style={styles.container}>
        {/* TOAST ANIMADO */}
        <Animated.View
          style={[
            styles.toastContainer,
            { transform: [{ translateY: toastAnim }] },
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.greeting} numberOfLines={1}>
                {customerDisplayName}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <NotificationBell />
            <TouchableOpacity
              style={styles.cartButtonHeader}
              onPress={() => setCartModalVisible(true)}
            >
              <Ionicons name="cart" size={24} color={colors.text} />
              {cart.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cart.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ClientDeliveryOptions model={model} />
{/* PEDIDO EN CURSO */}
        {activeOrder && (
          <View
            style={{
              marginHorizontal: 16,
              marginVertical: 8,
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 8,
            }}
          >
            <Text style={{ fontWeight: "700", color: colors.text }}>
              {t("orderNumber")} #{activeOrder.order.id} ·{" "}
              {activeOrder.step === 1
                ? t("preparing")
                : activeOrder.step === 2
                  ? t("onTheWay")
                  : t("delivered")}
            </Text>
            <CancelOrderButton
              order={activeOrder.order}
              onCancelled={refetchActiveOrder}
            />
            {activeOrder.delivery?.status === DeliveryStatus.InTransit && (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setTrackingOrderId(activeOrder.order.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 4,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: "#2563EB",
                }}
              >
                <Ionicons name="map-outline" size={18} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>
                  {t("trackDriverMap")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        <ClientCatalog model={model} />
<ClientCartOverlays model={model} />
</SafeAreaView>
    );
}
