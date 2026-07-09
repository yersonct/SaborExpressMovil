import React, { useState } from 'react';
import { Alert, LayoutAnimation, Platform, SafeAreaView, Text, TouchableOpacity, UIManager, View, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';

// 🔥 Importaciones de tus componentes separados
import { TablesGridView } from './TablesGridView';
import { ActiveOrdersView } from './ActiveOrdersView';
import { OrderTakingView } from './OrderTakingView';
import { useWaiterTheme } from '@/features/waiter/context/WaiterThemeContext';
import { useWaiterLanguage } from '@/features/waiter/context/WaiterLanguageContext';

import { styles } from './style/WaiterDashboardStyles';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// 1. DATOS SIMULADOS CORREGIDOS (¡Una sola orden por mesa!)
const INITIAL_TABLES = [
  { id: 't1', name: 'Mesa 1', capacity: 2, status: 'Libre', type: 'normal' },
  { id: 't2', name: 'Mesa 2', capacity: 4, status: 'Ocupada', type: 'normal' }, // Ocupada
  { id: 't3', name: 'Mesa 3', capacity: 4, status: 'Libre', type: 'normal' },
  { id: 't4', name: 'Mesa VIP', capacity: 8, status: 'Ocupada', type: 'vip' }, // Ocupada
  { id: 't5', name: 'Terraza 1', capacity: 2, status: 'Libre', type: 'outdoor' },
  { id: 't6', name: 'Barra', capacity: 1, status: 'Libre', type: 'bar' },
];

const INITIAL_ORDERS = [
  {
    id: 'ORD-001',
    tableId: 't2', // Pertenece a Mesa 2
    tableName: 'Mesa 2',
    time: '12:30 PM',
    status: 'PREPARANDO',
    total: 20000,
    items: [
      { id: 'm1', name: 'Hamburguesa Sabor', quantity: 1, price: 15000, category: 'COCINA', cartId: 'c1', isToGo: false },
      { id: 'm3', name: 'Papas Francesas', quantity: 1, price: 5000, category: 'COCINA', cartId: 'c2', isToGo: true }
    ]
  },
  {
    id: 'ORD-002',
    tableId: 't4', // 🔥 CORREGIDO: Ahora pertenece a Mesa VIP
    tableName: 'Mesa VIP',
    time: '12:45 PM',
    status: 'LISTO',
    total: 18000,
    items: [
      { id: 'm2', name: 'Pizza Express', quantity: 1, price: 18000, category: 'COCINA', cartId: 'c3', isToGo: false }
    ]
  }
];

export const WaiterDashboard = () => {
  const navigation = useNavigation();
  const { colors } = useWaiterTheme();
  const { t } = useWaiterLanguage();

  const [activeTab, setActiveTab] = useState<'MESAS' | 'ORDENES'>('MESAS');
  const [tables, setTables] = useState<any[]>(INITIAL_TABLES);
  const [activeOrders, setActiveOrders] = useState<any[]>(INITIAL_ORDERS);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [isQrMenuVisible, setIsQrMenuVisible] = useState(false);
  const [activeTableForOrder, setActiveTableForOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [destType, setDestType] = useState<'particular' | 'mesa'>('particular');
  const [linkedTableId, setLinkedTableId] = useState<string | null>(null);
  const [toGoCustomerName, setToGoCustomerName] = useState('');

  // --- LOGICA DE BOTONES ---
  const handleTablePress = (table: any) => {
    if (table.status === 'Ocupada') {
      Alert.alert(t.tableOccupiedTitle || 'Mesa Ocupada', t.tableOccupiedMessage || 'Ve a la pestaña de órdenes activas para ver o agregar productos.', [
        { text: t.tableOccupiedViewOrders || 'Ver Órdenes', onPress: () => setActiveTab('ORDENES') },
        { text: t.tableOccupiedCancel || 'Cancelar', style: 'cancel' }
      ]);
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTableForOrder({ ...table, isGlobalToGo: false });
    setOrderItems([]);
  };

  const handleStartToGoOrder = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTableForOrder({ id: `temp_togo`, name: `Pedido Para Llevar`, isGlobalToGo: true });
    setDestType('particular');
    setLinkedTableId(null);
    setToGoCustomerName('');
    setOrderItems([]);
  };

  // 🔥 Al agregar más cosas, cargamos lo que ya tenía la mesa
  const handleAddMoreToOrder = (existingOrder: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    let table = tables.find(t => t.id === existingOrder.tableId) || { id: existingOrder.tableId, name: existingOrder.tableName, status: 'Ocupada', isGlobalToGo: false };
    setActiveTableForOrder(table);
    setOrderItems([...existingOrder.items]);
    setIsCartExpanded(false);
  };

  const handleCancelOrder = (orderToCancel: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveOrders(activeOrders.filter(o => o.id !== orderToCancel.id));
    
    if (!orderToCancel.tableId.includes('particular')) {
      setTables(tables.map(t => t.id === orderToCancel.tableId ? { ...t, status: 'Libre' } : t));
    }
  };

  const handleDeliverOrder = (orderToDeliver: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveOrders(activeOrders.filter(o => o.id !== orderToDeliver.id));
  };

  const handleMarkOrderReady = (orderToMarkReady: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveOrders(activeOrders.map(order => order.id === orderToMarkReady.id ? { ...order, status: 'LISTO' } : order));
  };

  const handleAddItem = (product: any, note: string = '') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const defaultToGo = activeTableForOrder?.isGlobalToGo ? true : false;
    const existingIndex = orderItems.findIndex(item => item.id === product.id && item.isToGo === defaultToGo && (item.note || '') === note);

    if (existingIndex >= 0) {
      const newItems = [...orderItems];
      newItems[existingIndex].quantity += 1;
      setOrderItems(newItems);
    } else {
      setOrderItems([...orderItems, { ...product, quantity: 1, isToGo: defaultToGo, note, cartId: Math.random().toString() }]);
    }
    if (orderItems.length === 0) setIsCartExpanded(true);
  };

  const handleUpdateItemNote = (cartId: string, note: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOrderItems(items => items.map(item => item.cartId === cartId ? { ...item, note } : item));
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

    if (activeTableForOrder.isGlobalToGo) {
      if (destType === 'particular') {
        finalTableId = `particular_${Date.now()}`;
        const personName = toGoCustomerName.trim() !== '' ? toGoCustomerName.trim() : 'Particular';
        finalTableName = `Llevar - ${personName}`;
      } else {
        if (!linkedTableId) return Alert.alert('Aviso', 'Selecciona a qué mesa asignar este pedido.');
        const t = tables.find(x => x.id === linkedTableId);
        finalTableId = t.id;
        finalTableName = t.name;
        updateRealTable = true;
      }
    } else {
      updateRealTable = true;
    }

    const orderTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // 🔥 ESTA ES LA MAGIA: Si la mesa ya tiene un pedido, LO REEMPLAZA fusionando los productos, NO crea uno nuevo duplicado.
    const existingOrderIndex = activeOrders.findIndex(o => o.tableId === finalTableId);

    if (existingOrderIndex >= 0) {
      const updatedOrders = [...activeOrders];
      updatedOrders[existingOrderIndex] = { 
        ...activeOrders[existingOrderIndex], 
        items: orderItems, 
        total: orderTotal, 
        status: 'PREPARANDO' // Al fusionar, vuelve a estar en preparación
      };
      setActiveOrders(updatedOrders);
      Alert.alert('¡Pedido Actualizado!', `Se actualizó la cuenta de ${finalTableName}.`);
    } else {
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

    if (updateRealTable) {
      setTables(tables.map(t => t.id === finalTableId ? { ...t, status: 'Ocupada' } : t));
    }

    setActiveTableForOrder(null);
    setOrderItems([]);
    setToGoCustomerName('');
    setActiveTab('ORDENES');
  };

  // --- RENDER ---
  if (activeTableForOrder) {
    return <OrderTakingView 
      activeTableForOrder={activeTableForOrder} setActiveTableForOrder={setActiveTableForOrder} 
      orderItems={orderItems} isCartExpanded={isCartExpanded} setIsCartExpanded={setIsCartExpanded} 
      destType={destType} setDestType={setDestType} toGoCustomerName={toGoCustomerName} 
      setToGoCustomerName={setToGoCustomerName} tables={tables} linkedTableId={linkedTableId} 
      setLinkedTableId={setLinkedTableId} handleAddItem={handleAddItem} handleRemoveItem={handleRemoveItem} 
      toggleItemToGo={toggleItemToGo} handleUpdateItemNote={handleUpdateItemNote} handleSubmitOrder={handleSubmitOrder} 
    />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.mainHeader, { backgroundColor: colors.header, borderColor: colors.border }]}>
        
        <View style={styles.headerTitlesBox}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>saborEXPRESS</Text>
          <Text style={[styles.mainSubtitle, { color: colors.mutedText }]}>{t.dashboardWaiterPanel || 'Panel de Mesero'}</Text>
        </View>
        
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity 
            style={[styles.toGoButton, { backgroundColor: colors.elevatedSurface, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border }]} 
            onPress={() => setIsQrMenuVisible(true)}
          >
            <Ionicons name="qr-code-outline" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toGoButton} onPress={handleStartToGoOrder}>
            <Ionicons name="bag-handle-outline" size={20} color="#FFF" />
            <Text style={styles.toGoButtonText}>{t.dashboardParaLlevar || 'Para Llevar'}</Text>
          </TouchableOpacity>
        </View>

      </View>

      <View style={[styles.tabsContainer, { backgroundColor: colors.header, borderColor: colors.border }]}>
        <TouchableOpacity style={[styles.tab, activeTab === 'MESAS' && styles.activeTab]} onPress={() => setActiveTab('MESAS')}>
          <Ionicons name="grid-outline" size={20} color={activeTab === 'MESAS' ? colors.accent : colors.mutedText} />
          <Text style={[styles.tabText, { color: colors.mutedText }, activeTab === 'MESAS' && { color: colors.accent }]}>{t.dashboardTabTables || 'Plano de Mesas'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'ORDENES' && styles.activeTab]} onPress={() => setActiveTab('ORDENES')}>
          <Ionicons name="receipt-outline" size={20} color={activeTab === 'ORDENES' ? colors.accent : colors.mutedText} />
          <Text style={[styles.tabText, { color: colors.mutedText }, activeTab === 'ORDENES' && { color: colors.accent }]}>{t.dashboardTabOrders || 'Órdenes'} ({activeOrders.length})</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {activeTab === 'MESAS' ? 
          <TablesGridView tables={tables} handleTablePress={handleTablePress} /> 
          : 
          <ActiveOrdersView 
            activeOrders={activeOrders} 
            expandedOrderId={expandedOrderId} 
            setExpandedOrderId={setExpandedOrderId} 
            handleAddMoreToOrder={handleAddMoreToOrder} 
            handleCancelOrder={handleCancelOrder} 
            handleMarkOrderReady={handleMarkOrderReady}
            handleDeliverOrder={handleDeliverOrder}
          />
        }
      </View>

      <Modal transparent visible={isQrMenuVisible} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.card, padding: 24, borderRadius: 24, alignItems: 'center', width: '85%', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 10, borderWidth: 1, borderColor: colors.border }}>
            
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.accentSoft, justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
              <Ionicons name="book-outline" size={32} color={colors.accent} />
            </View>

            <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 8, textAlign: 'center' }}>
              {t.dashboardQrTitle || 'Carta Digital'}
            </Text>
            
            <Text style={{ fontSize: 15, color: colors.mutedText, textAlign: 'center', marginBottom: 20, lineHeight: 22 }}>
              {t.dashboardQrDescription || 'Muéstrale este código al cliente para que lea el menú en su celular. Una vez decida, tú le tomas el pedido.'}
            </Text>
            
            <View style={{ padding: 15, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
              <Image 
                source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=http://10.3.234.202:3000/letter' }} 
                style={{ width: 220, height: 220 }} 
              />
            </View>

            <TouchableOpacity 
              style={{ marginTop: 25, backgroundColor: colors.elevatedSurface, width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border }} 
              onPress={() => setIsQrMenuVisible(false)}
            >
              <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>{t.dashboardQrHide || 'Ocultar QR'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};