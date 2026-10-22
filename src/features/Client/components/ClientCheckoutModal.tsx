import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from "expo-image";
import { styles as baseStyles } from './style/ClientStyles';
import { getClientLocale, useClientPreferences, useClientThemedStyles } from "@/features/userPreferences/context/ClientPreferencesContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BreakdownRows } from "@/features/orders/components/BreakdownRows";

export const ClientCheckoutModal = ({
  cartModalVisible,
  handleCloseCart,
  orderConfirmed,
  isUploadingReceipt,
  isCheckingOut,
  cart,
  removeFromCart,
  totalCart,
  breakdown,
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
  outOfRadius,
  branchUnavailable = false,
  radiusTitle,
  radiusText,
}: any) => {
  const styles = useClientThemedStyles(baseStyles);
  const { t, colors, language } = useClientPreferences();
  const insets = useSafeAreaInsets();

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
            { paddingBottom: Math.max(24, insets.bottom + 12) },
            (isCheckingOut || isUploadingReceipt) && { minHeight: "65%" },
          ]}
        >
          {outOfRadius && !orderConfirmed && (
            <View
              accessibilityRole="alert"
              style={{
                padding: 12,
                marginBottom: 14,
                borderRadius: 10,
                backgroundColor: "#FEE2E2",
                borderWidth: 1,
                borderColor: "#FCA5A5",
              }}
            >
              <Text style={{ color: "#991B1B", fontWeight: "700", marginBottom: 2 }}>
                {radiusTitle}
              </Text>
              <Text style={{ color: "#991B1B", fontSize: 12 }}>
                {radiusText}
              </Text>
            </View>
          )}
          {orderConfirmed ? (
            // 4. PANTALLA DE ÉXITO
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={90} color="#10B981" />
              <Text style={styles.successTitle}>
                {orderPaid ? t("paymentConfirmed") : t("orderReceived")}
              </Text>
              <Text style={styles.successText}>
                {orderPaid ? t("orderPaidMessage") : t("orderPendingMessage")}
              </Text>
              <View style={styles.successDivider} />
              <Text style={styles.successNote}>
                {t("profileTrackingNote")}
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
              <Ionicons name="arrow-back" size={26} color={colors.text} />
                </TouchableOpacity>
                <Text
                  style={[styles.modalTitle, { flex: 1, textAlign: "center" }]}
                >
                  {t("confirmation")}
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
                      color={colors.text}
                      style={{ marginBottom: 10 }}
                    />
                    <Text style={styles.bankInfoText}>
                      {t("wompiAmount")}
                    </Text>
                    <Text style={styles.bankInfoTotal}>
                      ${totalCart.toLocaleString(getClientLocale(language))}
                    </Text>
                    <Text
                      style={[
                        styles.bankInfoText,
                        { marginTop: 15, textAlign: "center", fontSize: 13 },
                      ]}
                    >
                      {t("wompiInstructions")}
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
                      {t("cashPayment")}
                    </Text>
                    <Text style={[styles.bankInfoTotal, { color: "#047857" }]}>
                      ${totalCart.toLocaleString(getClientLocale(language))}
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
                      {t("cashInstructions")}
                    </Text>
                  </View>
                )}

                {waitingPayment && (
                  <View style={{ alignItems: "center", marginTop: 20 }}>
                    <ActivityIndicator size="large" color="#E61C24" />
                    <Text style={{ marginTop: 10, color: colors.muted }}>
                      {t("waitingPayment")}
                    </Text>
                    <TouchableOpacity
                      onPress={stopWaiting}
                      style={{ marginTop: 8, padding: 8 }}
                    >
                      <Text style={{ color: "#E61C24", fontWeight: "600" }}>
                        {t("cancelWait")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.confirmOrderBtn,
                    (submitting || waitingPayment) &&
                      styles.confirmOrderBtnDisabled,
                    (outOfRadius || branchUnavailable) && {
                      backgroundColor: "#E2E8F0",
                      shadowOpacity: 0,
                    },
                    { marginTop: 20, marginBottom: 20 },
                  ]}
                  onPress={submitFinalOrder}
                  disabled={submitting || waitingPayment || outOfRadius || branchUnavailable}
                >
                  <Ionicons
                    name={
                      paymentMethod === "efectivo" ? "bicycle" : "lock-closed"
                    }
                    size={20}
                    color={outOfRadius || branchUnavailable ? "#475569" : "#FFF"}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.confirmOrderBtnText,
                      (outOfRadius || branchUnavailable) && { color: "#475569" },
                    ]}
                  >
                    {submitting
                      ? t("processing")
                      : paymentMethod === "efectivo"
                        ? t("confirmOrderAndSend")
                        : t("payWithWompi")}
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
                  <Ionicons name="arrow-back" size={26} color={colors.text} />
                </TouchableOpacity>
                <Text
                  style={[styles.modalTitle, { flex: 1, textAlign: "center" }]}
                >
                  {t("paymentMethod")}
                </Text>
                <TouchableOpacity
                  onPress={handleCloseCart}
                  style={{ width: 26, alignItems: "flex-end" }}
                >
                  <Ionicons name="close" size={28} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={styles.paymentTotalBox}>
              <Text style={styles.paymentTotalLabel}>{t("totalToPay")}</Text>
                <Text style={styles.paymentTotalBig}>
                  ${totalCart.toLocaleString(getClientLocale(language))}
                </Text>
              </View>

              {breakdown && (
                <View style={{ paddingHorizontal: 4 }}>
                  <BreakdownRows
                    {...breakdown}
                    lang={language}
                    locale={getClientLocale(language)}
                    textColor={colors.text}
                    mutedColor={colors.muted}
                  />
                </View>
              )}
              <Text style={styles.paymentSubtitle}>{t("paymentQuestion")}</Text>

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
                      color={paymentMethod === "wompi" ? colors.accent : colors.muted}
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
                    {t("cardTypes")}
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
                        paymentMethod === "efectivo" ? colors.accent : colors.muted
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
                    {t("cash")}
                  </Text>
                  <Text style={styles.paymentCardDesc}>{t("payDriver")}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.checkoutFooter}>
                <TouchableOpacity
                  style={[
                    styles.confirmOrderBtn,
                    (!paymentMethod || outOfRadius) &&
                      styles.confirmOrderBtnDisabled,
                    (outOfRadius || branchUnavailable) && {
                      backgroundColor: "#E2E8F0",
                      shadowOpacity: 0,
                    },
                  ]}
                  onPress={handlePaymentNextStep}
                  disabled={!paymentMethod || outOfRadius || branchUnavailable}
                >
                  <Text
                    style={[
                      styles.confirmOrderBtnText,
                      (outOfRadius || branchUnavailable) && { color: "#475569" },
                    ]}
                  >
                    {t("continue")}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={outOfRadius || branchUnavailable ? "#475569" : "#FFF"}
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // 1. PANTALLA DEL CARRITO (Tus platos seleccionados)
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t("orderTitle")}</Text>
                <TouchableOpacity onPress={handleCloseCart}>
                  <Ionicons name="close" size={28} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {cart.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Ionicons name="cart-outline" size={60} color="#E2E8F0" />
                  <Text style={styles.emptyCartText}>
                    {t("emptyCart")}
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
                          <ExpoImage
                            source={{ uri: item.image }}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: 8,
                            }}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                            transition={120}
                          />
                        ) : (
                          <Text style={{ fontSize: 24 }}>🍽️</Text>
                        )}
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.cartItemName}>{item.name}</Text>
                        <Text style={styles.cartItemPrice}>
                          ${item.price.toLocaleString(getClientLocale(language))}
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
                    {breakdown && (
                    <BreakdownRows
                      {...breakdown}
                      lang={language}
                      locale={getClientLocale(language)}
                      textColor={colors.text}
                      mutedColor={colors.muted}
                    />
                  )}
                  <View style={styles.checkoutTotalRow}>
                    <Text style={styles.checkoutTotalLabel}>{t("total")}:</Text>
                    <Text style={styles.checkoutTotalValue}>
                      ${totalCart.toLocaleString(getClientLocale(language))}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.confirmOrderBtn,
                      (outOfRadius || branchUnavailable) && {
                        backgroundColor: "#E2E8F0",
                        shadowOpacity: 0,
                      },
                    ]}
                    onPress={proceedToCheckout}
                    disabled={outOfRadius || branchUnavailable}
                  >
                    <Text
                      style={[
                        styles.confirmOrderBtnText,
                        (outOfRadius || branchUnavailable) && { color: "#475569" },
                      ]}
                    >
                      {t("continueToPayment")}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color={outOfRadius || branchUnavailable ? "#475569" : "#FFF"}
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
