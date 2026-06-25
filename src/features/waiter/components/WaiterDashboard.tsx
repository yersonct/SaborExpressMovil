import React, { useState } from 'react';
import { Alert, LayoutAnimation, Platform, SafeAreaView, Text, TouchableOpacity, UIManager, View, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';

// 🔥 Importaciones de tus nuevos componentes separados
import { TablesGridView } from './TablesGridView';
import { ActiveOrdersView } from './ActiveOrdersView';
import { OrderTakingView } from './OrderTakingView';

import { styles } from './style/WaiterDashboardStyles';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// Datos Simulados
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
  },
  {
    id: 'ORD-002',
    tableId: 't2',
    tableName: 'Mesa 2',
    time: '12:30 PM',
    status: 'LISTO',
    total: 35000,
    items: [
      { id: 'm1', name: 'Hamburguesa Sabor', quantity: 2, price: 15000, category: 'COCINA', cartId: 'c1', isToGo: false },
      { id: 'm3', name: 'Papas Francesas', quantity: 1, price: 5000, category: 'COCINA', cartId: 'c2', isToGo: true }
    ]
  }
];

export const WaiterDashboard = () => {
  const navigation = useNavigation();

  // Estados principales
  const [activeTab, setActiveTab] = useState<'MESAS' | 'ORDENES'>('MESAS');
  const [tables, setTables] = useState<any[]>(INITIAL_TABLES);
  const [activeOrders, setActiveOrders] = useState<any[]>(INITIAL_ORDERS);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // 🔥 NUEVO ESTADO: Para controlar el Modal del menú QR
  const [isQrMenuVisible, setIsQrMenuVisible] = useState(false);

  // Estados para tomar pedido
  const [activeTableForOrder, setActiveTableForOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isCartExpanded, setIsCartExpanded] = useState(false);

  // Estados para "Para Llevar"
  const [destType, setDestType] = useState<'particular' | 'mesa'>('particular');
  const [linkedTableId, setLinkedTableId] = useState<string | null>(null);
  const [toGoCustomerName, setToGoCustomerName] = useState('');

  // --- LOGICA DE BOTONES ---
  const handleTablePress = (table: any) => {
    if (table.status === 'Ocupada') {
      Alert.alert('Mesa Ocupada', 'Ve a la pestaña "Órdenes Activas" para ver o agregar productos.', [
        { text: 'Ver Órdenes', onPress: () => setActiveTab('ORDENES') },
        { text: 'Cancelar', style: 'cancel' }
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

  const handleAddItem = (product: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const defaultToGo = activeTableForOrder?.isGlobalToGo ? true : false;
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
    const existingOrderIndex = activeOrders.findIndex(o => o.tableId === finalTableId);

    if (existingOrderIndex >= 0) {
      const updatedOrders = [...activeOrders];
      updatedOrders[existingOrderIndex] = { ...activeOrders[existingOrderIndex], items: orderItems, total: orderTotal, status: 'PREPARANDO' };
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
      toggleItemToGo={toggleItemToGo} handleSubmitOrder={handleSubmitOrder} 
    />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainHeader}>
        <TouchableOpacity style={styles.menuHamburgerBtn} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Ionicons name="menu" size={32} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTitlesBox}>
          <Text style={styles.mainTitle}>saborEXPRESS</Text>
          <Text style={styles.mainSubtitle}>Panel de Mesero</Text>
        </View>
        
        {/* BOTONES SUPERIORES */}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          
          {/* BOTÓN DEL CÓDIGO QR PARA MOSTRAR LA CARTA */}
          <TouchableOpacity 
            style={[styles.toGoButton, { backgroundColor: '#334155', paddingHorizontal: 12 }]} 
            onPress={() => setIsQrMenuVisible(true)}
          >
            <Ionicons name="qr-code-outline" size={20} color="#FFF" />
          </TouchableOpacity>

          {/* BOTÓN DE PARA LLEVAR */}
          <TouchableOpacity style={styles.toGoButton} onPress={handleStartToGoOrder}>
            <Ionicons name="bag-handle-outline" size={20} color="#FFF" />
            <Text style={styles.toGoButtonText}>Para Llevar</Text>
          </TouchableOpacity>
        </View>

      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'MESAS' && styles.activeTab]} onPress={() => setActiveTab('MESAS')}>
          <Ionicons name="grid-outline" size={20} color={activeTab === 'MESAS' ? '#E61C24' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'MESAS' && styles.activeTabText]}>Plano de Mesas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'ORDENES' && styles.activeTab]} onPress={() => setActiveTab('ORDENES')}>
          <Ionicons name="receipt-outline" size={20} color={activeTab === 'ORDENES' ? '#E61C24' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'ORDENES' && styles.activeTabText]}>Órdenes ({activeOrders.length})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'MESAS' ? 
          <TablesGridView tables={tables} handleTablePress={handleTablePress} /> 
          : 
          <ActiveOrdersView 
            activeOrders={activeOrders} 
            expandedOrderId={expandedOrderId} 
            setExpandedOrderId={setExpandedOrderId} 
            handleAddMoreToOrder={handleAddMoreToOrder} 
            handleCancelOrder={handleCancelOrder} 
            handleDeliverOrder={handleDeliverOrder}
          />
        }
      </View>

      {/* 🔥 MODAL PARA MOSTRAR LA CARTA DIGITAL AL CLIENTE */}
      <Modal transparent visible={isQrMenuVisible} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#FFFFFF', padding: 24, borderRadius: 24, alignItems: 'center', width: '85%', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 }}>
            
            {/* Icono de menú/libro en vez del escáner */}
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
              <Ionicons name="book-outline" size={32} color="#E61C24" />
            </View>

            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginBottom: 8, textAlign: 'center' }}>
              Carta Digital
            </Text>
            
            <Text style={{ fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 22 }}>
              Muéstrale este código al cliente para que lea el <Text style={{fontWeight: 'bold', color: '#E61C24'}}>menú en su celular</Text>. Una vez decida, tú le tomas el pedido.
            </Text>
            
          {/* Generador de QR Gratuito apuntando a la futura página de la carta */}
            <View style={{ padding: 15, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
              <Image 
              source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=http://10.3.234.202:3000/letter' }} 
              style={{ width: 220, height: 220 }} 
            />
            </View>

            <TouchableOpacity 
              style={{ marginTop: 25, backgroundColor: '#F1F5F9', width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }} 
              onPress={() => setIsQrMenuVisible(false)}
            >
              <Text style={{ color: '#475569', fontWeight: 'bold', fontSize: 16 }}>Ocultar QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};