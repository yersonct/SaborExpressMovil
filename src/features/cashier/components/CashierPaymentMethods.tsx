import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, LayoutAnimation, Linking, Text, TouchableOpacity, View } from "react-native";
import { styles } from "../style/CashierStyles";
import QRCode from "react-native-qrcode-svg";
import type { CashierOrdersModel } from "./cashier-orders-model";

export function CashierPaymentMethods({model}:{model:CashierOrdersModel}){
const { isDark, screenWidth, t, colors, selectedOrder, cashierPaymentMethod, setCashierPaymentMethod, polling, wompiQrUrl, wompiQrAmount, wompiPaymentIdRef, cancelWompiQr, watchWompiPayment }=model;

return (<>
                    <Text
                      style={[
                        styles.paymentMethodTitle,
                        { color: colors.muted },
                      ]}
                    >
                      {t.howDidClientPay}
                    </Text>

                    <View style={styles.paymentOptionsRow}>
                      <TouchableOpacity
                        style={[
                          styles.paymentMethodBtn,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                          },
                          cashierPaymentMethod === "efectivo" &&
                            styles.paymentMethodBtnActive,
                        ]}
                        onPress={() => {
                          LayoutAnimation.configureNext(
                            LayoutAnimation.Presets.easeInEaseOut,
                          );
                          setCashierPaymentMethod("efectivo");
                        }}
                      >
                        <Ionicons
                          name="cash"
                          size={20}
                          color={
                            cashierPaymentMethod === "efectivo"
                              ? "#E61C24"
                              : colors.muted
                          }
                        />
                        <Text
                          style={[
                            styles.paymentMethodText,
                            { color: colors.muted },
                            cashierPaymentMethod === "efectivo" &&
                              styles.paymentMethodTextActive,
                          ]}
                        >
                          {t.payCash}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.paymentMethodBtn,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                          },
                          cashierPaymentMethod === "datafono" &&
                            styles.paymentMethodBtnActive,
                        ]}
                        onPress={() => {
                          LayoutAnimation.configureNext(
                            LayoutAnimation.Presets.easeInEaseOut,
                          );
                          setCashierPaymentMethod("datafono");
                        }}
                      >
                        <Ionicons
                          name="card"
                          size={20}
                          color={
                            cashierPaymentMethod === "datafono"
                              ? "#E61C24"
                              : colors.muted
                          }
                        />
                        <Text
                          style={[
                            styles.paymentMethodText,
                            { color: colors.muted },
                            cashierPaymentMethod === "datafono" &&
                              styles.paymentMethodTextActive,
                          ]}
                        >
                          {t.payCard}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.paymentMethodBtn,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                          },
                          cashierPaymentMethod === "wompi" &&
                            styles.paymentMethodBtnActive,
                        ]}
                        disabled={!!wompiQrUrl}
                        onPress={() => {
                          LayoutAnimation.configureNext(
                            LayoutAnimation.Presets.easeInEaseOut,
                          );
                          setCashierPaymentMethod("wompi");
                        }}
                      >
                        <Ionicons
                          name="qr-code"
                          size={20}
                          color={
                            cashierPaymentMethod === "wompi"
                              ? "#E61C24"
                              : colors.muted
                          }
                        />
                        <Text
                          style={[
                            styles.paymentMethodText,
                            { color: colors.muted },
                            cashierPaymentMethod === "wompi" &&
                              styles.paymentMethodTextActive,
                          ]}
                        >
                          QR / Wompi
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {cashierPaymentMethod === "wompi" && (
                      <View
                        style={{
                          alignItems: "center",
                          marginTop: 12,
                          padding: 14,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: colors.border,
                          backgroundColor: colors.card,
                        }}
                      >
                        {wompiQrUrl ? (
                          <>
                            <View
                              style={{
                                backgroundColor: "#FFFFFF",
                                padding: 12,
                                borderRadius: 8,
                              }}
                            >
                              <QRCode
                                value={wompiQrUrl}
                                size={Math.min(220, screenWidth - 100)}
                              />
                            </View>
                            <Text
                              style={{
                                color: colors.text,
                                fontWeight: "700",
                                marginTop: 10,
                              }}
                            >
                              {t.amountLabel}: ${wompiQrAmount.toLocaleString("es-CO")}
                            </Text>
                            <Text
                              style={{
                                color: colors.muted,
                                marginTop: 4,
                                fontSize: 12,
                                textAlign: "center",
                              }}
                            >
                              {t.scanQrInstruction}
                            </Text>
                            <TouchableOpacity
                              style={{ marginTop: 6, padding: 6 }}
                              onPress={() => Linking.openURL(wompiQrUrl)}
                            >
                              <Text style={{ color: "#3B82F6", fontWeight: "600" }}>
                                {t.openPaymentLink}
                              </Text>
                            </TouchableOpacity>
                            {polling ? (
                              <View style={{ alignItems: "center", marginTop: 8 }}>
                                <ActivityIndicator size="small" color="#E61C24" />
                                <Text style={{ color: colors.muted, marginTop: 6 }}>
                                  {t.waitingForCustomer}
                                </Text>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={{ marginTop: 8, padding: 8 }}
                                onPress={() =>
                                  selectedOrder &&
                                  wompiPaymentIdRef.current &&
                                  watchWompiPayment(
                                    wompiPaymentIdRef.current,
                                    selectedOrder,
                                  )
                                }
                              >
                                <Text style={{ color: "#E61C24", fontWeight: "600" }}>
                                  {t.paymentTimeoutRetry}
                                </Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              style={{ marginTop: 6, padding: 8 }}
                              onPress={cancelWompiQr}
                            >
                              <Text style={{ color: colors.muted }}>
                                {t.cancelQrCharge}
                              </Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <Text style={{ color: colors.muted, textAlign: "center" }}>
                            {t.wompiQrInstructions}
                          </Text>
                        )}
                      </View>
                    )}

                    {cashierPaymentMethod === "datafono" && (
                      <View
                        style={[
                          styles.warningBox,
                          {
                            backgroundColor: isDark ? "#064e3b" : "#d1fae5",
                            borderColor: isDark ? "#065f46" : "#a7f3d0",
                          },
                        ]}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#10B981"
                          style={{ marginRight: 5 }}
                        />
                        <Text
                          style={[
                            styles.warningText,
                            { color: isDark ? "#34d399" : "#065F46" },
                          ]}
                        >
                          {t.warningCard}
                        </Text>
                      </View>
                    )}
</>);
}
