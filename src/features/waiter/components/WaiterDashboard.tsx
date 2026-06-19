import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  SafeAreaView, 
  Alert, 
  LayoutAnimation, 
  Platform, 
  UIManager,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router'; 
import { DrawerActions } from '@react-navigation/native';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// 1. DATOS SIMULADOS
const INITIAL_TABLES = [
  { id: 't1', name: 'Mesa 1', capacity: 2, status: 'Libre', type: 'normal' },
  { id: 't2', name: 'Mesa 2', capacity: 4, status: 'Ocupada', type: 'normal' },
  { id: 't3', name: 'Mesa 3', capacity: 4, status: 'Libre', type: 'normal' },
  { id: 't4', name: 'Mesa VIP', capacity: 8, status: 'Libre', type: 'vip' },
  { id: 't5', name: 'Terraza 1', capacity: 2, status: 'Libre', type: 'outdoor' },
  { id: 't6', name: 'Barra', capacity: 1, status: 'Libre', type: 'bar' },
];

const INITIAL_ORDERS = [
  { 
    id: 'ORD-001', 
    tableId: 't2', 
    tableName: 'Mesa 2', 
    time: '12:30 PM', 
    status: 'PREPARANDO', 
    total: 35000,
    items: [
      { id: 'm1', name: 'Hamburguesa Sabor', quantity: 2, price: 15000, category: 'COCINA', cartId: 'c1', isToGo: false },
      { id: 'm3', name: 'Papas Francesas', quantity: 1, price: 5000, category: 'COCINA', cartId: 'c2', isToGo: true }
    ]
  }
];

const MENU_ITEMS = [
  { id: 'm1', name: 'Hamburguesa Sabor', price: 15000, desc: 'Doble carne, queso cheddar.', category: 'COCINA' },
  { id: 'm2', name: 'Pizza Express', price: 18000, desc: 'Pepperoni y extra queso.', category: 'COCINA' },
  { id: 'm3', name: 'Papas Francesas', price: 5000, desc: 'Porción grande.', category: 'COCINA' },
  { id: 'm4', name: 'Gaseosa 500ml', price: 4000, desc: 'Coca-Cola o Sprite.', category: 'SOLO_PASAR' },
  { id: 'm5', name: 'Jugo Natural', price: 6000, desc: 'Mango o Mora.', category: 'SOLO_PASAR' },
];

export const WaiterDashboard = () => {
  const navigation = useNavigation();

  // Estados principales del Dashboard
  const [activeTab, setActiveTab] = useState<'MESAS' | 'ORDENES'>('MESAS');
  const [tables, setTables] = useState<any[]>(INITIAL_TABLES);
  const [activeOrders, setActiveOrders] = useState<any[]>(INITIAL_ORDERS);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Estados para el flujo de tomar pedido y Carrito
  const [activeTableForOrder, setActiveTableForOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  
  // Estados exclusivos para cuando se inicia un pedido "Para Llevar" global
  const [destType, setDestType] = useState<'particular' | 'mesa'>('particular');
  const [linkedTableId, setLinkedTableId] = useState<string | null>(null);
  const [toGoCustomerName, setToGoCustomerName] = useState(''); // Nombre de la persona particular

  // --- LÓGICA DE NAVEGACIÓN Y SELECCIÓN ---
  const handleTablePress = (table: any) => {
    if (table.status === 'Ocupada') {
      Alert.alert('Mesa Ocupada', 'Ve a la pestaña "Órdenes Activas" para ver o agregar productos a esta mesa.', [
        { text: 'Ver Órdenes', onPress: () => setActiveTab('ORDENES') },
        { text: 'Cancelar', style: 'cancel' }
      ]);
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTableForOrder({ ...table, isGlobalToGo: false });
    setOrderItems([]);
  };

  // 🔥 VAMOS DIRECTO AL MENÚ AL TOCAR "PARA LLEVAR" (Sin modales extraños)
  const handleStartToGoOrder = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTableForOrder({
      id: `temp_togo`,
      name: `Pedido Para Llevar`,
      isGlobalToGo: true // Bandera especial que activará las opciones en el carrito
    });
    setDestType('particular');
    setLinkedTableId(null);
    setToGoCustomerName('');
    setOrderItems([]);
  };

  const handleAddMoreToOrder = (existingOrder: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    let table = tables.find(t => t.id === existingOrder.tableId) || 
                { id: existingOrder.tableId, name: existingOrder.tableName, status: 'Ocupada', isGlobalToGo: false };
    
    setActiveTableForOrder(table);
    setOrderItems([...existingOrder.items]); 
    setIsCartExpanded(false);
  };

  // --- LÓGICA DEL CARRITO ---
  const handleAddItem = (product: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const defaultToGo = activeTableForOrder?.isGlobalToGo ? true : false;
    
    // Buscamos si el producto ya está y tiene el mismo estado de "Para llevar"
    const existingIndex = orderItems.findIndex(item => item.id === product.id && item.isToGo === defaultToGo);
    
    if (existingIndex >= 0) {
      const newItems = [...orderItems];
      newItems[existingIndex].quantity += 1;
      setOrderItems(newItems);
    } else {
      setOrderItems([...orderItems, { ...product, quantity: 1, isToGo: defaultToGo, cartId: Math.random().toString() }]);
    }
    if (orderItems.length === 0) setIsCartExpanded(true);
  };

  const handleRemoveItem = (cartId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updated = orderItems.filter(item => item.cartId !== cartId);
    setOrderItems(updated);
    if (updated.length === 0) setIsCartExpanded(false);
  };

  const toggleItemToGo = (cartId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOrderItems(items => items.map(i => i.cartId === cartId ? { ...i, isToGo: !i.isToGo } : i));
  };

  const handleSubmitOrder = () => {
    if (orderItems.length === 0) return Alert.alert('Error', 'Agrega productos al pedido.');

    let finalTableId = activeTableForOrder.id;
    let finalTableName = activeTableForOrder.name;
    let updateRealTable = false;

    // 🔥 RESOLVER EL DESTINO DESDE EL CARRITO
    if (activeTableForOrder.isGlobalToGo) {
      if (destType === 'particular') {
        finalTableId = `particular_${Date.now()}`;
        const personName = toGoCustomerName.trim() !== '' ? toGoCustomerName.trim() : 'Particular';
        finalTableName = `Llevar - ${personName}`;
      } else {
        // Asignarlo a una mesa física
        if (!linkedTableId) return Alert.alert('Aviso', 'Selecciona a qué mesa asignar este pedido para llevar.');
        const t = tables.find(x => x.id === linkedTableId);
        finalTableId = t.id;
        finalTableName = t.name;
        updateRealTable = true;
      }
    } else {
      updateRealTable = true;
    }

    const orderTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const existingOrderIndex = activeOrders.findIndex(o => o.tableId === finalTableId);

    if (existingOrderIndex >= 0) {
      // ACTUALIZAR ORDEN EXISTENTE
      const currentOrder = activeOrders[existingOrderIndex];
      
      // Fusionar items: Si ya había, reemplazamos con el carrito actual
      const updatedOrders = [...activeOrders];
      updatedOrders[existingOrderIndex] = {
        ...currentOrder,
        items: orderItems,
        total: orderTotal,
        status: 'PREPARANDO' 
      };
      setActiveOrders(updatedOrders);
      Alert.alert('¡Pedido Actualizado!', `Se actualizó la cuenta de ${finalTableName}.`);
    } else {
      // CREAR ORDEN NUEVA
      const newOrder = {
        id: `ORD-${Math.floor(Math.random() * 1000)}`,
        tableId: finalTableId,
        tableName: finalTableName,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'PREPARANDO',
        total: orderTotal,
        items: orderItems
      };
      setActiveOrders([newOrder, ...activeOrders]);
      Alert.alert('¡Pedido Enviado!', `El pedido fue enviado a la cocina.`);
    }

    // Cambiar la mesa a ocupada si aplica
    if (updateRealTable) {
      setTables(tables.map(t => t.id === finalTableId ? { ...t, status: 'Ocupada' } : t));
    }
    
    // Limpiar estado y volver
    setActiveTableForOrder(null);
    setOrderItems([]);
    setToGoCustomerName('');
    setActiveTab('ORDENES');
  };

  // --- VISTA 1: TOMANDO EL PEDIDO (EL CATÁLOGO DE PRODUCTOS) ---
  if (activeTableForOrder) {
    const orderTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Altura del padding para que no se oculte contenido debajo del carrito
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

        {/* CARRITO FLOTANTE Y SELECTOR DE DESTINO EN LA MISMA VISTA */}
        <View style={styles.floatingCart}>
          <TouchableOpacity 
            style={styles.cartHeader} 
            activeOpacity={0.8} 
            onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setIsCartExpanded(!isCartExpanded); }}
          >
            <Text style={styles.cartHeaderText}>Ver Carrito ({orderItems.reduce((acc, it) => acc + it.quantity, 0)} items)</Text>
            <Ionicons name={isCartExpanded ? "chevron-down" : "chevron-up"} size={20} color="#64748B" />
          </TouchableOpacity>

          {isCartExpanded && (
            <ScrollView style={styles.cartExpandedArea} showsVerticalScrollIndicator={false}>
              {orderItems.length === 0 ? <Text style={styles.emptyCartText}>Aún no hay productos.</Text> : 
                orderItems.map((item) => (
                  <View key={item.cartId} style={styles.cartItemRow}>
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemText}>
                        <Text style={{fontWeight: '900', color: '#E61C24'}}>{item.quantity}x </Text>{item.name}
                      </Text>
                      {/* BOTÓN INDIVIDUAL: EMPACAR O MESA */}
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

              {/* 🔥 SELECTOR DE DESTINO (Aparece abajo del carrito solo si iniciaste "Para Llevar") */}
              {activeTableForOrder.isGlobalToGo && orderItems.length > 0 && (
                 <View style={styles.destinationBox}>
                    <Text style={styles.destinationTitle}>¿Para quién es este pedido?</Text>
                    
                    <View style={styles.destTabs}>
                       <TouchableOpacity style={[styles.destTab, destType==='particular' && styles.destTabActive]} onPress={()=>setDestType('particular')}>
                          <Text style={[styles.destTabText, destType==='particular' && styles.destTabTextActive]}>👤 Particular</Text>
                       </TouchableOpacity>
                       <TouchableOpacity style={[styles.destTab, destType==='mesa' && styles.destTabActive]} onPress={()=>setDestType('mesa')}>
                          <Text style={[styles.destTabText, destType==='mesa' && styles.destTabTextActive]}>🪑 A una Mesa</Text>
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
                          {tables.map(t => (
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
  }

  // --- VISTAS 2 Y 3: DASHBOARD PRINCIPAL (MESAS Y ÓRDENES) ---
  return (
    <SafeAreaView style={styles.container}>
      
      {/* CABECERA CON MENÚ HAMBURGUESA */}
      <View style={styles.mainHeader}>
        <TouchableOpacity 
          style={styles.menuHamburgerBtn} 
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={32} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.headerTitlesBox}>
          <Text style={styles.mainTitle}>saborEXPRESS</Text>
          <Text style={styles.mainSubtitle}>Panel de Mesero</Text>
        </View>
        
        {/* BOTÓN "PARA LLEVAR" QUE LLEVA DIRECTO AL MENÚ */}
        <TouchableOpacity style={styles.toGoButton} onPress={handleStartToGoOrder}>
          <Ionicons name="bag-handle-outline" size={20} color="#FFF" />
          <Text style={styles.toGoButtonText}>Para Llevar</Text>
        </TouchableOpacity>
      </View>

      {/* PESTAÑAS (TABS) */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'MESAS' && styles.activeTab]} onPress={() => setActiveTab('MESAS')}>
          <Ionicons name="grid-outline" size={20} color={activeTab === 'MESAS' ? '#E61C24' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'MESAS' && styles.activeTabText]}>Plano de Mesas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'ORDENES' && styles.activeTab]} onPress={() => setActiveTab('ORDENES')}>
          <Ionicons name="receipt-outline" size={20} color={activeTab === 'ORDENES' ? '#E61C24' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'ORDENES' && styles.activeTabText]}>Órdenes Activas ({activeOrders.length})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        
        {/* PESTAÑA 1: MESAS EN GRID */}
        {activeTab === 'MESAS' && (
          <FlatList
            data={tables}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={<Text style={styles.instructionsText}>Toca una mesa libre para tomar el pedido.</Text>}
            renderItem={({ item }) => {
              const isOccupied = item.status === 'Ocupada';
              let iconName = 'restaurant-outline';
              if (item.type === 'outdoor') iconName = 'partly-sunny-outline';
              if (item.type === 'bar') iconName = 'wine-outline';
              if (item.type === 'vip') iconName = 'star-outline';

              return (
                <TouchableOpacity 
                  style={[styles.tableGridCard, isOccupied && styles.tableGridCardOccupied]}
                  onPress={() => handleTablePress(item)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.statusDot, isOccupied ? { backgroundColor: '#EF4444' } : { backgroundColor: '#10B981' }]} />
                  <Ionicons name={iconName as any} size={40} color={isOccupied ? '#991B1B' : '#1E293B'} style={{ marginBottom: 10 }} />
                  <Text style={[styles.gridTableName, isOccupied && { color: '#991B1B' }]}>{item.name}</Text>
                  
                  <View style={styles.capacityBadge}>
                    <Ionicons name="people" size={14} color="#64748B" />
                    <Text style={styles.capacityText}>{item.capacity} personas</Text>
                  </View>
                  <Text style={[styles.gridTableStatus, isOccupied ? { color: '#EF4444' } : { color: '#10B981' }]}>
                    {item.status}
                  </Text>
                </TouchableOpacity>
              )
            }}
          />
        )}

        {/* PESTAÑA 2: ÓRDENES ACTIVAS EN ACORDEÓN */}
        {activeTab === 'ORDENES' && (
          <FlatList
            data={activeOrders}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyOrders}>
                <Ionicons name="checkmark-circle-outline" size={60} color="#CBD5E1" />
                <Text style={styles.emptyOrdersText}>No tienes órdenes activas.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isExpanded = expandedOrderId === item.id;
              const isReady = item.status === 'LISTO';
              return (
                <View style={styles.activeOrderCard}>
                  <TouchableOpacity 
                    style={styles.activeOrderHeader} 
                    activeOpacity={0.8}
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setExpandedOrderId(isExpanded ? null : item.id);
                    }}
                  >
                    <View>
                      <Text style={styles.orderIdText}>{item.id}</Text>
                      <Text style={styles.orderTableText}>{item.tableName}</Text>
                      <Text style={styles.orderTimeText}>⌚ {item.time}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={[styles.badgeStatus, isReady ? styles.badgeReady : styles.badgePrep]}>
                        <Text style={[styles.badgeStatusText, isReady ? styles.badgeReadyText : styles.badgePrepText]}>
                          {isReady ? '✅ Listo' : '👨‍🍳 Preparando'}
                        </Text>
                      </View>
                      <Text style={styles.expandText}>{isExpanded ? 'Ocultar' : 'Ver productos'}</Text>
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.activeOrderDetails}>
                      <View style={styles.divider} />
                      {item.items.map((prod: any, idx: number) => (
                        <View key={idx} style={styles.orderItemRow}>
                           <View style={styles.orderItemMain}>
                              <Text style={styles.orderItemQty}>{prod.quantity}x</Text>
                              <View>
                                <Text style={styles.orderItemName}>{prod.name}</Text>
                                {/* ETIQUETAS VISUALES DE CADA PRODUCTO */}
                                <View style={{flexDirection: 'row', gap: 6, marginTop: 4}}>
                                  {prod.isToGo ? <Text style={styles.badgeToGo}>🛍️ Empacar</Text> : <Text style={styles.badgeMesa}>🍽️ Mesa</Text>}
                                  {prod.category === 'SOLO_PASAR' ? <Text style={styles.miniBadgeBarra}>🥤 Servir</Text> : <Text style={styles.miniBadgeCocina}>🔥 Cocina</Text>}
                                </View>
                              </View>
                           </View>
                        </View>
                      ))}
                      
                      <View style={styles.orderActions}>
                        {/* 🔄 BOTÓN PARA AGREGAR MÁS PRODUCTOS (FUNCIONA PERFECTO) */}
                        <TouchableOpacity style={styles.actionAddBtn} onPress={() => handleAddMoreToOrder(item)}>
                          <Text style={styles.actionAddText}>+ Agregar productos</Text>
                        </TouchableOpacity>
                        
                        {isReady && (
                          <TouchableOpacity style={styles.actionDeliverBtn}>
                            <Text style={styles.actionDeliverText}>Entregado</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  // CABECERA CON MENÚ HAMBURGUESA
  mainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 15, backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'android' ? 40 : 20 },
  menuHamburgerBtn: { padding: 5, marginRight: 10 },
  headerTitlesBox: { flex: 1 },
  mainTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
  mainSubtitle: { fontSize: 14, color: '#64748B' },
  
  toGoButton: { backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, shadowColor: '#10B981', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
  toGoButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, marginLeft: 6 },
  
  tabsContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  tab: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 3, borderBottomColor: 'transparent', gap: 8 },
  activeTab: { borderBottomColor: '#E61C24' },
  tabText: { fontSize: 15, fontWeight: 'bold', color: '#64748B' },
  activeTabText: { color: '#E61C24' },

  content: { flex: 1, padding: 16 },
  instructionsText: { color: '#64748B', marginBottom: 16, textAlign: 'center', fontStyle: 'italic' },

  // DISEÑO MESAS
  tableGridCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tableGridCardOccupied: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  statusDot: { position: 'absolute', top: 12, right: 12, width: 12, height: 12, borderRadius: 6 },
  gridTableName: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 4 },
  capacityBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8, gap: 4 },
  capacityText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  gridTableStatus: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' },

  // ÓRDENES ACTIVAS
  emptyOrders: { alignItems: 'center', marginTop: 50 },
  emptyOrdersText: { color: '#94A3B8', fontSize: 16, marginTop: 10, fontWeight: '500' },
  activeOrderCard: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  activeOrderHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  orderIdText: { fontSize: 13, color: '#94A3B8', fontWeight: 'bold', marginBottom: 4 },
  orderTableText: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginBottom: 4 },
  orderTimeText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  badgeStatus: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginBottom: 8 },
  badgePrep: { backgroundColor: '#FEF3C7' },
  badgeReady: { backgroundColor: '#D1FAE5' },
  badgeStatusText: { fontSize: 12, fontWeight: 'bold' },
  badgePrepText: { color: '#B45309' },
  badgeReadyText: { color: '#047857' },
  expandText: { fontSize: 13, color: '#3B82F6', fontWeight: '600' },
  
  activeOrderDetails: { padding: 16, paddingTop: 0 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 },
  orderItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderItemMain: { flexDirection: 'row', flex: 1 },
  orderItemQty: { fontSize: 16, fontWeight: '900', color: '#E61C24', width: 25 },
  orderItemName: { fontSize: 15, color: '#334155' },
  
  badgeMesa: { fontSize: 10, backgroundColor: '#F1F5F9', color: '#475569', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold' },
  badgeToGo: { fontSize: 10, backgroundColor: '#FEF2F2', color: '#E61C24', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold' },
  miniBadgeCocina: { fontSize: 10, backgroundColor: '#FFFBEB', color: '#D97706', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold' },
  miniBadgeBarra: { fontSize: 10, backgroundColor: '#E0F2FE', color: '#0369A1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold' },

  orderActions: { flexDirection: 'row', marginTop: 16, gap: 10 },
  actionAddBtn: { flex: 1, backgroundColor: '#F1F5F9', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1' },
  actionAddText: { color: '#475569', fontWeight: 'bold' },
  actionDeliverBtn: { flex: 1, backgroundColor: '#10B981', padding: 12, borderRadius: 8, alignItems: 'center' },
  actionDeliverText: { color: '#FFF', fontWeight: 'bold' },

  // VISTA TOMANDO PEDIDO
  orderHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#1E293B' },
  backButton: { marginRight: 20, padding: 5 },
  orderHeaderTitle: { color: '#94A3B8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  orderHeaderTable: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },

  menuList: { padding: 16 },
  menuCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  menuItemName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  menuItemDesc: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  menuItemPrice: { fontSize: 16, fontWeight: '900', color: '#10B981' },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  addButtonText: { fontSize: 24, color: '#E61C24', fontWeight: 'bold', marginTop: -2 },

  // CARRITO FLOTANTE Y SELECTORES
  floatingCart: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cartHeaderText: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  cartExpandedArea: { padding: 20, backgroundColor: '#F8FAFC', maxHeight: 400 },
  emptyCartText: { textAlign: 'center', color: '#94A3B8', fontStyle: 'italic' },
  
  cartItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cartItemInfo: { flex: 1 },
  cartItemText: { fontSize: 15, color: '#334155', marginBottom: 6 },
  
  toGoToggleBtn: { alignSelf: 'flex-start', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' },
  toGoToggleBtnActive: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  toGoToggleText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  toGoToggleTextActive: { color: '#E61C24', fontWeight: 'bold' },

  cartItemPrice: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginRight: 15 },
  deleteButton: { backgroundColor: '#FEE2E2', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  deleteButtonText: { color: '#EF4444', fontSize: 12, fontWeight: 'bold' },

  // SECCIÓN DE DESTINO (Mesa vs Particular) DENTRO DEL CARRITO
  destinationBox: { marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  destinationTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 10 },
  destTabs: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  destTab: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  destTabActive: { backgroundColor: '#10B981', borderColor: '#059669' },
  destTabText: { color: '#64748B', fontWeight: 'bold', fontSize: 13 },
  destTabTextActive: { color: '#FFFFFF' },
  
  inlineInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 12, fontSize: 15, color: '#1E293B', marginBottom: 10 },
  
  tablesScroll: { paddingVertical: 5, marginBottom: 10 },
  miniTableBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', marginRight: 10 },
  miniTableBtnActive: { backgroundColor: '#1E293B', borderColor: '#0F172A' },
  miniTableText: { color: '#334155', fontWeight: '600', fontSize: 13 },
  miniTableTextActive: { color: '#FFFFFF' },

  cartFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  cartTotalLabel: { fontSize: 14, color: '#64748B' },
  cartTotalAmount: { fontSize: 24, fontWeight: '900', color: '#E61C24' },
  submitButton: { backgroundColor: '#E61C24', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  submitButtonDisabled: { backgroundColor: '#FDA4AF' },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});