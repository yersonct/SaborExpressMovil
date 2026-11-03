import { ScrollView, View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { getClientLocale } from "@/features/userPreferences/context/ClientPreferencesContext";
import { ClientCheckoutModal } from "./ClientCheckoutModal";
import { OrderTrackingModal } from "@/features/orders/components/OrderTrackingModal";
import type { ClientDashboardModel } from "./useClientDashboard";
export function ClientCartOverlays({ model }: { model: ClientDashboardModel }) {
const { styles, t, language, router, activeOrder, cart, trackingOrderId, setTrackingOrderId, branchUnavailable, radiusMsgs, cartModalVisible, setCartModalVisible, confirmItemModalVisible, setConfirmItemModalVisible, itemToConfirm, isCheckingOut, setIsCheckingOut, isUploadingReceipt, setIsUploadingReceipt, paymentMethod, setPaymentMethod, orderConfirmed, orderPaid, breakdown, totalCart, outOfRadius, radiusText, confirmAddToCart, removeFromCart, handleCloseCart, proceedToCheckout, handlePaymentNextStep, submitting, polling, handleStopWaiting, submitFinalOrder } = model;
return (<>{/* BOTÓN FLOTANTE CARRITO */}
        {cart.length > 0 && (
          <TouchableOpacity
            style={styles.floatingCartBtn}
            onPress={() => setCartModalVisible(true)}
          >
            <View style={styles.floatingCartLeft}>
              <View style={styles.floatingCartCount}>
                <Text style={styles.floatingCartCountText}>{cart.length}</Text>
              </View>
              <Text style={styles.floatingCartText}>{t("cart")}</Text>
            </View>
            <Text style={styles.floatingCartTotal}>
              ${totalCart.toLocaleString(getClientLocale(language))}
            </Text>
          </TouchableOpacity>
        )}

        {/* MODAL 1: CONFIRMAR PRODUCTO */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={confirmItemModalVisible}
          onRequestClose={() => setConfirmItemModalVisible(false)}
        >
          <View style={styles.confirmOverlay}>
            <ScrollView contentContainerStyle={{ alignItems: "center" }} style={styles.confirmBox}>
              <View style={styles.confirmImageCircle}>
                {itemToConfirm?.image ? (
                  <ExpoImage
                    source={{ uri: itemToConfirm.image }}
                    style={{ width: "100%", height: "100%", borderRadius: 999 }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={120}
                  />
                ) : (
                  <Text style={{ fontSize: 50 }}>🍽️</Text>
                )}
              </View>
              <Text style={styles.confirmTitle}>{t("addToCart")}</Text>
              <Text style={styles.confirmItemName}>{itemToConfirm?.name}</Text>
              <Text style={styles.confirmItemPrice}>
                $
                {itemToConfirm?.price.toLocaleString(getClientLocale(language))}
              </Text>
              <Text style={styles.confirmDesc}>{itemToConfirm?.desc}</Text>
              <View style={styles.confirmActionsRow}>
                <TouchableOpacity
                  style={styles.confirmCancelBtn}
                  onPress={() => setConfirmItemModalVisible(false)}
                >
                  <Text style={styles.confirmCancelText}>{t("cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmAcceptBtn}
                  onPress={confirmAddToCart}
                >
                  <Ionicons
                    name="cart"
                    size={18}
                    color="#FFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.confirmAcceptText}>{t("add")}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* 🔥 COMPONENTE SEPARADO: MODAL DE CHECKOUT */}
        <ClientCheckoutModal
          cartModalVisible={cartModalVisible}
          handleCloseCart={handleCloseCart}
          orderConfirmed={orderConfirmed}
          isUploadingReceipt={isUploadingReceipt}
          isCheckingOut={isCheckingOut}
          cart={cart}
          removeFromCart={removeFromCart}
        totalCart={totalCart}
          breakdown={breakdown}
          proceedToCheckout={proceedToCheckout}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          handlePaymentNextStep={handlePaymentNextStep}
          submitFinalOrder={submitFinalOrder}
          setIsUploadingReceipt={setIsUploadingReceipt}
          setIsCheckingOut={setIsCheckingOut}
          submitting={submitting}
          waitingPayment={polling}
          orderPaid={orderPaid}
          stopWaiting={handleStopWaiting}
          outOfRadius={outOfRadius}
          branchUnavailable={branchUnavailable}
          radiusTitle={radiusMsgs.radiusTitle}
          radiusText={radiusText}
        />
        <OrderTrackingModal
          visible={trackingOrderId === activeOrder?.order.id}
          order={trackingOrderId === activeOrder?.order.id ? activeOrder.order : null}
          onClose={() => setTrackingOrderId(null)}
          onRate={() => {
            setTrackingOrderId(null);
            router.push("/client/profile");
          }}
        />
      </>);
}
