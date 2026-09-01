import React, { useState, useMemo } from 'react';
import { FlatList, Text, TouchableOpacity, View, LayoutAnimation, SafeAreaView, ScrollView, TextInput, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles as globalStyles } from './style/WaiterDashboardStyles'; // Asumo que tus estilos globales están aquí
import { localStyles } from './style/OrderTakingStyles';
import { useWaiterTheme } from '@/features/waiter/context/WaiterThemeContext';
import { useWaiterLanguage } from '@/features/waiter/context/WaiterLanguageContext';

// Los items del menú
const MENU_ITEMS = [
  { id: 'm1', name: 'Hamburguesa Sabor', price: 15000, desc: 'Doble carne de res 150g, queso cheddar, tocino ahumado, lechuga, tomate y salsa especial de la casa.', category: 'COCINA' },
  { id: 'm2', name: 'Pizza Express', price: 18000, desc: 'Pizza personal de 4 porciones con pepperoni madurado y extra queso mozzarella.', category: 'COCINA' },
  { id: 'm3', name: 'Papas Francesas', price: 5000, desc: 'Porción grande de papas a la francesa crocantes con sal paprika.', category: 'COCINA' },
  { id: 'm4', name: 'Gaseosa 500ml', price: 4000, desc: 'Gaseosa en botella PET (Coca-Cola, Sprite, Quatro).', category: 'BEBIDAS' },
  { id: 'm5', name: 'Jugo Natural', price: 6000, desc: 'Jugo natural en agua o leche (Mango, Mora, Lulo, Maracuyá).', category: 'BEBIDAS' },
  { id: 'm6', name: 'Brownie Helado', price: 8000, desc: 'Brownie caliente de chocolate artesanal acompañado de una bola de helado de vainilla.', category: 'POSTRES' },
];

export const OrderTakingView = ({
  activeTableForOrder, setActiveTableForOrder, orderItems, isCartExpanded, setIsCartExpanded,
  destType, setDestType, toGoCustomerName, setToGoCustomerName, tables, linkedTableId,
  setLinkedTableId, handleAddItem, handleRemoveItem, toggleItemToGo, handleUpdateItemNote, handleSubmitOrder
}: any) => {
  const { colors } = useWaiterTheme();
  const { t } = useWaiterLanguage();
  const baseFontFamily = Platform.select({ web: 'system-ui, -apple-system, sans-serif', default: undefined });

  // Estados para notas
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [selectedCartItem, setSelectedCartItem] = useState<any>(null);
  const [itemNote, setItemNote] = useState('');

  // 🔥 NUEVOS ESTADOS PARA EL CATÁLOGO PROFESIONAL
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);

  // Cálculos de carrito
  const orderTotal = orderItems.reduce((sum: any, item: any) => sum + (item.price * item.quantity), 0);
  let paddingBottom = isCartExpanded ? 350 : 150;
  if (activeTableForOrder.isGlobalToGo && isCartExpanded) paddingBottom = 450;

  // Lógica de Categorías
  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(MENU_ITEMS.map(item => item.category)));
    return [t.categoriesAllLabel || 'Todas', ...uniqueCats];
  }, [t]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'Todas') return MENU_ITEMS;
    return MENU_ITEMS.filter(item => item.category === activeCategory);
  }, [activeCategory]);

  // Funciones de Notas
  const openItemNoteModal = (item: any) => {
    setSelectedCartItem(item);
    setItemNote(item.note || '');
    setIsNoteModalVisible(true);
  };

  const confirmUpdateNote = () => {
    if (!selectedCartItem) return;
    handleUpdateItemNote(selectedCartItem.cartId, itemNote.trim());
    setIsNoteModalVisible(false);
    setSelectedCartItem(null);
    setItemNote('');
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
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'COCINA': return 'fast-food';
      case 'BEBIDAS': return 'cafe';
      case 'POSTRES': return 'ice-cream';
      default: return 'restaurant';
    }
  };

  return (
    <SafeAreaView style={[globalStyles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[globalStyles.orderHeader, { backgroundColor: colors.header, borderColor: colors.border }]}>
        <TouchableOpacity style={globalStyles.backButton} onPress={() => setActiveTableForOrder(null)}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[globalStyles.orderHeaderTitle, { color: colors.mutedText }]}>{t.orderTakingTitle || 'Tomando pedido'}</Text>
          <Text style={[globalStyles.orderHeaderTable, { color: colors.text }]}>{activeTableForOrder.name}</Text>
        </View>
      </View>

      {/* 🔥 CATEGORÍAS HORIZONTALES 🔥 */}
      <View style={{ backgroundColor: colors.header, paddingVertical: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, gap: 10 }}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                localStyles.categoryTab,
                { backgroundColor: activeCategory === cat ? colors.accent : colors.elevatedSurface, borderColor: colors.border }
              ]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setActiveCategory(cat);
              }}
            >
              <Text style={[localStyles.categoryTabText, { color: activeCategory === cat ? '#FFFFFF' : colors.text }]}>
                {cat === (t.categoriesAllLabel || 'Todas') ? (t.categoriesAllLabel || '⭐ Todas') : (t['category' + cat] || cat)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 🔥 CATÁLOGO GRID (CUADRÍCULA) 🔥 */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={localStyles.gridRow}
        contentContainerStyle={{ padding: 15, paddingBottom, backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[localStyles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Tocar la tarjeta abre el modal de descripción */}
            <TouchableOpacity style={localStyles.gridCardContent} onPress={() => openProductDetails(item)} activeOpacity={0.7}>
              <View style={[localStyles.iconContainer, { backgroundColor: `${colors.accent}15` }]}>
                <Ionicons name={getCategoryIcon(item.category) as any} size={36} color={colors.accent} />
              </View>
              <Text style={[localStyles.gridItemName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
              <Text style={[localStyles.gridItemPrice, { color: colors.text }]}>${item.price.toLocaleString()}</Text>
            </TouchableOpacity>

            {/* El botón + agrega directo al carrito */}
            <TouchableOpacity
              style={[localStyles.quickAddButton, { backgroundColor: colors.accent }]}
              onPress={() => handleAddItem(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* EL CARRITO FLOTANTE (Sin cambios drásticos para no romper tu lógica actual) */}
      <View style={[globalStyles.floatingCart, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={globalStyles.cartHeader}
          activeOpacity={0.8}
          onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setIsCartExpanded(!isCartExpanded); }}
        >
          <Text style={[globalStyles.cartHeaderText, { color: colors.text }]}>{t.orderTakingCartTitle || 'Ver Carrito'} ({orderItems.reduce((acc: any, it: any) => acc + it.quantity, 0)} Productos)</Text>
          <Ionicons name={isCartExpanded ? "chevron-down" : "chevron-up"} size={20} color={colors.mutedText} />
        </TouchableOpacity>

        {isCartExpanded && (
          <ScrollView style={[globalStyles.cartExpandedArea, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
            {orderItems.length === 0 ? <Text style={[globalStyles.emptyCartText, { color: colors.mutedText }]}>{t.orderTakingEmptyCart || 'Aún no hay productos.'}</Text> :
              orderItems.map((item: any) => (
                <View key={item.cartId} style={globalStyles.cartItemRow}>
                  <View style={globalStyles.cartItemInfo}>
                    <View style={globalStyles.cartItemTitleRow}>
                      <Text style={[globalStyles.cartItemText, { color: colors.text }]}>
                        <Text style={{ fontWeight: '900', color: '#E61C24', fontFamily: baseFontFamily }}>{item.quantity}x </Text>{item.name}
                      </Text>
                      <TouchableOpacity
                        style={[globalStyles.cartNoteButton, item.note && globalStyles.cartNoteButtonActive]}
                        onPress={() => openItemNoteModal(item)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="document-text-outline" size={16} color={item.note ? colors.accent : colors.mutedText} />
                      </TouchableOpacity>
                    </View>
                    {!!item.note && (
                      <Text style={[globalStyles.cartItemNote, { color: colors.success }]} numberOfLines={2}>📝 {item.note}</Text>
                    )}
                    <TouchableOpacity
                      style={[globalStyles.toGoToggleBtn, item.isToGo && globalStyles.toGoToggleBtnActive]}
                      onPress={() => toggleItemToGo(item.cartId)}
                    >
                      <Text style={[globalStyles.toGoToggleText, item.isToGo && globalStyles.toGoToggleTextActive]}>
                        {item.isToGo ? `🛍️ ${t.dashboardParaLlevar || 'Para Llevar'}` : `🍽️ ${t.dashboardTabTables || 'Mesa'}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[globalStyles.cartItemPrice, { color: colors.text }]}>${(item.price * item.quantity).toLocaleString()}</Text>
                  <TouchableOpacity onPress={() => handleRemoveItem(item.cartId)} style={globalStyles.deleteButton}>
                    <Text style={globalStyles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            }

            {activeTableForOrder.isGlobalToGo && orderItems.length > 0 && (
              <View style={[globalStyles.destinationBox, { borderTopColor: colors.border }]}>
                <Text style={[globalStyles.destinationTitle, { color: colors.text }]}>{t.orderTakingForWho || '¿Para quién es este pedido?'}</Text>
                <View style={globalStyles.destTabs}>
                  <TouchableOpacity style={[globalStyles.destTab, destType === 'particular' && globalStyles.destTabActive]} onPress={() => setDestType('particular')}>
                    <Text style={[globalStyles.destTabText, destType === 'particular' && globalStyles.destTabTextActive]}>{t.orderTakingParticular || '👤 Particular'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[globalStyles.destTab, destType === 'mesa' && globalStyles.destTabActive]} onPress={() => setDestType('mesa')}>
                    <Text style={[globalStyles.destTabText, destType === 'mesa' && globalStyles.destTabTextActive]}>{t.orderTakingTable || '🪑 A una Mesa'}</Text>
                  </TouchableOpacity>
                </View>
                {destType === 'particular' && (
                  <TextInput
                    style={globalStyles.inlineInput}
                    placeholder={t.orderTakingCustomerPlaceholder || 'Nombre del cliente (Opcional)'}
                    placeholderTextColor="#94A3B8"
                    value={toGoCustomerName}
                    onChangeText={setToGoCustomerName}
                  />
                )}
                {destType === 'mesa' && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={globalStyles.tablesScroll}>
                    {tables.map((t: any) => (
                      <TouchableOpacity
                        key={t.id}
                        style={[globalStyles.miniTableBtn, linkedTableId === t.id && globalStyles.miniTableBtnActive]}
                        onPress={() => setLinkedTableId(t.id)}
                      >
                        <Text style={[globalStyles.miniTableText, linkedTableId === t.id && globalStyles.miniTableTextActive]}>{t.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </ScrollView>
        )}

        <View style={globalStyles.cartFooter}>
          <View>
            <Text style={[globalStyles.cartTotalLabel, { color: colors.mutedText }]}>Total:</Text>
            <Text style={[globalStyles.cartTotalAmount, { color: colors.accent }]}>${orderTotal.toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            style={[globalStyles.submitButton, orderItems.length === 0 && globalStyles.submitButtonDisabled]}
            disabled={orderItems.length === 0} onPress={handleSubmitOrder}
          >
            <Text style={globalStyles.submitButtonText}>{t.orderTakingSendKitchen || 'Enviar a Cocina'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔥 MODAL DE DETALLES DEL PRODUCTO (CATÁLOGO) 🔥 */}
      <Modal transparent visible={isProductModalVisible} animationType="slide" onRequestClose={() => setIsProductModalVisible(false)}>
        <View style={localStyles.modalOverlay}>
          <View style={[localStyles.modalContent, { backgroundColor: colors.background }]}>
            {selectedProduct && (
              <>
                <TouchableOpacity style={localStyles.closeModalBtn} onPress={() => setIsProductModalVisible(false)}>
                  <Ionicons name="close-circle" size={32} color={colors.mutedText} />
                </TouchableOpacity>

                <View style={[localStyles.modalIconContainer, { backgroundColor: `${colors.accent}15` }]}>
                  <Ionicons name={getCategoryIcon(selectedProduct.category) as any} size={70} color={colors.accent} />
                </View>

                <Text style={[localStyles.modalTitle, { color: colors.text }]}>{selectedProduct.name}</Text>
                <Text style={[localStyles.modalCategory, { color: colors.accent }]}>{selectedProduct.category}</Text>

                <View style={localStyles.modalDivider} />

                <Text style={[localStyles.modalDesc, { color: colors.mutedText }]}>{selectedProduct.desc}</Text>

                <View style={localStyles.modalPriceRow}>
                  <Text style={[localStyles.modalPriceLabel, { color: colors.text }]}>{t.orderTakingPriceLabel || 'Precio unitario:'}</Text>
                  <Text style={[localStyles.modalPriceValue, { color: colors.accent }]}>{selectedProduct.price.toLocaleString()}</Text>
                </View>

                <TouchableOpacity style={[localStyles.modalAddBtn, { backgroundColor: colors.accent }]} onPress={handleAddFromModal}>
                  <Ionicons name="cart" size={20} color="#FFF" style={{ marginRight: 10 }} />
                  <Text style={localStyles.modalAddBtnText}>{t.orderTakingAddToOrder || 'Agregar al pedido'}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL DE NOTAS (El que ya tenías) */}
      <Modal transparent visible={isNoteModalVisible} animationType="fade" onRequestClose={() => setIsNoteModalVisible(false)}>
        <View style={globalStyles.noteModalOverlay}>
          <View style={[globalStyles.noteModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={globalStyles.noteModalIconWrap}>
              <Ionicons name="document-text-outline" size={28} color={colors.accent} />
            </View>
            <Text style={[globalStyles.noteModalTitle, { color: colors.text }]}>{t.orderTakingNoteTitle || 'Agregar descripción'}</Text>
            <Text style={[globalStyles.noteModalSubtitle, { color: colors.mutedText }]}>
              {t.orderTakingNoteSubtitle || 'Indica cómo lo quiere el cliente o qué no debe llevar.'}
            </Text>

            <TextInput
              style={globalStyles.noteModalInput}
              placeholder={t.orderTakingNotePlaceholder || 'Ej: Sin cebolla, poco queso, bien cocida...'}
              placeholderTextColor="#94A3B8"
              value={itemNote}
              onChangeText={setItemNote}
              multiline
            />

            <View style={globalStyles.noteModalActions}>
              <TouchableOpacity style={globalStyles.noteModalCancelBtn} onPress={() => setIsNoteModalVisible(false)}>
                <Text style={globalStyles.noteModalCancelText}>{t.orderTakingNoteCancel || 'Cancelar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={globalStyles.noteModalConfirmBtn} onPress={confirmUpdateNote}>
                <Text style={globalStyles.noteModalConfirmText}>{t.orderTakingNoteSave || 'Guardar nota'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// moved to ./style/OrderTakingStyles.ts