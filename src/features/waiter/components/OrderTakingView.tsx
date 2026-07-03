import React, { useState } from 'react';
import { FlatList, Text, TouchableOpacity, View, LayoutAnimation, SafeAreaView, ScrollView, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './style/WaiterDashboardStyles';
import { useWaiterTheme } from '@/features/waiter/context/WaiterThemeContext';
import { useWaiterLanguage } from '@/features/waiter/context/WaiterLanguageContext';

// Los items del menú ahora viven aquí ya que solo esta vista los necesita
const MENU_ITEMS = [
  { id: 'm1', name: 'Hamburguesa Sabor', price: 15000, desc: 'Doble carne, queso cheddar.', category: 'COCINA' },
  { id: 'm2', name: 'Pizza Express', price: 18000, desc: 'Pepperoni y extra queso.', category: 'COCINA' },
  { id: 'm3', name: 'Papas Francesas', price: 5000, desc: 'Porción grande.', category: 'COCINA' },
  { id: 'm4', name: 'Gaseosa 500ml', price: 4000, desc: 'Coca-Cola o Sprite.', category: 'SOLO_PASAR' },
  { id: 'm5', name: 'Jugo Natural', price: 6000, desc: 'Mango o Mora.', category: 'SOLO_PASAR' },
];

export const OrderTakingView = ({
  activeTableForOrder, setActiveTableForOrder, orderItems, isCartExpanded, setIsCartExpanded,
  destType, setDestType, toGoCustomerName, setToGoCustomerName, tables, linkedTableId,
  setLinkedTableId, handleAddItem, handleRemoveItem, toggleItemToGo, handleUpdateItemNote, handleSubmitOrder
}: any) => {
  const { colors } = useWaiterTheme();
  const { t } = useWaiterLanguage();
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [selectedCartItem, setSelectedCartItem] = useState<any>(null);
  const [itemNote, setItemNote] = useState('');

  const orderTotal = orderItems.reduce((sum: any, item: any) => sum + (item.price * item.quantity), 0);
  let paddingBottom = isCartExpanded ? 350 : 150;
  if (activeTableForOrder.isGlobalToGo && isCartExpanded) paddingBottom = 450;

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.orderHeader, { backgroundColor: colors.header, borderColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => setActiveTableForOrder(null)}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.orderHeaderTitle, { color: colors.mutedText }]}>{t.orderTakingTitle || 'Tomando pedido'}</Text>
          <Text style={[styles.orderHeaderTable, { color: colors.text }]}>{activeTableForOrder.name}</Text>
        </View>
      </View>

      <FlatList
        data={MENU_ITEMS}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.menuList, { paddingBottom, backgroundColor: colors.background }]}
        renderItem={({ item }) => (
          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => handleAddItem(item)} activeOpacity={0.7}>
              <Text style={[styles.menuItemName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.menuItemDesc, { color: colors.mutedText }]}>{item.desc}</Text>
            </TouchableOpacity>

            <View style={styles.menuCardActions}>
              <Text style={[styles.menuItemPrice, { color: colors.success }]}>${item.price.toLocaleString()}</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => handleAddItem(item)} activeOpacity={0.8}>
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View style={[styles.floatingCart, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.cartHeader}
          activeOpacity={0.8}
          onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setIsCartExpanded(!isCartExpanded); }}
        >
          <Text style={[styles.cartHeaderText, { color: colors.text }]}>{t.orderTakingCartTitle || 'Ver Carrito'} ({orderItems.reduce((acc: any, it: any) => acc + it.quantity, 0)} Productos)</Text>
          <Ionicons name={isCartExpanded ? "chevron-down" : "chevron-up"} size={20} color={colors.mutedText} />
        </TouchableOpacity>

        {isCartExpanded && (
          <ScrollView style={[styles.cartExpandedArea, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
            {orderItems.length === 0 ? <Text style={[styles.emptyCartText, { color: colors.mutedText }]}>{t.orderTakingEmptyCart || 'Aún no hay productos.'}</Text> :
              orderItems.map((item: any) => (
                <View key={item.cartId} style={styles.cartItemRow}>
                  <View style={styles.cartItemInfo}>
                    <View style={styles.cartItemTitleRow}>
                      <Text style={[styles.cartItemText, { color: colors.text }]}>
                        <Text style={{ fontWeight: '900', color: '#E61C24' }}>{item.quantity}x </Text>{item.name}
                      </Text>
                      <TouchableOpacity
                        style={[styles.cartNoteButton, item.note && styles.cartNoteButtonActive]}
                        onPress={() => openItemNoteModal(item)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="document-text-outline" size={16} color={item.note ? colors.accent : colors.mutedText} />
                      </TouchableOpacity>
                    </View>
                    {!!item.note && (
                      <Text style={[styles.cartItemNote, { color: colors.success }]} numberOfLines={2}>📝 {item.note}</Text>
                    )}
                    <TouchableOpacity
                      style={[styles.toGoToggleBtn, item.isToGo && styles.toGoToggleBtnActive]}
                      onPress={() => toggleItemToGo(item.cartId)}
                    >
                      <Text style={[styles.toGoToggleText, item.isToGo && styles.toGoToggleTextActive]}>
                        {item.isToGo ? '🛍️ Empacar para llevar' : '🍽️ Consumo en Mesa'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.cartItemPrice, { color: colors.text }]}>${(item.price * item.quantity).toLocaleString()}</Text>
                  <TouchableOpacity onPress={() => handleRemoveItem(item.cartId)} style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            }

            {activeTableForOrder.isGlobalToGo && orderItems.length > 0 && (
              <View style={[styles.destinationBox, { borderTopColor: colors.border }]}>
                <Text style={[styles.destinationTitle, { color: colors.text }]}>{t.orderTakingForWho || '¿Para quién es este pedido?'}</Text>

                <View style={styles.destTabs}>
                  <TouchableOpacity style={[styles.destTab, destType === 'particular' && styles.destTabActive]} onPress={() => setDestType('particular')}>
                    <Text style={[styles.destTabText, destType === 'particular' && styles.destTabTextActive]}>{t.orderTakingParticular || '👤 Particular'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.destTab, destType === 'mesa' && styles.destTabActive]} onPress={() => setDestType('mesa')}>
                    <Text style={[styles.destTabText, destType === 'mesa' && styles.destTabTextActive]}>{t.orderTakingTable || '🪑 A una Mesa'}</Text>
                  </TouchableOpacity>
                </View>

                {destType === 'particular' && (
                  <TextInput
                    style={styles.inlineInput}
                    placeholder={t.orderTakingCustomerPlaceholder || 'Nombre del cliente (Opcional)'}
                    placeholderTextColor="#94A3B8"
                    value={toGoCustomerName}
                    onChangeText={setToGoCustomerName}
                  />
                )}

                {destType === 'mesa' && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tablesScroll}>
                    {tables.map((t: any) => (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.miniTableBtn, linkedTableId === t.id && styles.miniTableBtnActive]}
                        onPress={() => setLinkedTableId(t.id)}
                      >
                        <Text style={[styles.miniTableText, linkedTableId === t.id && styles.miniTableTextActive]}>{t.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </ScrollView>
        )}

        <View style={styles.cartFooter}>
          <View>
            <Text style={[styles.cartTotalLabel, { color: colors.mutedText }]}>Total:</Text>
            <Text style={[styles.cartTotalAmount, { color: colors.accent }]}>${orderTotal.toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            style={[styles.submitButton, orderItems.length === 0 && styles.submitButtonDisabled]}
            disabled={orderItems.length === 0} onPress={handleSubmitOrder}
          >
            <Text style={styles.submitButtonText}>Enviar a Cocina</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal transparent visible={isNoteModalVisible} animationType="fade" onRequestClose={() => setIsNoteModalVisible(false)}>
        <View style={styles.noteModalOverlay}>
          <View style={[styles.noteModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.noteModalIconWrap}>
              <Ionicons name="document-text-outline" size={28} color={colors.accent} />
            </View>
            <Text style={[styles.noteModalTitle, { color: colors.text }]}>{t.orderTakingNoteTitle || 'Agregar descripción'}</Text>
            <Text style={[styles.noteModalSubtitle, { color: colors.mutedText }]}> 
              {t.orderTakingNoteSubtitle || 'Indica cómo lo quiere el cliente o qué no debe llevar.'}
            </Text>

            <TextInput
              style={styles.noteModalInput}
              placeholder={t.orderTakingNotePlaceholder || 'Ej: Sin cebolla, poco queso, bien cocida...'}
              placeholderTextColor="#94A3B8"
              value={itemNote}
              onChangeText={setItemNote}
              multiline
            />

            <View style={styles.noteModalActions}>
              <TouchableOpacity style={styles.noteModalCancelBtn} onPress={() => setIsNoteModalVisible(false)}>
                <Text style={styles.noteModalCancelText}>{t.orderTakingNoteCancel || 'Cancelar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.noteModalConfirmBtn} onPress={confirmUpdateNote}>
                <Text style={styles.noteModalConfirmText}>{t.orderTakingNoteSave || 'Guardar nota'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};