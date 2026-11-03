import { Ionicons } from "@expo/vector-icons";
import { BreakdownRows } from "@/features/orders/components/BreakdownRows";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { styles } from "../style/CashierStyles";
import type { CashierOrdersModel } from "./cashier-orders-model";
import { CashierPaymentMethods } from "./CashierPaymentMethods";
export function CashierPaymentModal({model}:{model:CashierOrdersModel}){
const { lang, isDark, screenWidth, screenHeight, t, colors, orderModalVisible, selectedOrder, cashierPaymentMethod, wompiQrUrl, setCatalogModalVisible, isSubmittingPayment, remainingBalance, loadingBalance, confirmOrderPayment, closeOrderModal }=model;

return (<>
      <Modal
        animationType="slide"
        transparent={true}
        visible={orderModalVisible}
        onRequestClose={closeOrderModal}
      >
        <View style={styles.modalOverlay}>
          {/* 🔥 MODAL DE COBRO DINÁMICO 🔥 */}
          <View
            style={[
              styles.modalBox,
              {
                backgroundColor: colors.card,
                maxHeight: screenHeight * 0.92,
                maxWidth: 640,
                paddingHorizontal:
                  screenWidth < 360 ? 14 : screenWidth < 420 ? 18 : 24,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t.modalChargeOrder}
              </Text>
              <TouchableOpacity onPress={closeOrderModal}>
                <Text style={[styles.closeIcon, { color: colors.muted }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
            {selectedOrder && (
              <View
                style={[
                  styles.ticketContainer,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >

                    <View style={styles.ticketRow}>
                      <Text
                        style={[styles.ticketLabel, { color: colors.muted }]}
                      >
                        {t.orderTypeLabel}
                      </Text>
                      <Text style={styles.ticketValueLarge}>
                        {selectedOrder.type === "mesa"
                          ? t.orderTable.replace(
                              "{table}",
                              String(selectedOrder.table || ""),
                            )
                          : t.catalogTakeaway}
                      </Text>
                    </View>
                    {Boolean(selectedOrder.customerName?.trim()) && (
                      <View style={styles.ticketRow}>
                          <Text
                            style={[
                              styles.ticketLabel,
                              { color: colors.muted },
                            ]}
                          >
                            {t.customer}:
                          </Text>
                          <Text
                            style={[styles.ticketValue, { color: colors.text }]}
                          >
                            {selectedOrder.customerName?.trim()}
                          </Text>
                      </View>
                    )}
                    {!!selectedOrder.employeeName && (
                      <View style={styles.ticketRow}>
                        <Text
                          style={[styles.ticketLabel, { color: colors.muted }]}
                        >
                          {t.attendedBy}:
                        </Text>
                        <Text
                          style={[styles.ticketValue, { color: colors.text }]}
                        >
                          {selectedOrder.employeeName}
                        </Text>
                      </View>
                    )}
                    <View style={styles.ticketRow}>
                      <Text
                        style={[styles.ticketLabel, { color: colors.muted }]}
                      >
                        {t.orderTimeLabel}
                      </Text>
                      <Text
                        style={[styles.ticketValue, { color: colors.text }]}
                      >
                        {selectedOrder.time}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: colors.border },
                      ]}
                    />

                    <Text
                      style={[
                        styles.ticketItemsHeader,
                        { color: colors.muted },
                      ]}
                    >
                      {t.consumptionDetail}
                    </Text>
                    <ScrollView style={styles.itemsScroll}>
                      <Text
                        style={[styles.ticketItemsList, { color: colors.text }]}
                      >
                        {selectedOrder.items}
                      </Text>
                    </ScrollView>

                    <View
                      style={{ marginTop: 10 }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.addMissingBtn,
                          {
                            width: "100%",
                            marginTop: 0,
                            borderColor: "#3B82F6",
                            backgroundColor: isDark ? "#1e3a8a" : "#EFF6FF",
                          },
                        ]}
                        onPress={() => setCatalogModalVisible(true)}
                      >
                        <Ionicons
                          name="add-circle"
                          size={16}
                          color="#3B82F6"
                          style={{ marginRight: 5 }}
                        />
                        <Text
                          style={[
                            styles.addMissingBtnText,
                            { color: colors.text, flexShrink: 1, textAlign: "center" },
                          ]}
                        >
                          {t.btnAddExtra}
                        </Text>
                      </TouchableOpacity>

                    </View>

                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: colors.border },
                      ]}
                    />

                {selectedOrder.tax != null && (
                      <BreakdownRows
                        subTotal={selectedOrder.subTotal ?? 0}
                        tax={selectedOrder.tax}
                        taxRate={selectedOrder.taxRate ?? 0}
                        taxIncludedInPrice={selectedOrder.taxIncludedInPrice}
                        deliveryFee={selectedOrder.deliveryFee ?? 0}
                        lang={lang}
                        textColor={colors.text}
                        mutedColor={colors.muted}
                      />
                    )}
                    <View style={styles.totalRow}>
                      <Text style={[styles.totalLabel, { color: colors.text }]}>
                        {t.totalToCharge}
                      </Text>
                      <Text style={styles.totalValue}>
                        {loadingBalance
                          ? t.calculating
                          : `$${(remainingBalance ?? selectedOrder.total).toLocaleString("es-CO")}`}
                      </Text>
                    </View>

<CashierPaymentMethods model={model} />
              </View>
            )}

            {(
              <TouchableOpacity
                style={[
                  styles.modalAcceptBtn,
                  (!cashierPaymentMethod ||
                    isSubmittingPayment ||
                    loadingBalance ||
                    !!wompiQrUrl) && {
                    backgroundColor: isDark ? "#475569" : "#94A3B8",
                  },
                ]}
                onPress={confirmOrderPayment}
                disabled={
                  !cashierPaymentMethod ||
                  isSubmittingPayment ||
                  loadingBalance ||
                  !!wompiQrUrl
                }
              >
                <Text style={styles.modalAcceptText}>
                  {isSubmittingPayment
                    ? t.processingPayment
                    : cashierPaymentMethod === "wompi"
                      ? wompiQrUrl
                        ? t.waitingPayment
                        : t.generateQrCharge
                      : cashierPaymentMethod
                        ? t.btnConfirmAndClose
                        : t.btnSelectMethod}
                </Text>
              </TouchableOpacity>
            )}
            </ScrollView>
          </View>
        </View>
      </Modal>
</>);
}
