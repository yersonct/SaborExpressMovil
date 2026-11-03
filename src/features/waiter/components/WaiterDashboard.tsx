import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NotificationToastContainer } from "@/features/shared/components/NotificationToast";
import { NotificationCenter } from "@/features/shared/components/NotificationCenter";
import { TablesGridView } from "./TablesGridView";
import { ActiveOrdersView } from "./ActiveOrdersView";
import { OrderTakingView } from "./OrderTakingView";
import { styles } from "./style/WaiterDashboardStyles";
import { ReasonPromptModal } from "@/features/shared/components/ReasonPromptModal";

import { useWaiterDashboardModel } from "./waiter-dashboard-model";
export function WaiterDashboard(){
const model=useWaiterDashboardModel();
const { windowWidth, colors, soundNotifications, t, employeeDisplayName, branchSettings, tables, activeTab, setActiveTab, activeOrders, occupiedTableWaiters, expandedOrderId, setExpandedOrderId, reasonPrompt, setReasonPrompt, reasonText, setReasonText, submittingReason, toasts, submitReason, todaysNotifications, unreadCount, soundEnabled, enableSound, dismissToast, handleNotificationSelect, handleOpenNotifications, handleClearNotifications, activeTableForOrder, setActiveTableForOrder, orderItems, isCartExpanded, setIsCartExpanded, destType, setDestType, linkedTableId, setLinkedTableId, toGoCustomerName, setToGoCustomerName, handleTablePress, handleStartToGoOrder, handleAddMoreToOrder, handleCancelOrder, handleDeliverOrder, handleMarkOrderReady, handleAddItem, handleUpdateItemNote, handleRemoveItem, toggleItemToGo, handleSubmitOrder }=model;
  return (
    <>
      <NotificationToastContainer
        notifications={toasts}
        onDismiss={dismissToast}
        t={(key) => t[key] || key}
        colors={{
          surface: colors.surface,
          text: colors.text,
          mutedText: colors.mutedText,
          border: colors.border,
        }}
      />
      {activeTableForOrder ? (
        <OrderTakingView
          activeTableForOrder={activeTableForOrder}
          setActiveTableForOrder={setActiveTableForOrder}
          orderItems={orderItems}
          isCartExpanded={isCartExpanded}
          setIsCartExpanded={setIsCartExpanded}
          destType={destType}
          setDestType={setDestType}
          toGoCustomerName={toGoCustomerName}
          setToGoCustomerName={setToGoCustomerName}
          tables={tables}
          linkedTableId={linkedTableId}
          setLinkedTableId={setLinkedTableId}
          handleAddItem={handleAddItem}
          handleRemoveItem={handleRemoveItem}
          toggleItemToGo={toggleItemToGo}
          handleUpdateItemNote={handleUpdateItemNote}
          handleSubmitOrder={handleSubmitOrder}
          taxRate={branchSettings?.taxRate ?? 0}
        />
      ) : (
        <SafeAreaView
          edges={["top"]}
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <View
            style={[
              styles.mainHeader,
              windowWidth < 380 && {
                flexDirection: "column",
                alignItems: "stretch",
                gap: 10,
              },
              { paddingHorizontal: windowWidth < 380 ? 16 : 20 },
              { backgroundColor: colors.header, borderColor: colors.border },
            ]}
          >
            <View style={styles.headerTitlesBox}>
              <Text style={[styles.mainSubtitle, { color: colors.mutedText }]}>
                {employeeDisplayName}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <NotificationCenter
                notifications={todaysNotifications}
                unreadCount={unreadCount}
                colors={{
                  background: colors.background,
                  surface: colors.surface,
                  elevated: colors.elevatedSurface,
                  text: colors.text,
                  muted: colors.mutedText,
                  border: colors.border,
                  accent: colors.accent,
                }}
                t={(key) => t[key] || key}
                onOpen={handleOpenNotifications}
                onClear={handleClearNotifications}
                onSelect={handleNotificationSelect}
              />
              <TouchableOpacity
                style={[
                  styles.toGoButton,
                  {
                    backgroundColor: colors.success,
                    shadowColor: colors.success,
                  },
                ]}
                onPress={handleStartToGoOrder}
              >
                <Ionicons name="bag-handle-outline" size={20} color="#FFF" />
                <Text style={styles.toGoButtonText} numberOfLines={1}>
                  {t.dashboardParaLlevar || "Para Llevar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {soundNotifications && !soundEnabled && (
            <TouchableOpacity
              onPress={enableSound}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: `${colors.warning}22`,
                paddingVertical: 10,
              }}
            >
              <Ionicons
                name="volume-mute-outline"
                size={18}
                color={colors.warning}
              />
              <Text
                style={{
                  color: colors.warning,
                  fontWeight: "700",
                  textAlign: "center",
                  flexShrink: 1,
                }}
              >
                {t.soundEnablePrompt}
              </Text>
            </TouchableOpacity>
          )}

          <View
            style={[
              styles.tabsContainer,
              { backgroundColor: colors.header, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "MESAS" && styles.activeTab,
                {
                  borderBottomColor:
                    activeTab === "MESAS" ? colors.accent : "transparent",
                },
              ]}
              onPress={() => setActiveTab("MESAS")}
            >
              <Ionicons
                name="grid-outline"
                size={20}
                color={activeTab === "MESAS" ? colors.accent : colors.mutedText}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: colors.mutedText },
                  activeTab === "MESAS" && { color: colors.accent },
                ]}
              >
                {t.dashboardTabTables || "Plano de Mesas"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "ORDENES" && styles.activeTab,
                {
                  borderBottomColor:
                    activeTab === "ORDENES" ? colors.accent : "transparent",
                },
              ]}
              onPress={() => setActiveTab("ORDENES")}
            >
              <Ionicons
                name="receipt-outline"
                size={20}
                color={
                  activeTab === "ORDENES" ? colors.accent : colors.mutedText
                }
              />
              <Text
                style={[
                  styles.tabText,
                  { color: colors.mutedText },
                  activeTab === "ORDENES" && { color: colors.accent },
                ]}
              >
                {t.dashboardTabOrders || "Órdenes"} ({activeOrders.length})
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              backgroundColor: colors.background,
            }}
          >
            {activeTab === "MESAS" ? (
              <TablesGridView
                tables={tables}
                handleTablePress={handleTablePress}
                occupiedTableWaiters={occupiedTableWaiters}
              />
            ) : (
              <ActiveOrdersView
                activeOrders={activeOrders}
                expandedOrderId={expandedOrderId}
                setExpandedOrderId={setExpandedOrderId}
                handleAddMoreToOrder={handleAddMoreToOrder}
                handleCancelOrder={handleCancelOrder}
                handleMarkOrderReady={handleMarkOrderReady}
                handleDeliverOrder={handleDeliverOrder}
              />
            )}
          </View>
        </SafeAreaView>
      )}
      <ReasonPromptModal
        visible={reasonPrompt !== null}
        title={reasonPrompt?.title ?? ""}
        description={t.cancelReasonDescription || "Indica brevemente el motivo. Se guardará en el historial."}
        placeholder={t.cancelReasonPlaceholder || "Escribe el motivo"}
        cancelLabel={t.cancelReasonBack || "Volver"}
        confirmLabel={t.cancelReasonConfirm || "Continuar"}
        value={reasonText}
        onChangeText={setReasonText}
        onCancel={() => { if (!submittingReason) setReasonPrompt(null); }}
        onConfirm={() => void submitReason()}
        busy={submittingReason}
      />
    </>
  );
}
