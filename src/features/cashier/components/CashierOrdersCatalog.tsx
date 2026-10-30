import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, FlatList, LayoutAnimation, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { styles } from "../style/CashierStyles";
import type { CashierOrdersModel } from "./cashier-orders-model";

export function CashierOrdersCatalog({model}:{model:CashierOrdersModel}){
const { isDark, t, localizedProductName, colors, catalogModalVisible, setCatalogModalVisible, searchQuery, setSearchQuery, extraItemForTakeaway, setExtraItemForTakeaway, addingExtra, pendingProduct, setPendingProduct, pendingQuantity, setPendingQuantity, openAddConfirmation, productsLoading, productsError, filteredMenu, handleSelectMenuItem }=model;

return (<>
      {/* 🔥 MODAL DE CATÁLOGO (AGREGAR EXTRA) DINÁMICO 🔥 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={catalogModalVisible}
        onRequestClose={() =>
          pendingProduct
            ? setPendingProduct(null)
            : setCatalogModalVisible(false)
        }
      >
        <View style={styles.catalogOverlay}>
          <View style={[styles.catalogBox, { backgroundColor: colors.card }]}>
            <View style={styles.catalogHeader}>
              <Text style={[styles.catalogTitle, { color: colors.text }]}>
                {t.catalogTitle}
              </Text>
              <TouchableOpacity onPress={() => setCatalogModalVisible(false)}>
                <Text style={[styles.closeIcon, { color: colors.muted }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.warningText,
                { color: colors.muted, marginBottom: 10 },
              ]}
            >
              {t.catalogExtraQuestion}
            </Text>

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
              <TouchableOpacity
                style={[
                  styles.addMissingBtn,
                  {
                    flex: 1,
                    marginTop: 0,
                    borderColor: !extraItemForTakeaway
                      ? "#10B981"
                      : colors.border,
                    backgroundColor: isDark ? "transparent" : "#FFFFFF",
                  },
                ]}
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  );
                  setExtraItemForTakeaway(false);
                }}
              >
                <Ionicons
                  name="restaurant"
                  size={16}
                  color={!extraItemForTakeaway ? "#10B981" : colors.muted}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.addMissingBtnText,
                    { color: !extraItemForTakeaway ? "#10B981" : colors.muted },
                  ]}
                >
                  {t.catalogTable}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.addMissingBtn,
                  {
                    flex: 1,
                    marginTop: 0,
                    borderColor: extraItemForTakeaway
                      ? "#10B981"
                      : colors.border,
                    backgroundColor: isDark ? "transparent" : "#FFFFFF",
                  },
                ]}
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  );
                  setExtraItemForTakeaway(true);
                }}
              >
                <Ionicons
                  name="bag-outline"
                  size={16}
                  color={extraItemForTakeaway ? "#10B981" : colors.muted}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.addMissingBtnText,
                    { color: extraItemForTakeaway ? "#10B981" : colors.muted },
                  ]}
                >
                  {t.catalogTakeaway}
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.searchContainer,
                { backgroundColor: colors.inputBg },
              ]}
            >
              <Ionicons name="search" size={20} color={colors.muted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={t.catalogSearchPlaceholder}
                placeholderTextColor={colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              )}
            </View>

            {productsLoading ? (
              <View style={{ paddingVertical: 30, alignItems: "center" }}>
                <ActivityIndicator color={colors.muted} />
              </View>
            ) : productsError ? (
              <Text style={[styles.emptyCatalogText, { color: colors.muted }]}>
                {productsError}
              </Text>
            ) : (
              <FlatList
                data={filteredMenu}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.catalogItem,
                      { borderBottomColor: colors.border },
                    ]}
                    onPress={() => openAddConfirmation(item)}
                    disabled={addingExtra}
                  >
                    <View>
                      <Text
                        style={[styles.catalogItemName, { color: colors.text }]}
                      >
                        {localizedProductName(item)}
                      </Text>
                      <Text style={styles.catalogItemPrice}>
                        + ${item.price.toLocaleString("es-CO")}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.catalogAddBtn,
                        { backgroundColor: isDark ? "#451a03" : "#FEF2F2" },
                      ]}
                    >
                      <Text style={styles.catalogAddBtnText}>
                        {addingExtra ? "..." : t.catalogBtnAdd}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text
                    style={[styles.emptyCatalogText, { color: colors.muted }]}
                  >
                    {t.catalogEmptySearch.replace("{query}", searchQuery)}
                  </Text>
                }
              />
            )}
          </View>

          {/* CONFIRMACIÓN AL AÑADIR (overlay dentro del mismo Modal) */}
          {pendingProduct && (
            <View style={styles.confirmOverlay}>
              <View
                style={[
                  styles.confirmBox,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.confirmIconWrap}>
                  <Ionicons name="cart" size={28} color="#E61C24" />
                </View>

                <Text style={[styles.confirmTitle, { color: colors.text }]}>
                  {t.confirmAddTitle}
                </Text>
                <Text
                  style={[styles.confirmProductName, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {localizedProductName(pendingProduct)}
                </Text>
                <Text style={styles.confirmUnitPrice}>
                  ${pendingProduct.price.toLocaleString("es-CO")}
                </Text>

                <View style={styles.confirmRow}>
                  <Text style={[styles.confirmLabel, { color: colors.muted }]}>
                    {t.confirmAddQuantity}
                  </Text>
                  <View style={styles.confirmStepper}>
                    <TouchableOpacity
                      style={[
                        styles.confirmStepBtn,
                        { borderColor: colors.border },
                      ]}
                      disabled={pendingQuantity <= 1 || addingExtra}
                      onPress={() =>
                        setPendingQuantity((q) => Math.max(1, q - 1))
                      }
                    >
                      <Ionicons name="remove" size={20} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.confirmQty, { color: colors.text }]}>
                      {pendingQuantity}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.confirmStepBtn,
                        { borderColor: colors.border },
                      ]}
                      disabled={pendingQuantity >= 99 || addingExtra}
                      onPress={() =>
                        setPendingQuantity((q) => Math.min(99, q + 1))
                      }
                    >
                      <Ionicons name="add" size={20} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.confirmRow}>
                  <Text style={[styles.confirmLabel, { color: colors.muted }]}>
                    {extraItemForTakeaway ? t.catalogTakeaway : t.catalogTable}
                  </Text>
                  <Text style={styles.confirmTotal}>
                    $
                    {(pendingProduct.price * pendingQuantity).toLocaleString(
                      "es-CO",
                    )}
                  </Text>
                </View>

                <View style={styles.confirmButtonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.confirmCancelBtn,
                      { borderColor: colors.border },
                    ]}
                    disabled={addingExtra}
                    onPress={() => setPendingProduct(null)}
                  >
                    <Text
                      style={[styles.confirmCancelText, { color: colors.text }]}
                    >
                      {t.btnCancel}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmOkBtn,
                      addingExtra && { opacity: 0.6 },
                    ]}
                    disabled={addingExtra}
                    onPress={() =>
                      handleSelectMenuItem(pendingProduct, pendingQuantity)
                    }
                  >
                    <Text style={styles.confirmOkText}>
                      {addingExtra ? t.confirmAddAdding : t.confirmAddBtn}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
</>);
}
