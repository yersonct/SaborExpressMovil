import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  LayoutAnimation,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { styles } from './style/ClientStyles';

export const ClientCheckoutModal = ({
  cartModalVisible,
  handleCloseCart,
  orderConfirmed,
  isUploadingReceipt,
  isCheckingOut,
  cart,
  removeFromCart,
  totalCart,
  proceedToCheckout,
  paymentMethod,
  setPaymentMethod,
  handlePaymentNextStep,
  receiptUploaded,
  setReceiptUploaded,
  handleFakeUploadReceipt,
  submitFinalOrder,
  setIsUploadingReceipt,
  setIsCheckingOut,
  submitting,
  waitingPayment,
  stopWaiting,
  orderPaid,
}: any) => {

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={cartModalVisible}
      onRequestClose={handleCloseCart}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalBox,
            (isCheckingOut || isUploadingReceipt) && { minHeight: "65%" },
          ]}
        >
          {orderConfirmed ? (
            // 4. PANTALLA DE ÉXITO
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={90} color="#10B981" />
              <Text style={styles.successTitle}>
                {orderPaid ? "¡Pago confirmado!" : "¡Pedido Recibido!"}
              </Text>
              <Text style={styles.successText}>
                {orderPaid
                  ? "Recibimos tu pago y tu pedido ya está en preparación. Te avisaremos cuando salga hacia tu dirección."
                  : "Tu pedido está pendiente de confirmación en la sede. Te avisaremos cuando esté en camino."}
              </Text>
              <View style={styles.successDivider} />
              <Text style={styles.successNote}>
                Sigue el estado de tu pedido en "Mi Perfil".
              </Text>
            </View>
          ) : isUploadingReceipt ? (
            // 3. PANTALLA DE CONFIRMACIÓN O COMPROBANTE DE PAGO
            <>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => {
                    setIsUploadingReceipt(false);
                    setIsCheckingOut(true);
                  }}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={26} color="#1E293B" />
                </TouchableOpacity>
                <Text
                  style={[styles.modalTitle, { flex: 1, textAlign: "center" }]}
                >
                  Confirmación
                </Text>
                <TouchableOpacity
                  onPress={handleCloseCart}
                  style={{ width: 26, alignItems: "flex-end" }}
                >
                  <Ionicons name="close" size={28} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {paymentMethod === "wompi" ? (
                  <View style={styles.bankInfoBox}>
                    <Ionicons
                      name="card"
                      size={32}
                      color="#1E293B"
                      style={{ marginBottom: 10 }}
                    />
                    <Text style={styles.bankInfoText}>
                      Monto a pagar con Wompi:
                    </Text>
                    <Text style={styles.bankInfoTotal}>
                      ${totalCart.toLocaleString("es-CO")}
                    </Text>
                    <Text
                      style={[
                        styles.bankInfoText,
                        { marginTop: 15, textAlign: "center", fontSize: 13 },
                      ]}
                    >
                      Se abrirá la pasarela segura de Wompi (Nequi, tarjeta,
                      PSE). Al terminar, vuelve a esta app: confirmaremos tu
                      pago automáticamente.
                    </Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.bankInfoBox,
                      {
                        backgroundColor: "#ECFDF5",
                        borderColor: "#10B981",
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name="cash"
                      size={40}
                      color="#10B981"
                      style={{ marginBottom: 10 }}
                    />
                    <Text style={[styles.bankInfoText, { color: "#065F46" }]}>
                      Pago en Efectivo (Contra entrega):
                    </Text>
                    <Text style={[styles.bankInfoTotal, { color: "#047857" }]}>
                      ${totalCart.toLocaleString("es-CO")}
                    </Text>
                    <Text
                      style={[
                        styles.bankInfoText,
                        {
                          marginTop: 15,
                          textAlign: "center",
                          fontSize: 14,
                          color: "#065F46",
                        },
                      ]}
                    >
                      Le pagarás directamente al repartidor cuando entregue tu
                      pedido. Por favor, intenta tener el dinero exacto.
                    </Text>
                  </View>
                )}

                {waitingPayment && (
                  <View style={{ alignItems: "center", marginTop: 20 }}>
                    <ActivityIndicator size="large" color="#E61C24" />
                    <Text style={{ marginTop: 10, color: "#64748B" }}>
                      Esperando confirmación del pago...
                    </Text>
                    <TouchableOpacity
                      onPress={stopWaiting}
                      style={{ marginTop: 8, padding: 8 }}
                    >
                      <Text style={{ color: "#E61C24", fontWeight: "600" }}>
                        Cancelar espera
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.confirmOrderBtn,
                    (submitting || waitingPayment) &&
                      styles.confirmOrderBtnDisabled,
                    { marginTop: 20, marginBottom: 20 },
                  ]}
                  onPress={submitFinalOrder}
                  disabled={submitting || waitingPayment}
                >
                  <Ionicons
                    name={
                      paymentMethod === "efectivo" ? "bicycle" : "lock-closed"
                    }
                    size={20}
                    color="#FFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.confirmOrderBtnText}>
                    {submitting
                      ? "Procesando..."
                      : paymentMethod === "efectivo"
                        ? "Confirmar Pedido y Enviar"
                        : "Pagar con Wompi"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </>
          ) : isCheckingOut ? (
            // 2. PANTALLA DE SELECCIÓN DE MÉTODO DE PAGO
            <>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setIsCheckingOut(false)}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={26} color="#1E293B" />
                </TouchableOpacity>
                <Text
                  style={[styles.modalTitle, { flex: 1, textAlign: "center" }]}
                >
                  Método de Pago
                </Text>
                <TouchableOpacity
                  onPress={handleCloseCart}
                  style={{ width: 26, alignItems: "flex-end" }}
                >
                  <Ionicons name="close" size={28} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={styles.paymentTotalBox}>
                <Text style={styles.paymentTotalLabel}>Total a pagar</Text>
                <Text style={styles.paymentTotalBig}>
                  ${totalCart.toLocaleString("es-CO")}
                </Text>
              </View>

              <Text style={styles.paymentSubtitle}>¿Cómo deseas pagar?</Text>

              <View style={styles.paymentGrid}>
                {/* OPCIÓN 1: WOMPI */}
                <TouchableOpacity
                  style={[
                    styles.paymentCard,
                    paymentMethod === "wompi" && styles.paymentCardActive,
                  ]}
                  onPress={() => {
                    setPaymentMethod("wompi");
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      paymentMethod === "wompi" && styles.iconCircleActive,
                    ]}
                  >
                    <Ionicons
                      name="card"
                      size={28}
                      color={paymentMethod === "wompi" ? "#E61C24" : "#64748B"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.paymentCardTitle,
                      paymentMethod === "wompi" &&
                        styles.paymentCardTitleActive,
                    ]}
                  >
                    Wompi
                  </Text>
                  <Text style={styles.paymentCardDesc}>
                    Nequi, Tarjetas, PSE
                  </Text>
                </TouchableOpacity>

                {/* OPCIÓN 2: EFECTIVO */}
                <TouchableOpacity
                  style={[
                    styles.paymentCard,
                    paymentMethod === "efectivo" && styles.paymentCardActive,
                  ]}
                  onPress={() => {
                    setPaymentMethod("efectivo");
                    setReceiptUploaded(true); // Engañamos al sistema para que no pida foto
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      paymentMethod === "efectivo" && styles.iconCircleActive,
                    ]}
                  >
                    <Ionicons
                      name="cash"
                      size={28}
                      color={
                        paymentMethod === "efectivo" ? "#E61C24" : "#64748B"
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.paymentCardTitle,
                      paymentMethod === "efectivo" &&
                        styles.paymentCardTitleActive,
                    ]}
                  >
                    Efectivo
                  </Text>
                  <Text style={styles.paymentCardDesc}>Pago al repartidor</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.checkoutFooter}>
                <TouchableOpacity
                  style={[
                    styles.confirmOrderBtn,
                    !paymentMethod && styles.confirmOrderBtnDisabled,
                  ]}
                  onPress={handlePaymentNextStep}
                  disabled={!paymentMethod}
                >
                  <Text style={styles.confirmOrderBtnText}>Continuar</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#FFF"
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // 1. PANTALLA DEL CARRITO (Tus platos seleccionados)
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tu Pedido</Text>
                <TouchableOpacity onPress={handleCloseCart}>
                  <Ionicons name="close" size={28} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {cart.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Ionicons name="cart-outline" size={60} color="#E2E8F0" />
                  <Text style={styles.emptyCartText}>
                    Aún no has agregado nada.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={{ maxHeight: "55%" }}
                  showsVerticalScrollIndicator={false}
                >
                  {cart.map((item: any) => (
                    <View key={item.cartId} style={styles.cartItem}>
                      <View style={styles.cartItemImageMini}>
                        {item.image ? (
                          <Image
                            source={{ uri: item.image }}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: 8,
                            }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={{ fontSize: 24 }}>🍽️</Text>
                        )}
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.cartItemName}>{item.name}</Text>
                        <Text style={styles.cartItemPrice}>
                          ${item.price.toLocaleString("es-CO")}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteCartBtn}
                        onPress={() => removeFromCart(item.cartId)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {cart.length > 0 && (
                <View style={styles.checkoutFooter}>
                  <View style={styles.checkoutTotalRow}>
                    <Text style={styles.checkoutTotalLabel}>Total:</Text>
                    <Text style={styles.checkoutTotalValue}>
                      ${totalCart.toLocaleString("es-CO")}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.confirmOrderBtn}
                    onPress={proceedToCheckout}
                  >
                    <Text style={styles.confirmOrderBtnText}>
                      Continuar al Pago
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color="#FFF"
                      style={{ marginLeft: 8 }}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};