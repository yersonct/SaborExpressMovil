import React, { useState, useMemo } from 'react';
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  LayoutAnimation,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  calcBreakdown,
  getBreakdownLabels,
} from "@/features/orders/utils/orderBreakdown";
import { Image as ExpoImage } from "expo-image";
import { Ionicons } from '@expo/vector-icons';
import { styles as globalStyles } from './style/WaiterDashboardStyles'; // Asumo que tus estilos globales están aquí
import { localStyles } from './style/OrderTakingStyles';
import { useWaiterTheme } from '@/features/waiter/context/WaiterThemeContext';
import { useWaiterLanguage } from '@/features/waiter/context/WaiterLanguageContext';

import { useProducts } from "@/features/products/hooks/useProducts";
import type { Product } from "@/features/products/types/product.types";
import { resolvePhotoUrl } from "@/features/products/utils/resolvePhotoUrl";
// Los items del menú


export const OrderTakingView = ({
  activeTableForOrder,
  setActiveTableForOrder,
  orderItems,
  isCartExpanded,
  setIsCartExpanded,
  destType,
  setDestType,
  toGoCustomerName,
  setToGoCustomerName,
  tables,
  linkedTableId,
  setLinkedTableId,
  handleAddItem,
  handleRemoveItem,
  toggleItemToGo,
  handleUpdateItemNote,
   handleSubmitOrder,
  taxRate = 0,
}: any) => {
  const { colors } = useWaiterTheme();
  const { t } = useWaiterLanguage();
  const { height: screenHeight } = useWindowDimensions();
  const baseFontFamily = Platform.select({
    web: "system-ui, -apple-system, sans-serif",
    default: undefined,
  });
  const canEditCartItem = (item: any) => {
    if (item.isDelivered || item.status === "Delivered") return false;
    if (item.alreadySubmitted) return item.status === "Pending";
    return item.status !== "InPreparation" && item.status !== "Ready";
  };

  const {
    products,
    loading: productsLoading,
    error: productsError,
  } = useProducts(); // 👈 nuevo

  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [selectedCartItem, setSelectedCartItem] = useState<any>(null);
  const [itemNote, setItemNote] = useState("");

   const ALL_CATEGORY = "__ALL__";
   const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);

  const orderTotal = orderItems.reduce(
    (sum: any, item: any) => sum + item.price * item.quantity,
    0,
  );
    const breakdown = calcBreakdown(orderTotal, taxRate, 0);
  const breakdownLabels = getBreakdownLabels(t.language);
  const cartScrollMaxHeight = Math.max(
    140,
    Math.min(280, screenHeight * (activeTableForOrder.isGlobalToGo ? 0.34 : 0.42)),
  );
  const paddingBottom = isCartExpanded
    ? cartScrollMaxHeight + (activeTableForOrder.isGlobalToGo ? 190 : 130)
    : 150;

  // 🔥 Categorías dinámicas, armadas desde los productos reales
  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(products.map((p) => p.categoryName)));
    return [ALL_CATEGORY, ...uniqueCats];
  }, [products]);

  const filteredItems = useMemo(() => {
    if (activeCategory === ALL_CATEGORY) return products;
    return products.filter((p) => p.categoryName === activeCategory);
  }, [activeCategory, products]);

  // Funciones de Notas
  const openItemNoteModal = (item: any) => {
    setSelectedCartItem(item);
    setItemNote(item.note || "");
    setIsNoteModalVisible(true);
  };

  const confirmUpdateNote = async () => {
    if (!selectedCartItem) return;
    const saved = await handleUpdateItemNote(
      selectedCartItem.cartId,
      itemNote.trim(),
    );
    if (saved === false) return;
    setIsNoteModalVisible(false);
    setSelectedCartItem(null);
    setItemNote("");
  };

  // Funciones de Producto (Detalles)
  const openProductDetails = (item: any) => {
    setSelectedProduct(item);
    setIsProductModalVisible(true);
  };

  const handleAddFromModal = () => {
    if (selectedProduct) {
      handleAddItem(selectedProduct);
      setIsProductModalVisible(false);
      setSelectedProduct(null);
    }
  };

  // Helper para iconos dinámicos
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (
      name.includes("bebida") ||
      name.includes("jugo") ||
      name.includes("gaseosa")
    )
      return "cafe";
    if (
      name.includes("postre") ||
      name.includes("dulce") ||
      name.includes("helado")
    )
      return "ice-cream";
    return "fast-food";
  };

  return (
    <SafeAreaView
      style={[globalStyles.container, { backgroundColor: colors.background }]}
    >
      {/* HEADER */}
      <View
        style={[
          globalStyles.orderHeader,
          { backgroundColor: colors.header, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={globalStyles.backButton}
          onPress={() => setActiveTableForOrder(null)}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text
            style={[globalStyles.orderHeaderTitle, { color: colors.mutedText }]}
          >
            {t.orderTakingTitle || "Tomando pedido"}
          </Text>
          <Text style={[globalStyles.orderHeaderTable, { color: colors.text }]}>
            {activeTableForOrder.name}
          </Text>
        </View>
      </View>

      {/* 🔥 CATEGORÍAS HORIZONTALES 🔥 */}
      <View style={{ backgroundColor: colors.header, paddingVertical: 10 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15, gap: 10 }}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                localStyles.categoryTab,
                {
                  backgroundColor:
                    activeCategory === cat
                      ? colors.accent
                      : colors.elevatedSurface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut,
                );
                setActiveCategory(cat);
              }}
            >
              <Text
                style={[
                  localStyles.categoryTabText,
                  { color: activeCategory === cat ? "#FFFFFF" : colors.text },
                ]}
              >
                {cat === ALL_CATEGORY
                  ? t.categoriesAllLabel || "⭐ Todas"
                  : t["category" + cat] || cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 🔥 CATÁLOGO GRID (CUADRÍCULA) 🔥 */}
      {productsLoading ? (
        <View style={{ padding: 40, alignItems: "center" }}>
          <Text style={{ color: colors.mutedText }}>
            {t.loadingProducts || "Cargando productos..."}
          </Text>
        </View>
      ) : productsError ? (
        <View style={{ padding: 40, alignItems: "center" }}>
          <Text style={{ color: colors.danger }}>{productsError}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={localStyles.gridRow}
          contentContainerStyle={{
            padding: 15,
            paddingBottom,
            backgroundColor: colors.background,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const photoUrl = resolvePhotoUrl(item.photo);
            return (
              <View
                style={[
                  localStyles.gridCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <TouchableOpacity
                  style={localStyles.gridCardContent}
                  onPress={() => openProductDetails(item)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      localStyles.iconContainer,
                      { backgroundColor: `${colors.accent}15` },
                    ]}
                  >
                    {photoUrl ? (
                      <ExpoImage
                        source={{ uri: photoUrl }}
                        style={{ width: 60, height: 60, borderRadius: 8 }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={120}
                        recyclingKey={photoUrl}
                      />
                    ) : (
                      <Ionicons
                        name={getCategoryIcon(item.categoryName) as any}
                        size={36}
                        color={colors.accent}
                      />
                    )}
                  </View>
                  <Text
                    style={[localStyles.gridItemName, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[localStyles.gridItemPrice, { color: colors.text }]}
                  >
                    ${item.price.toLocaleString()}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    localStyles.quickAddButton,
                    { backgroundColor: colors.accent },
                  ]}
                  onPress={() => handleAddItem(item)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* EL CARRITO FLOTANTE. Importante: el maxHeight va SOLO en la zona
          scrolleable de productos (cartExpandedArea, más abajo), no aquí.
          Si se limita este contenedor completo, en pantallas de celular
          (más bajas que un navegador de escritorio) el footer con el total
          y el contador de productos queda cortado fuera del área visible,
          aunque sí está renderizado. */}
      <View
        style={[
          globalStyles.floatingCart,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[globalStyles.cartHeader, { borderBottomColor: colors.border }]}
          activeOpacity={0.8}
          onPress={() => {
            LayoutAnimation.configureNext(
              LayoutAnimation.Presets.easeInEaseOut,
            );
            setIsCartExpanded(!isCartExpanded);
          }}
        >
          <Text style={[globalStyles.cartHeaderText, { color: colors.text }]}>
            {t.orderTakingCartTitle || "Ver Carrito"} (
            {orderItems.reduce((acc: any, it: any) => acc + it.quantity, 0)}{" "}
            {t.orderTakingProductsLabel || "Productos"})
          </Text>
          <Ionicons
            name={isCartExpanded ? "chevron-down" : "chevron-up"}
            size={20}
            color={colors.mutedText}
          />
        </TouchableOpacity>

        {isCartExpanded && (
          <ScrollView
            style={[
              globalStyles.cartExpandedArea,
              {
                backgroundColor: colors.background,
                maxHeight: cartScrollMaxHeight,
              },
            ]}
            showsVerticalScrollIndicator
          >
            {orderItems.length === 0 ? (
              <Text
                style={[
                  globalStyles.emptyCartText,
                  { color: colors.mutedText },
                ]}
              >
                {t.orderTakingEmptyCart || "Aún no hay productos."}
              </Text>
            ) : (
              orderItems.map((item: any) => (
                <View key={item.cartId} style={globalStyles.cartItemRow}>
                  <View style={globalStyles.cartItemInfo}>
                    <View style={globalStyles.cartItemTitleRow}>
                      <Text
                        style={[
                          globalStyles.cartItemText,
                          { color: colors.text },
                        ]}
                      >
                        <Text
                          style={{
                            fontWeight: "900",
                            color: colors.accent,
                            fontFamily: baseFontFamily,
                          }}
                        >
                          {item.quantity}x{" "}
                        </Text>
                        {item.name}
                        {item.alreadySubmitted && (
                          <Text
                            style={{
                              fontSize: 11,
                              color: colors.mutedText,
                              fontStyle: "italic",
                            }}
                          >
                            {"  "}✓ {item.isDelivered || item.status === "Delivered"
                              ? t.orderTakingAlreadyDelivered || "Entregado"
                              : item.status === "Ready"
                                ? t.orderTakingReady || "Listo"
                                : t.orderTakingAlreadySent || "Ya en cocina"}
                          </Text>
                        )}
                      </Text>
                      {canEditCartItem(item) && (
                        <TouchableOpacity
                          style={[
                            globalStyles.cartNoteButton,
                            item.note && globalStyles.cartNoteButtonActive,
                            {
                              backgroundColor: item.note
                                ? colors.accentSoft
                                : colors.elevatedSurface,
                              borderColor: item.note ? colors.accent : colors.border,
                            },
                          ]}
                          onPress={() => openItemNoteModal(item)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="document-text-outline"
                            size={16}
                            color={item.note ? colors.accent : colors.mutedText}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                    {!!item.note && (
                      <Text
                        style={[
                          globalStyles.cartItemNote,
                          { color: colors.success },
                        ]}
                        numberOfLines={2}
                      >
                        📝 {item.note}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={[
                        globalStyles.toGoToggleBtn,
                        item.isToGo && globalStyles.toGoToggleBtnActive,
                        { backgroundColor: item.isToGo ? colors.accentSoft : colors.elevatedSurface, borderColor: item.isToGo ? colors.accent : colors.border },
                      ]}
                      onPress={() => toggleItemToGo(item.cartId)}
                    >
                      <Text
                        style={[
                          globalStyles.toGoToggleText,
                          { color: item.isToGo ? colors.accent : colors.text },
                        ]}
                      >
                        {item.isToGo
                          ? `🛍️ ${t.dashboardParaLlevar || "Para Llevar"}`
                          : `🍽️ ${t.dashboardTabTables || "Mesa"}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={[globalStyles.cartItemPrice, { color: colors.text }]}
                  >
                    ${(item.price * item.quantity).toLocaleString()}
                  </Text>
                  {canEditCartItem(item) && (
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(item.cartId)}
                      style={[globalStyles.deleteButton, { backgroundColor: colors.accentSoft }]}
                    >
                      <Text
                        style={[
                          globalStyles.deleteButtonText,
                          { color: colors.danger },
                        ]}
                      >
                        ✕
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}

            {activeTableForOrder.isGlobalToGo && orderItems.length > 0 && (
              <View
                style={[
                  globalStyles.destinationBox,
                  { borderTopColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    globalStyles.destinationTitle,
                    { color: colors.text },
                  ]}
                >
                  {t.orderTakingForWho || "¿Para quién es este pedido?"}
                </Text>
                <View style={globalStyles.destTabs}>
                  <TouchableOpacity
                    style={[
                      globalStyles.destTab,
                      destType === "particular" && globalStyles.destTabActive,
                      {
                        backgroundColor:
                          destType === "particular"
                            ? colors.accent
                            : colors.elevatedSurface,
                        borderColor:
                          destType === "particular" ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => setDestType("particular")}
                  >
                    <Text
                      style={[
                        globalStyles.destTabText,
                        destType === "particular" &&
                          globalStyles.destTabTextActive,
                        {
                          color:
                            destType === "particular" ? "#FFFFFF" : colors.text,
                        },
                      ]}
                    >
                      {t.orderTakingParticular || "👤 Particular"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      globalStyles.destTab,
                      destType === "mesa" && globalStyles.destTabActive,
                      {
                        backgroundColor:
                          destType === "mesa" ? colors.accent : colors.elevatedSurface,
                        borderColor:
                          destType === "mesa" ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => setDestType("mesa")}
                  >
                    <Text
                      style={[
                        globalStyles.destTabText,
                        destType === "mesa" && globalStyles.destTabTextActive,
                        {
                          color: destType === "mesa" ? "#FFFFFF" : colors.text,
                        },
                      ]}
                    >
                      {t.orderTakingTable || "🪑 A una Mesa"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {destType === "particular" && (
                  <TextInput
                    style={[globalStyles.inlineInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    placeholder={
                      t.orderTakingCustomerPlaceholder ||
                      "Nombre del cliente (Opcional)"
                    }
                    placeholderTextColor={colors.mutedText}
                    value={toGoCustomerName}
                    onChangeText={setToGoCustomerName}
                  />
                )}
                {destType === "mesa" && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={globalStyles.tablesScroll}
                  >
                    {tables.map((t: any) => (
                      <TouchableOpacity
                        key={t.id}
                        style={[
                          globalStyles.miniTableBtn,
                          linkedTableId === t.id &&
                            globalStyles.miniTableBtnActive,
                          {
                            backgroundColor:
                              linkedTableId === t.id
                                ? colors.accent
                                : colors.elevatedSurface,
                            borderColor:
                              linkedTableId === t.id ? colors.accent : colors.border,
                          },
                        ]}
                        onPress={() => setLinkedTableId(t.id)}
                      >
                        <Text
                          style={[
                            globalStyles.miniTableText,
                            linkedTableId === t.id &&
                              globalStyles.miniTableTextActive,
                            {
                              color:
                                linkedTableId === t.id ? "#FFFFFF" : colors.text,
                            },
                          ]}
                        >
                          {t.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </ScrollView>
        )}

        <View style={[globalStyles.cartFooter, { borderTopColor: colors.border }]}>
          <View>
            <Text
              style={[globalStyles.cartTotalLabel, { color: colors.mutedText }]}
            >
              {t.orderTakingTotalLabel || "Total:"}
            </Text>
           <Text
              style={[globalStyles.cartTotalAmount, { color: colors.accent }]}
            >
              ${breakdown.total.toLocaleString()}
            </Text>
            <Text style={{ fontSize: 11, color: colors.mutedText }}>
              {breakdownLabels.subtotal} ${breakdown.subTotal.toLocaleString()}
              {breakdown.tax > 0 && (
                <>
                  {" · "}
                  {breakdownLabels.taxIncluded} ({taxRate}%) ${breakdown.tax.toLocaleString()}
                </>
              )}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              globalStyles.submitButton,
              orderItems.length === 0 && globalStyles.submitButtonDisabled,
              {
                backgroundColor: colors.accent,
                opacity: orderItems.length === 0 ? 0.55 : 1,
              },
            ]}
            disabled={orderItems.length === 0}
            onPress={handleSubmitOrder}
          >
            <Text style={globalStyles.submitButtonText}>
              {t.orderTakingSendKitchen || "Enviar a Cocina"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔥 MODAL DE DETALLES DEL PRODUCTO (CATÁLOGO) 🔥 */}
      <Modal
        transparent
        visible={isProductModalVisible}
        animationType="slide"
        onRequestClose={() => setIsProductModalVisible(false)}
      >
        <View style={localStyles.modalOverlay}>
          <View
            style={[
              localStyles.modalContent,
              { backgroundColor: colors.surface },
            ]}
          >
            {selectedProduct && (
              <>
                <TouchableOpacity
                  style={localStyles.closeModalBtn}
                  onPress={() => setIsProductModalVisible(false)}
                >
                  <Ionicons
                    name="close-circle"
                    size={32}
                    color={colors.mutedText}
                  />
                </TouchableOpacity>

                <View
                  style={[
                    localStyles.modalIconContainer,
                    { backgroundColor: `${colors.accent}15` },
                  ]}
                >
                  {resolvePhotoUrl(selectedProduct.photo) ? (
                    <ExpoImage
                      source={{ uri: resolvePhotoUrl(selectedProduct.photo)! }}
                      style={{ width: 100, height: 100, borderRadius: 12 }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={120}
                    />
                  ) : (
                    <Ionicons
                      name={
                        getCategoryIcon(selectedProduct.categoryName) as any
                      }
                      size={70}
                      color={colors.accent}
                    />
                  )}
                </View>

                <Text style={[localStyles.modalTitle, { color: colors.text }]}>
                  {selectedProduct.name}
                </Text>
                <Text
                  style={[localStyles.modalCategory, { color: colors.accent }]}
                >
                  {selectedProduct.categoryName}
                </Text>

                <View
                  style={[
                    localStyles.modalDivider,
                    { backgroundColor: colors.border },
                  ]}
                />

                <Text
                  style={[localStyles.modalDesc, { color: colors.mutedText }]}
                >
                  {selectedProduct.description}
                </Text>

                <View style={localStyles.modalPriceRow}>
                  <Text
                    style={[
                      localStyles.modalPriceLabel,
                      { color: colors.text },
                    ]}
                  >
                    {t.orderTakingPriceLabel || "Precio unitario:"}
                  </Text>
                  <Text
                    style={[
                      localStyles.modalPriceValue,
                      { color: colors.accent },
                    ]}
                  >
                    {selectedProduct.price.toLocaleString()}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    localStyles.modalAddBtn,
                    { backgroundColor: colors.accent },
                  ]}
                  onPress={handleAddFromModal}
                >
                  <Ionicons
                    name="cart"
                    size={20}
                    color="#FFF"
                    style={{ marginRight: 10 }}
                  />
                  <Text style={localStyles.modalAddBtnText}>
                    {t.orderTakingAddToOrder || "Agregar al pedido"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL DE NOTAS (El que ya tenías) */}
      <Modal
        transparent
        visible={isNoteModalVisible}
        animationType="fade"
        onRequestClose={() => setIsNoteModalVisible(false)}
      >
        <View style={globalStyles.noteModalOverlay}>
          <View
            style={[
              globalStyles.noteModalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                globalStyles.noteModalIconWrap,
                { backgroundColor: colors.accentSoft },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={28}
                color={colors.accent}
              />
            </View>
            <Text style={[globalStyles.noteModalTitle, { color: colors.text }]}>
              {t.orderTakingNoteTitle || "Agregar descripción"}
            </Text>
            <Text
              style={[
                globalStyles.noteModalSubtitle,
                { color: colors.mutedText },
              ]}
            >
              {t.orderTakingNoteSubtitle ||
                "Indica cómo lo quiere el cliente o qué no debe llevar."}
            </Text>

            <TextInput
              style={[globalStyles.noteModalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder={
                t.orderTakingNotePlaceholder ||
                "Ej: Sin cebolla, poco queso, bien cocida..."
              }
              placeholderTextColor={colors.mutedText}
              value={itemNote}
              onChangeText={setItemNote}
              multiline
            />

            <View style={globalStyles.noteModalActions}>
              <TouchableOpacity
                style={[globalStyles.noteModalCancelBtn, { backgroundColor: colors.elevatedSurface }]}
                onPress={() => setIsNoteModalVisible(false)}
              >
                <Text style={[globalStyles.noteModalCancelText, { color: colors.text }]}>
                  {t.orderTakingNoteCancel || "Cancelar"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[globalStyles.noteModalConfirmBtn, { backgroundColor: colors.accent }]}
                onPress={confirmUpdateNote}
              >
                <Text style={globalStyles.noteModalConfirmText}>
                  {t.orderTakingNoteSave || "Guardar nota"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// moved to ./style/OrderTakingStyles.ts
