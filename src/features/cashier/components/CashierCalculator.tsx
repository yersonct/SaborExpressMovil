import React, { useState, useRef, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Animated,
  Platform,
  UIManager,
  ScrollView,
  TextInput,
  Alert,
  LayoutAnimation,
  Image // <-- Agregado para ver la captura
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- TIPOS DE DATOS ---
type OrderType = 'mesa' | 'llevar';
interface Order {
  id: string;
  type: OrderType;
  table?: number;
  items: string;
  total: number;
  // 🔥 NUEVO: Estado pagando_transferencia
  status: 'pendiente' | 'pagado' | 'pagando_transferencia';
  paymentMethod?: 'transferencia' | 'efectivo';
  deliveryPerson?: string;
  time: string;
  transferProofUrl?: string; // 🔥 NUEVO: URL de la captura
}

interface Employee {
  id: string;
  name: string;
  role: string;
  startTime: string;
  endTime: string;
  basePay: number;
  status: 'trabajando' | 'pagado';
}

// --- DATOS DE PRUEBA ---
const INITIAL_ORDERS: Order[] = [
  { id: 'ORD-101', type: 'mesa', table: 4, items: '2x Hamburguesa\n1x Gaseosa Litro\n1x Porción de Papas', total: 45000, status: 'pendiente', time: '12:45 PM' },
  { id: 'ORD-102', type: 'llevar', items: '1x Pizza Familiar', total: 55000, status: 'pagado', paymentMethod: 'transferencia', deliveryPerson: 'Carlos Gómez (Moto 1)', time: '12:50 PM' },
  { id: 'ORD-103', type: 'mesa', table: 2, items: '3x Empanadas\n2x Jugos Naturales', total: 22000, status: 'pendiente', time: '01:15 PM' },
  // 🔥 NUEVO: Un pedido simulado para que valides la transferencia de una
  { id: 'ORD-104', type: 'llevar', items: '2x Hamburguesa Sabor\n1x Gaseosa Litro', total: 38000, status: 'pagando_transferencia', paymentMethod: 'transferencia', deliveryPerson: 'Por asignar', time: '01:25 PM', transferProofUrl: 'https://cdn-icons-png.flaticon.com/512/2942/2942269.png' },
];

const STAFF_TODAY: Employee[] = [
  { id: 'EMP-01', name: 'María Cárdenas', role: 'Mesera', startTime: '08:00 AM', endTime: '04:00 PM', basePay: 45000, status: 'trabajando' },
  { id: 'EMP-02', name: 'Jorge Pérez', role: 'Cocinero Principal', startTime: '06:00 AM', endTime: '04:00 PM', basePay: 60000, status: 'trabajando' },
  { id: 'EMP-03', name: 'Carlos Gómez', role: 'Repartidor', startTime: '12:00 PM', endTime: '09:00 PM', basePay: 35000, status: 'trabajando' },
];

const MENU_ITEMS = [
  { id: 'm1', name: 'Hamburguesa Sabor', price: 15000 },
  { id: 'm2', name: 'Pizza Familiar', price: 55000 },
  { id: 'm3', name: 'Papas Francesas', price: 5000 },
  { id: 'm4', name: 'Gaseosa Litro', price: 8000 },
  { id: 'm5', name: 'Jugo Natural', price: 6000 },
  { id: 'm6', name: 'Empanada de Carne', price: 3000 },
  { id: 'm7', name: 'Galleta de Chocolate', price: 3500 },
  { id: 'm8', name: 'Cerveza Nacional', price: 7000 },
  { id: 'm9', name: 'Helado Casero', price: 4500 },
];

export default function CashierDashboard() {
  const navigation = useNavigation();

  // 🔥 NUEVO: Agregamos la pestaña 'transferencias'
  const [activeTab, setActiveTab] = useState<'pedidos' | 'transferencias' | 'personal'>('pedidos');
  const [toastMessage, setToastMessage] = useState('');
  const toastAnim = useRef(new Animated.Value(-100)).current;

  // Estados de Pedidos
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);  
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // NUEVOS ESTADOS DE PAGO CAJERO
  const [cashierPaymentMethod, setCashierPaymentMethod] = useState<'efectivo'|'transferencia'|''>('');

  // Estados para Modal del Catálogo (Agregar Extras en Caja)
  const [catalogModalVisible, setCatalogModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados de Caja
  const [paidHistory, setPaidHistory] = useState<Order[]>([
    { id: 'ORD-099', type: 'mesa', items: 'Base de Caja', total: 35000, status: 'pagado', paymentMethod: 'efectivo', time: '11:00 AM' }, 
    ...INITIAL_ORDERS.filter(o => o.status === 'pagado')
  ]);
  const [closeRegisterModal, setCloseRegisterModal] = useState(false);

  // Estados de Personal
  const [staff, setStaff] = useState<Employee[]>(STAFF_TODAY);
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [customPayment, setCustomPayment] = useState<string>('0');

  const filteredMenu = useMemo(() => {
    return MENU_ITEMS.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const showToast = (message: string) => {
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: Platform.OS === 'ios' ? 50 : 20, duration: 300, useNativeDriver: true }),
      Animated.delay(3500),
      Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true })
    ]).start();
  };

  const simulateIncomingOrder = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const isDelivery = Math.random() > 0.5;
    const randomId = `ORD-${Math.floor(Math.random() * 1000) + 200}`;
    const randomTotal = Math.floor(Math.random() * 40 + 15) * 1000;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isDelivery) {
      // 🔥 MODIFICADO: Ahora el domicilio entra como pendiente de validar la captura
      const newDeliveryOrder: Order = {
        id: randomId,
        type: 'llevar',
        items: '2x Pizza Express\n1x Coca-Cola',
        total: randomTotal,
        status: 'pagando_transferencia', // Entra directo a la pestaña de validación
        paymentMethod: 'transferencia',
        deliveryPerson: 'Por asignar',
        time: timeNow,
        transferProofUrl: 'https://cdn-icons-png.flaticon.com/512/2942/2942269.png'
      };
      
      setOrders(prev => [newDeliveryOrder, ...prev]);
      showToast(`📲 ¡Domicilio recibido! Validar comprobante por $${randomTotal.toLocaleString('es-CO')}`);
    } else {
      const newTableOrder: Order = {
        id: randomId,
        type: 'mesa',
        table: Math.floor(Math.random() * 10) + 1,
        items: '3x Menú Ejecutivo\n2x Jugo Natural',
        total: randomTotal,
        status: 'pendiente',
        time: timeNow
      };
      
      setOrders(prev => [newTableOrder, ...prev]);
      showToast(`🔔 ¡Nueva cuenta de Mesa ${newTableOrder.table} lista para cobrar!`);
    }
  };

  const openPaymentModal = (order: Order) => {
    setSelectedOrder(order);
    if (order.status === 'pagando_transferencia') {
      setCashierPaymentMethod('transferencia');
    } else {
      setCashierPaymentMethod(''); // Resetear el método de pago al abrir
    }
    setOrderModalVisible(true);
  };

  // 🔥 NUEVA LÓGICA: Validar transferencia
  const handleValidateTransfer = (isApproved: boolean) => {
    if (!selectedOrder) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (isApproved) {
      setOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
      setPaidHistory(prev => [...prev, { ...selectedOrder, status: 'pagado', paymentMethod: 'transferencia' }]);
      showToast(`✅ Transferencia de ${selectedOrder.id} validada.`);
    } else {
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'pendiente' } : o));
      showToast(`❌ Comprobante rechazado. Pasa a pendientes.`);
      setActiveTab('pedidos');
    }
    setOrderModalVisible(false);
    setSelectedOrder(null);
  };

  const handleSelectMenuItem = (item: typeof MENU_ITEMS[0]) => {
    if (selectedOrder) {
      const updatedOrder = {
        ...selectedOrder,
        items: selectedOrder.items + `\n1x ${item.name} (Extra Caja)`,
        total: selectedOrder.total + item.price
      };

      setSelectedOrder(updatedOrder);
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));

      setCatalogModalVisible(false);
      setSearchQuery('');
      showToast(`✅ ${item.name} agregado a la cuenta`);
    }
  };

  // Lógica de confirmación de pago
  const confirmOrderPayment = () => {
    if (!cashierPaymentMethod) {
      Alert.alert("Falta el Método de Pago", "Por favor selecciona si el cliente pagó en Efectivo o por Transferencia.");
      return;
    }

    if (cashierPaymentMethod === 'transferencia' && selectedOrder?.status !== 'pagando_transferencia') {
      // Doble validación obligatoria para transferencias directas en caja
      Alert.alert(
        "Verificación de Transferencia", 
        "¿Confirmas que verificaste que el dinero ingresó a la cuenta Nequi/Banco?",
        [
          { text: "No, revisar", style: "cancel" },
          { text: "Sí, confirmado", onPress: () => processPaymentAndCloseMesa() }
        ]
      );
    } else {
      processPaymentAndCloseMesa();
    }
  };

  const processPaymentAndCloseMesa = () => {
    if (!selectedOrder || !cashierPaymentMethod) return;

    const paymentMethod = cashierPaymentMethod as 'efectivo' | 'transferencia';
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
    
    // Guarda la orden en el historial con el método seleccionado
    setPaidHistory(prev => [...prev, { ...selectedOrder, status: 'pagado', paymentMethod }]);
    
    setOrderModalVisible(false);
    showToast(`✅ Mesa cobrada con éxito (${paymentMethod})`);
    setSelectedOrder(null);
    setCashierPaymentMethod('');
  };

  const totalEfectivo = paidHistory.filter(o => o.paymentMethod === 'efectivo').reduce((acc, curr) => acc + curr.total, 0);
  const totalTransferencia = paidHistory.filter(o => o.paymentMethod === 'transferencia').reduce((acc, curr) => acc + curr.total, 0);
  const totalGlobal = totalEfectivo + totalTransferencia;

  const handleCloseRegister = () => {
    setCloseRegisterModal(false);
    showToast('🔒 Caja cerrada. Reporte guardado con éxito.');
  };

  const openEmployeeModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setCustomPayment(employee.basePay.toString());
    setEmployeeModalVisible(true);
  };

  const confirmEmployeePayment = () => {
    if (selectedEmployee) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setStaff(prev => prev.filter(e => e.id !== selectedEmployee.id));
      setEmployeeModalVisible(false);
      showToast(`💵 Turno pagado a ${selectedEmployee.name} por $${Number(customPayment).toLocaleString('es-CO')}`);
      setSelectedEmployee(null);
    }
  };

  const renderOrder = ({ item }: { item: Order }) => {
    if (item.status === 'pagado') return null; 
    const isMesa = item.type === 'mesa';
    const isTransferPending = item.status === 'pagando_transferencia'; // 🔥

    return (
      <View style={[styles.card, isMesa ? styles.cardMesa : styles.cardLlevar, isTransferPending && styles.cardTransfer]}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>{item.id} • {item.time}</Text>
          <Text style={styles.orderTotal}>${item.total.toLocaleString('es-CO')}</Text>
        </View>
        <Text style={styles.orderTitle}>
          {isMesa ? `📍 Mesa ${item.table}` : isTransferPending ? '📱 Domicilio (Validar Pago)' : '🛵 Domicilio (Pendiente)'}
        </Text>
        <Text style={styles.orderItemsPreview} numberOfLines={2}>{item.items.replace(/\n/g, ', ')}</Text>

        <TouchableOpacity 
          style={[styles.payButton, isTransferPending && styles.payButtonReview]} 
          onPress={() => openPaymentModal(item)}
        >
          <Text style={styles.payButtonText}>{isTransferPending ? '🔍 Revisar Comprobante' : 'Cobrar Mesa'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmployee = ({ item }: { item: Employee }) => (
    <View style={styles.employeeCard}>
      <View style={styles.employeeHeader}>
        <View style={styles.employeeInfoBox}>
          <View style={styles.employeeAvatar}>
            <Text style={styles.employeeInitials}>{item.name.substring(0, 2).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.employeeName}>{item.name}</Text>
            <Text style={styles.employeeRole}>{item.role}</Text>
          </View>
        </View>
        <View style={styles.statusDot} />
      </View>

      <View style={styles.employeeDetailsBox}>
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>Horario:</Text>
          <Text style={styles.timeValue}>{item.startTime} - {item.endTime}</Text>
        </View>
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>Tarifa Base:</Text>
          <Text style={styles.payValue}>${item.basePay.toLocaleString('es-CO')}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.payShiftButton} onPress={() => openEmployeeModal(item)}>
        <Text style={styles.payShiftButtonText}>Liquidar y Pagar Turno</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastAnim }] }]}>
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Ionicons name="menu" size={28} color="#1E293B" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Caja SaborExpress</Text>
            <Text style={styles.headerSubtitle}>Gestión de Turno</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.simulateOrderBtn} onPress={simulateIncomingOrder}>
            <Ionicons name="notifications-outline" size={16} color="#FFFFFF" />
            <Text style={styles.simulateOrderBtnText}>Simular</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeRegisterBtn} onPress={() => setCloseRegisterModal(true)}>
            <Ionicons name="lock-closed-outline" size={16} color="#FFFFFF" />
            <Text style={styles.closeRegisterBtnText}>Cierre</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔥 NUEVO: SE AGREGÓ LA PESTAÑA TRANSFERENCIAS AQUÍ */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'pedidos' && styles.tabButtonActive]} onPress={() => setActiveTab('pedidos')}>
          <Text style={[styles.tabText, activeTab === 'pedidos' && styles.tabTextActive]}>Pedidos ({orders.filter(o => o.status === 'pendiente').length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'transferencias' && styles.tabButtonActive]} onPress={() => setActiveTab('transferencias')}>
          <Text style={[styles.tabText, activeTab === 'transferencias' && styles.tabTextActive]}>
            Transferencias {orders.filter(o => o.status === 'pagando_transferencia').length > 0 ? '🔴' : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'personal' && styles.tabButtonActive]} onPress={() => setActiveTab('personal')}>
          <Text style={[styles.tabText, activeTab === 'personal' && styles.tabTextActive]}>Personal ({staff.length})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'pedidos' && (
          <FlatList data={orders.filter(o => o.status === 'pendiente')} keyExtractor={item => item.id} renderItem={renderOrder} contentContainerStyle={styles.listPadding} ListEmptyComponent={<Text style={styles.emptyText}>No hay pedidos pendientes por cobrar.</Text>} />
        )}
        {activeTab === 'transferencias' && (
          <FlatList data={orders.filter(o => o.status === 'pagando_transferencia')} keyExtractor={item => item.id} renderItem={renderOrder} contentContainerStyle={styles.listPadding} ListEmptyComponent={<Text style={styles.emptyText}>No hay comprobantes pendientes de validación.</Text>} />
        )}
        {activeTab === 'personal' && (
          <FlatList data={staff} keyExtractor={item => item.id} renderItem={renderEmployee} contentContainerStyle={styles.listPadding} ListEmptyComponent={<Text style={styles.emptyText}>No hay personal activo en este momento.</Text>} />
        )}
      </View>

      {/* MODAL PRINCIPAL DE COBRO DE MESA Y VALIDACIÓN */}
      <Modal animationType="slide" transparent={true} visible={orderModalVisible} onRequestClose={() => setOrderModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedOrder?.status === 'pagando_transferencia' ? 'Validar Comprobante' : 'Cobrar Mesa'}
              </Text>
              <TouchableOpacity onPress={() => setOrderModalVisible(false)}><Text style={styles.closeIcon}>✕</Text></TouchableOpacity>
            </View>

            {selectedOrder && (
              <View style={styles.ticketContainer}>
                
                {/* 🔥 SI ES TRANSFERENCIA, MOSTRAMOS LA IMAGEN */}
                {selectedOrder.status === 'pagando_transferencia' ? (
                  <View style={styles.proofContainer}>
                    <Text style={styles.ticketItemsHeader}>El cliente subió esta imagen:</Text>
                    <Image source={{uri: selectedOrder.transferProofUrl}} style={styles.proofImage} resizeMode="contain" />
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>MONTO A VERIFICAR:</Text>
                      <Text style={styles.totalValue}>${selectedOrder.total.toLocaleString('es-CO')}</Text>
                    </View>
                  </View>
                ) : (
                  /* SI ES COBRO NORMAL, MUESTRA LOS PRODUCTOS COMO LO TENÍAS */
                  <>
                    <View style={styles.ticketRow}><Text style={styles.ticketLabel}>Mesa:</Text><Text style={styles.ticketValueLarge}>{selectedOrder.table || 'Para Llevar'}</Text></View>
                    <View style={styles.ticketRow}><Text style={styles.ticketLabel}>Hora de pedido:</Text><Text style={styles.ticketValue}>{selectedOrder.time}</Text></View>
                    <View style={styles.divider} />
                    
                    <Text style={styles.ticketItemsHeader}>Detalle de Consumo:</Text>
                    <ScrollView style={styles.itemsScroll}>
                      <Text style={styles.ticketItemsList}>{selectedOrder.items}</Text>
                    </ScrollView>

                    <TouchableOpacity style={styles.addMissingBtn} onPress={() => setCatalogModalVisible(true)}>
                      <Ionicons name="add-circle" size={16} color="#3B82F6" style={{ marginRight: 5 }} />
                      <Text style={styles.addMissingBtnText}>Agregar producto extra</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />
                    
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>TOTAL A COBRAR:</Text>
                      <Text style={styles.totalValue}>${selectedOrder.total.toLocaleString('es-CO')}</Text>
                    </View>

                    {/* SELECCIÓN DEL MÉTODO DE PAGO DEL CLIENTE */}
                    <Text style={styles.paymentMethodTitle}>¿Cómo pagó el cliente?</Text>
                    <View style={styles.paymentOptionsRow}>
                      <TouchableOpacity 
                        style={[styles.paymentMethodBtn, cashierPaymentMethod === 'efectivo' && styles.paymentMethodBtnActive]}
                        onPress={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          setCashierPaymentMethod('efectivo')
                        }}
                      >
                        <Ionicons name="cash" size={20} color={cashierPaymentMethod === 'efectivo' ? '#E61C24' : '#64748B'} />
                        <Text style={[styles.paymentMethodText, cashierPaymentMethod === 'efectivo' && styles.paymentMethodTextActive]}>Efectivo</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.paymentMethodBtn, cashierPaymentMethod === 'transferencia' && styles.paymentMethodBtnActive]}
                        onPress={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          setCashierPaymentMethod('transferencia')
                        }}
                      >
                        <Ionicons name="phone-portrait" size={20} color={cashierPaymentMethod === 'transferencia' ? '#E61C24' : '#64748B'} />
                        <Text style={[styles.paymentMethodText, cashierPaymentMethod === 'transferencia' && styles.paymentMethodTextActive]}>Transferencia</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {cashierPaymentMethod === 'transferencia' && (
                      <View style={styles.warningBox}>
                        <Ionicons name="warning" size={16} color="#D97706" style={{marginRight: 5}}/>
                        <Text style={styles.warningText}>No olvides revisar el comprobante o tu app Nequi antes de confirmar.</Text>
                      </View>
                    )}
                  </>
                )}

              </View>
            )}

            {/* 🔥 BOTONES DE ACCIÓN SEGÚN EL CASO */}
            {selectedOrder?.status === 'pagando_transferencia' ? (
              <View style={styles.validationButtonsRow}>
                <TouchableOpacity style={styles.btnReject} onPress={() => handleValidateTransfer(false)}>
                  <Text style={styles.modalAcceptText}>❌ Rechazar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnApprove} onPress={() => handleValidateTransfer(true)}>
                  <Text style={styles.modalAcceptText}>✅ Aprobar Transferencia</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.modalAcceptBtn, !cashierPaymentMethod && styles.modalAcceptBtnDisabled]} 
                onPress={confirmOrderPayment}
                disabled={!cashierPaymentMethod}
              >
                <Text style={styles.modalAcceptText}>
                  {cashierPaymentMethod ? 'Confirmar Pago y Cerrar Mesa' : 'Selecciona el método de pago'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL DEL CATÁLOGO CON BUSCADOR (Intacto) */}
      <Modal animationType="fade" transparent={true} visible={catalogModalVisible} onRequestClose={() => setCatalogModalVisible(false)}>
        <View style={styles.catalogOverlay}>
          <View style={styles.catalogBox}>
            <View style={styles.catalogHeader}>
              <Text style={styles.catalogTitle}>Agregar a la cuenta</Text>
              <TouchableOpacity onPress={() => setCatalogModalVisible(false)}><Text style={styles.closeIcon}>✕</Text></TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar empanada, gaseosa..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredMenu}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.catalogItem} onPress={() => handleSelectMenuItem(item)}>
                  <View>
                    <Text style={styles.catalogItemName}>{item.name}</Text>
                    <Text style={styles.catalogItemPrice}>+ ${item.price.toLocaleString('es-CO')}</Text>
                  </View>
                  <View style={styles.catalogAddBtn}>
                    <Text style={styles.catalogAddBtnText}>Añadir</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyCatalogText}>No se encontraron productos con "{searchQuery}"</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* MODAL DE PAGO DE PERSONAL (Intacto) */}
      <Modal animationType="slide" transparent={true} visible={employeeModalVisible} onRequestClose={() => setEmployeeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pagar Turno</Text>
              <TouchableOpacity onPress={() => setEmployeeModalVisible(false)}><Text style={styles.closeIcon}>✕</Text></TouchableOpacity>
            </View>

            {selectedEmployee && (
              <View style={styles.employeePaymentContainer}>
                <Text style={styles.empModalName}>{selectedEmployee.name}</Text>
                <Text style={styles.empModalRole}>{selectedEmployee.role}</Text>

                <View style={styles.empModalDetails}>
                  <Text style={styles.empModalLabel}>Turno agendado:</Text>
                  <Text style={styles.empModalValue}>{selectedEmployee.startTime} - {selectedEmployee.endTime}</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Monto a pagar (Modificable si se retira antes):</Text>
                  <View style={styles.currencyInputWrapper}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={[
                        styles.moneyInput,
                        Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}
                      ]}
                      keyboardType="numeric"
                      value={customPayment}
                      onChangeText={setCustomPayment}
                      selectTextOnFocus={true}
                      underlineColorAndroid="transparent"
                    />
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.payEmployeeBtn} onPress={confirmEmployeePayment}>
              <Text style={styles.modalAcceptText}>Confirmar Pago</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL CIERRE DE CAJA (Intacto) */}
      <Modal animationType="fade" transparent={true} visible={closeRegisterModal} onRequestClose={() => setCloseRegisterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cuadre de Caja</Text>
              <TouchableOpacity onPress={() => setCloseRegisterModal(false)}><Text style={styles.closeIcon}>✕</Text></TouchableOpacity>
            </View>

            <View style={styles.summaryContainer}>
              <Text style={styles.summarySubtitle}>Resumen del Turno</Text>

              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Ionicons name="cash-outline" size={24} color="#10B981" />
                  <Text style={styles.summaryLabel}>Efectivo en gaveta</Text>
                </View>
                <Text style={styles.summaryValueEfectivo}>${totalEfectivo.toLocaleString('es-CO')}</Text>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Ionicons name="swap-horizontal-outline" size={24} color="#3B82F6" />
                  <Text style={styles.summaryLabel}>Transferencias (App/Bancos)</Text>
                </View>
                <Text style={styles.summaryValueTransfer}>${totalTransferencia.toLocaleString('es-CO')}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalSummaryRow}>
                <Text style={styles.totalSummaryLabel}>VENTA TOTAL:</Text>
                <Text style={styles.totalSummaryValue}>${totalGlobal.toLocaleString('es-CO')}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeShiftBtn} onPress={handleCloseRegister}>
              <Text style={styles.closeShiftBtnText}>Aprobar Cierre y Terminar Turno</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#E2E8F0', paddingTop: Platform.OS === 'android' ? 40 : 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  menuButton: { marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1E293B' },
  headerSubtitle: { fontSize: 14, color: '#64748B' },
  
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  simulateOrderBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  simulateOrderBtnText: { color: '#FFFFFF', fontWeight: 'bold', marginLeft: 6, fontSize: 14 },
  closeRegisterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  closeRegisterBtnText: { color: '#FFFFFF', fontWeight: 'bold', marginLeft: 6, fontSize: 14 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 10, borderBottomWidth: 1, borderColor: '#E2E8F0' },
  tabButton: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabButtonActive: { borderBottomColor: '#EA1D2C' },
  tabText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  tabTextActive: { color: '#EA1D2C', fontWeight: 'bold' },

  content: { flex: 1 },
  listPadding: { padding: 20 },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 40, fontSize: 16 },

  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderLeftWidth: 5 },
  cardMesa: { borderLeftColor: '#F59E0B' },
  cardLlevar: { borderLeftColor: '#10B981' },
  cardTransfer: { borderLeftColor: '#3B82F6', backgroundColor: '#EFF6FF' }, // 🔥 NUEVO
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderId: { fontSize: 14, color: '#94A3B8', fontWeight: 'bold' },
  orderTotal: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  orderTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 4 },
  orderItemsPreview: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  payButton: { backgroundColor: '#EA1D2C', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  payButtonReview: { backgroundColor: '#3B82F6' }, // 🔥 NUEVO
  payButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },

  employeeCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 2, shadowColor: '#000000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  employeeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  employeeInfoBox: { flexDirection: 'row', alignItems: 'center' },
  employeeAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  employeeInitials: { color: '#3B82F6', fontWeight: 'bold', fontSize: 16 },
  employeeName: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  employeeRole: { fontSize: 14, color: '#64748B', marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', marginTop: 6 },
  employeeDetailsBox: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 12, marginBottom: 14, gap: 8 },
  timeBox: { flexDirection: 'row', justifyContent: 'space-between' },
  timeLabel: { color: '#64748B', fontSize: 14, fontWeight: '500' },
  timeValue: { color: '#334155', fontSize: 14, fontWeight: 'bold' },
  payValue: { color: '#10B981', fontSize: 14, fontWeight: 'bold' },
  payShiftButton: { backgroundColor: '#3B82F6', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  payShiftButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#FFFFFF', width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1E293B' },
  closeIcon: { fontSize: 24, color: '#94A3B8', fontWeight: 'bold', padding: 5 },
  
  modalAcceptBtn: { width: '100%', paddingVertical: 16, borderRadius: 12, backgroundColor: '#EA1D2C', alignItems: 'center', marginTop: 15 },
  modalAcceptBtnDisabled: { backgroundColor: '#FDA4AF' },
  modalAcceptText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },

  // 🔥 NUEVO: Botones para aprobar o rechazar transferencia
  validationButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, gap: 10 },
  btnReject: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center' },
  btnApprove: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center' },
  
  proofContainer: { alignItems: 'center' },
  proofImage: { width: '100%', height: 150, marginVertical: 15, backgroundColor: '#F1F5F9', borderRadius: 8 },

  ticketContainer: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 5 },
  ticketRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ticketLabel: { fontSize: 15, color: '#64748B', fontWeight: '500' },
  ticketValue: { fontSize: 15, color: '#1E293B', fontWeight: 'bold' },
  ticketValueLarge: { fontSize: 18, color: '#EA1D2C', fontWeight: '900' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  ticketItemsHeader: { fontSize: 14, color: '#64748B', fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
  itemsScroll: { maxHeight: 100 },
  ticketItemsList: { fontSize: 15, color: '#334155', lineHeight: 24 },

  addMissingBtn: { marginTop: 10, paddingVertical: 12, backgroundColor: '#EFF6FF', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#3B82F6', borderStyle: 'dashed', flexDirection: 'row', justifyContent: 'center' },
  addMissingBtnText: { color: '#3B82F6', fontWeight: 'bold', fontSize: 14 },

  paymentMethodTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748B', marginTop: 15, marginBottom: 10, textTransform: 'uppercase' },
  paymentOptionsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  paymentMethodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 10, backgroundColor: '#FFFFFF' },
  paymentMethodBtnActive: { borderColor: '#E61C24', backgroundColor: '#FEF2F2' },
  paymentMethodText: { fontSize: 14, fontWeight: 'bold', color: '#64748B', marginLeft: 6 },
  paymentMethodTextActive: { color: '#E61C24' },
  warningBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 10, borderRadius: 8, marginTop: 15, borderWidth: 1, borderColor: '#FDE68A' },
  warningText: { fontSize: 12, color: '#92400E', flex: 1 },

  catalogOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  catalogBox: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, maxHeight: '80%', elevation: 15 },
  catalogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  catalogTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 10, paddingHorizontal: 12, height: 45, marginBottom: 15 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#000', borderWidth: 0, borderColor: 'transparent' },
  catalogItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  catalogItemName: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
  catalogItemPrice: { fontSize: 14, color: '#10B981', fontWeight: 'bold' },
  catalogAddBtn: { backgroundColor: '#FEF2F2', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  catalogAddBtnText: { color: '#EA1D2C', fontWeight: 'bold', fontSize: 13 },
  emptyCatalogText: { textAlign: 'center', color: '#94A3B8', marginTop: 30, fontSize: 15, fontStyle: 'italic' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  totalLabel: { fontSize: 16, color: '#1E293B', fontWeight: 'bold' },
  totalValue: { fontSize: 24, color: '#EA1D2C', fontWeight: '900' },

  employeePaymentContainer: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, alignItems: 'center' },
  empModalName: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  empModalRole: { fontSize: 16, color: '#64748B', marginBottom: 16 },
  empModalDetails: { backgroundColor: '#FFFFFF', width: '100%', padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  empModalLabel: { color: '#64748B', fontSize: 14 },
  empModalValue: { color: '#1E293B', fontWeight: 'bold', fontSize: 14 },
  inputContainer: { width: '100%' },
  inputLabel: { fontSize: 14, color: '#334155', marginBottom: 8, fontWeight: '500' },
  currencyInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#3B82F6', borderRadius: 10, paddingHorizontal: 15, overflow: 'hidden' },
  currencySymbol: { fontSize: 24, color: '#1E293B', fontWeight: 'bold', marginRight: 5 },
  moneyInput: { flex: 1, minWidth: 0, fontSize: 28, fontWeight: '900', color: '#1E293B', paddingVertical: 12, borderWidth: 0, backgroundColor: 'transparent' },
  payEmployeeBtn: { width: '100%', paddingVertical: 16, borderRadius: 12, backgroundColor: '#3B82F6', alignItems: 'center' },

  summaryContainer: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24 },
  summarySubtitle: { fontSize: 14, fontWeight: 'bold', color: '#64748B', marginBottom: 16, textTransform: 'uppercase' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  summaryItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  summaryLabel: { fontSize: 15, color: '#334155', marginLeft: 10, flexShrink: 1 },
  summaryValueEfectivo: { fontSize: 18, fontWeight: '900', color: '#10B981' },
  summaryValueTransfer: { fontSize: 18, fontWeight: '900', color: '#3B82F6' },
  totalSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  totalSummaryLabel: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  totalSummaryValue: { fontSize: 28, fontWeight: '900', color: '#E61C24' },
  closeShiftBtn: { width: '100%', paddingVertical: 16, borderRadius: 12, backgroundColor: '#1E293B', alignItems: 'center' },
  closeShiftBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },

  toastContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 20, right: 20, backgroundColor: '#10B981', padding: 16, borderRadius: 10, zIndex: 999, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
  toastText: { color: '#FFFFFF', fontWeight: 'bold', textAlign: 'center', fontSize: 15 }
});