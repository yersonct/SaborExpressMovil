import React from 'react';
import { FlatList, Text, TouchableOpacity, View, LayoutAnimation, SafeAreaView, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './style/WaiterDashboardStyles';

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
  setLinkedTableId, handleAddItem, handleRemoveItem, toggleItemToGo, handleSubmitOrder
}: any) => {
  const orderTotal = orderItems.reduce((sum: any, item: any) => sum + (item.price * item.quantity), 0);
  let paddingBottom = isCartExpanded ? 350 : 150;
  if (activeTableForOrder.isGlobalToGo && isCartExpanded) paddingBottom = 450;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.orderHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => setActiveTableForOrder(null)}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.orderHeaderTitle}>Tomando pedido</Text>
          <Text style={styles.orderHeaderTable}>{activeTableForOrder.name}</Text>
        </View>
      </View>

      <FlatList
        data={MENU_ITEMS}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.menuList, { paddingBottom }]}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.menuCard} onPress={() => handleAddItem(item)} activeOpacity={0.7}>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemName}>{item.name}</Text>
              <Text style={styles.menuItemDesc}>{item.desc}</Text>
              <Text style={styles.menuItemPrice}>${item.price.toLocaleString()}</Text>
            </View>
            <View style={styles.addButton}><Text style={styles.addButtonText}>+</Text></View>
          </TouchableOpacity>
        )}
      />

      <View style={styles.floatingCart}>
        <TouchableOpacity
          style={styles.cartHeader}
          activeOpacity={0.8}
          onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setIsCartExpanded(!isCartExpanded); }}
        >
          <Text style={styles.cartHeaderText}>Ver Carrito ({orderItems.reduce((acc: any, it: any) => acc + it.quantity, 0)} Productos)</Text>
          <Ionicons name={isCartExpanded ? "chevron-down" : "chevron-up"} size={20} color="#64748B" />
        </TouchableOpacity>

        {isCartExpanded && (
          <ScrollView style={styles.cartExpandedArea} showsVerticalScrollIndicator={false}>
            {orderItems.length === 0 ? <Text style={styles.emptyCartText}>Aún no hay productos.</Text> :
              orderItems.map((item: any) => (
                <View key={item.cartId} style={styles.cartItemRow}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemText}>
                      <Text style={{ fontWeight: '900', color: '#E61C24' }}>{item.quantity}x </Text>{item.name}
                    </Text>
                    <TouchableOpacity
                      style={[styles.toGoToggleBtn, item.isToGo && styles.toGoToggleBtnActive]}
                      onPress={() => toggleItemToGo(item.cartId)}
                    >
                      <Text style={[styles.toGoToggleText, item.isToGo && styles.toGoToggleTextActive]}>
                        {item.isToGo ? '🛍️ Empacar para llevar' : '🍽️ Consumo en Mesa'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cartItemPrice}>${(item.price * item.quantity).toLocaleString()}</Text>
                  <TouchableOpacity onPress={() => handleRemoveItem(item.cartId)} style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            }

            {activeTableForOrder.isGlobalToGo && orderItems.length > 0 && (
              <View style={styles.destinationBox}>
                <Text style={styles.destinationTitle}>¿Para quién es este pedido?</Text>

                <View style={styles.destTabs}>
                  <TouchableOpacity style={[styles.destTab, destType === 'particular' && styles.destTabActive]} onPress={() => setDestType('particular')}>
                    <Text style={[styles.destTabText, destType === 'particular' && styles.destTabTextActive]}>👤 Particular</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.destTab, destType === 'mesa' && styles.destTabActive]} onPress={() => setDestType('mesa')}>
                    <Text style={[styles.destTabText, destType === 'mesa' && styles.destTabTextActive]}>🪑 A una Mesa</Text>
                  </TouchableOpacity>
                </View>

                {destType === 'particular' && (
                  <TextInput
                    style={styles.inlineInput}
                    placeholder="Nombre del cliente (Opcional)"
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
            <Text style={styles.cartTotalLabel}>Total:</Text>
            <Text style={styles.cartTotalAmount}>${orderTotal.toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            style={[styles.submitButton, orderItems.length === 0 && styles.submitButtonDisabled]}
            disabled={orderItems.length === 0} onPress={handleSubmitOrder}
          >
            <Text style={styles.submitButtonText}>Enviar a Cocina</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};