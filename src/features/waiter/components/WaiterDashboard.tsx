import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
  Switch // Añadimos Switch para marcar productos
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const INITIAL_TABLES = [
  { id: '1', name: 'Mesa 1', status: 'Libre' },
  { id: '2', name: 'Mesa 2', status: 'Libre' },
  { id: '3', name: 'Mesa 3', status: 'Libre' },
  { id: '4', name: 'Mesa 4', status: 'Libre' },
  { id: '5', name: 'Mesa 5', status: 'Libre' },
  { id: '6', name: 'Barra Principal', status: 'Libre' },
  { id: '7', name: 'Mesa VIP', status: 'Libre' },
  { id: '8', name: 'Terraza 1', status: 'Libre' },
];

const MENU_ITEMS = [
  { id: 'm1', name: 'Hamburguesa Sabor', price: 15000, desc: 'Doble carne, queso cheddar, tocino y papas.' },
  { id: 'm2', name: 'Pizza Express', price: 18000, desc: 'Pepperoni, extra queso y borde relleno.' },
  { id: 'm3', name: 'Papas Francesas', price: 5000, desc: 'Porción grande con salsas de la casa.' },
  { id: 'm4', name: 'Gaseosa 500ml', price: 4000, desc: 'Coca-Cola, Sprite o Quatro.' },
  { id: 'm5', name: 'Jugo Natural', price: 6000, desc: 'Mango, Mora o Lulo en agua/leche.' },
];

export const WaiterDashboard = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);

  const [tables, setTables] = useState<any[]>(INITIAL_TABLES);
  
  // NUEVO: Estado para mantener una lista de "Pedidos Rápidos" (Para llevar)
  const [quickOrders, setQuickOrders] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTable, setActiveTable] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [expandedTableId, setExpandedTableId] = useState<string | null>(null);
  const [isCartExpanded, setIsCartExpanded] = useState(false);

  const [kitchenAlert, setKitchenAlert] = useState<{ tableName: string, message: string } | null>(null);
  const activeTimers = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permiso Denegado', 'Necesitamos acceso a la cámara para escanear el QR.');
        return;
      }
    }
    setIsScanning(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setIsScanning(false);
    Alert.alert('¡Código Escaneado!', `Contenido del QR:\n${data}`);
  };

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectTable = (table: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (table.status === 'Ocupada' || table.status === 'Listo para servir') {
      setExpandedTableId(expandedTableId === table.id ? null : table.id);
      return;
    }

    setActiveTable(table);
    setOrderItems([]);
    setIsCartExpanded(false);
  };

  const handleAddMoreItems = (table: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTable(table);
    setOrderItems(table.currentOrder || []);
    setIsCartExpanded(false);
  };

  // NUEVA FUNCIÓN: Iniciar un pedido rápido sin mesa
  const handleStartQuickOrder = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // Creamos una "mesa" falsa para el pedido rápido
    const quickOrderName = `Para llevar #${quickOrders.length + 1}`;
    const newQuickOrder = { id: `quick_${Date.now()}`, name: quickOrderName, isTakeout: true };
    
    setActiveTable(newQuickOrder);
    setOrderItems([]);
    setIsCartExpanded(false);
  };

  const handleAddItem = (product: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // Por defecto, un item nuevo no es para llevar a menos que se indique (o sea un pedido rápido general)
    const isTakeoutByDefault = activeTable?.isTakeout || false;
    const newItem = { ...product, cartId: Math.random().toString(), isTakeoutItem: isTakeoutByDefault };
    
    setOrderItems([...orderItems, newItem]);

    if (orderItems.length === 0) {
      setIsCartExpanded(true);
    }
  };

  const handleRemoveItem = (cartIdToRemove: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updatedItems = orderItems.filter(item => item.cartId !== cartIdToRemove);
    setOrderItems(updatedItems);

    if (updatedItems.length === 0) {
      setIsCartExpanded(false);
    }
  };

  // NUEVA FUNCIÓN: Alternar estado de "Para llevar" de un ítem individual
  const toggleItemTakeoutStatus = (cartId: string) => {
    setOrderItems(currentItems => 
      currentItems.map(item => 
        item.cartId === cartId ? { ...item, isTakeoutItem: !item.isTakeoutItem } : item
      )
    );
  };

  const handleDeliverOrder = (tableId: string, isTakeoutOrder: boolean = false) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (isTakeoutOrder) {
       // Si es pedido rápido, lo eliminamos de la lista activa
       setQuickOrders(currentOrders => currentOrders.filter(o => o.id !== tableId));
    } else {
      setTables(currentTables =>
        currentTables.map(t =>
          t.id === tableId ? { ...t, status: 'Ocupada' } : t
        )
      );
    }
  };

  const handleSubmitOrder = () => {
    if (orderItems.length === 0) {
      Alert.alert('Pedido Vacío', 'Agrega al menos un producto antes de enviar el pedido.');
      return;
    }

    const orderTotal = orderItems.reduce((sum, item) => sum + item.price, 0);
    const tableIdToUpdate = activeTable.id;
    const tableNameToUpdate = activeTable.name;
    const isTakeoutOrder = activeTable.isTakeout;

    if (isTakeoutOrder) {
      // Manejo para Pedidos Rápidos (Para Llevar)
      const newQuickOrderRecord = { 
        ...activeTable, 
        status: 'Ocupada', // Usamos 'Ocupada' como sinónimo de 'Preparando'
        currentOrder: orderItems, 
        totalAmount: orderTotal 
      };
      
      // Actualizamos o añadimos a la lista de pedidos rápidos
      setQuickOrders(prev => {
        const exists = prev.find(o => o.id === tableIdToUpdate);
        if (exists) {
          return prev.map(o => o.id === tableIdToUpdate ? newQuickOrderRecord : o);
        }
        return [...prev, newQuickOrderRecord];
      });

    } else {
      // Manejo para Mesas Normales
      const updatedTables = tables.map(t =>
        t.id === tableIdToUpdate
          ? { ...t, status: 'Ocupada', currentOrder: orderItems, totalAmount: orderTotal }
          : t
      );
      setTables(updatedTables);
    }

    Alert.alert('¡Pedido Enviado!', `El pedido de ${tableNameToUpdate} fue enviado a cocina.`);

    if (activeTimers.current[tableIdToUpdate]) {
      clearTimeout(activeTimers.current[tableIdToUpdate]);
    }

    activeTimers.current[tableIdToUpdate] = setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      if (isTakeoutOrder) {
        setQuickOrders(currentOrders =>
          currentOrders.map(o => {
            if (o.id === tableIdToUpdate && o.status === 'Ocupada') {
              return { ...o, status: 'Listo para servir' };
            }
            return o;
          })
        );
      } else {
        setTables(currentTables =>
          currentTables.map(t => {
            if (t.id === tableIdToUpdate && t.status === 'Ocupada') {
              return { ...t, status: 'Listo para servir' };
            }
            return t;
          })
        );
      }

      setKitchenAlert({
        tableName: tableNameToUpdate,
        message: `¡El pedido de ${tableNameToUpdate} está listo!`
      });

      setTimeout(() => setKitchenAlert(null), 5000);

      delete activeTimers.current[tableIdToUpdate];
    }, 8000);

    setActiveTable(null);
    setOrderItems([]);
    setSearchQuery('');
    setIsCartExpanded(false);
  };

  const orderTotal = orderItems.reduce((sum, item) => sum + item.price, 0);

  // Renderizador auxiliar para las "Tarjetas" (Mesas o Pedidos Rápidos)
  const renderCard = (item: any, isTakeoutOrder: boolean = false) => {
    const isOccupied = item.status === 'Ocupada';
    const isReady = item.status === 'Listo para servir';
    const isExpanded = expandedTableId === item.id;

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.tableCard,
          isOccupied ? styles.tableCardOccupied :
            isReady ? styles.tableCardReady : styles.tableCardFree,
          isTakeoutOrder && { borderColor: '#FCD34D' } // Borde amarillo para pedidos rápidos
        ]}
        activeOpacity={0.8}
        onPress={() => isTakeoutOrder ? handleAddMoreItems(item) : handleSelectTable(item)}
      >
        {(isOccupied || isReady) && (
          <View style={styles.arrowContainer}>
            <Text style={[styles.arrowText, isReady && { color: '#065F46' }]}>{isExpanded ? '▲' : '▼'}</Text>
          </View>
        )}

        <Text style={styles.tableIcon}>{isTakeoutOrder ? '🛍️' : isOccupied ? '🍽️' : isReady ? '🔔' : '🛋️'}</Text>
        <Text style={[
          styles.tableName,
          isOccupied && styles.tableNameOccupied,
          isReady && styles.tableNameReady
        ]}>{item.name}</Text>

        <View style={[
          styles.statusBadge,
          isOccupied ? styles.statusBadgeOccupied :
            isReady ? styles.statusBadgeReady : styles.statusBadgeFree
        ]}>
          <Text style={[
            styles.statusText,
            isOccupied ? styles.statusTextOccupied :
              isReady ? styles.statusTextReady : styles.statusTextFree
          ]}>
            {item.status}
          </Text>
        </View>

        {(isOccupied || isReady) && isExpanded && item.currentOrder && (
          <View style={[styles.expandedOrderArea, isReady && { borderTopColor: '#A7F3D0' }]}>
            <Text style={[styles.expandedOrderTitle, isReady && { color: '#065F46' }]}>Pedido Actual:</Text>
            {item.currentOrder.map((orderItem: any, idx: number) => (
              <Text key={idx} style={styles.expandedOrderItem} numberOfLines={1}>
                • {orderItem.name} {orderItem.isTakeoutItem ? '(Para Llevar 🛍️)' : ''}
              </Text>
            ))}
            <Text style={[styles.expandedOrderTotal, isReady && { color: '#065F46' }]}>
              Total: ${item.totalAmount?.toLocaleString()}
            </Text>

            {isReady ? (
              <TouchableOpacity
                style={styles.deliverButton}
                onPress={() => handleDeliverOrder(item.id, isTakeoutOrder)}
              >
                <Text style={styles.deliverButtonText}>✅ Marcar como entregado</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.addMoreButton}
                onPress={() => handleAddMoreItems(item)}
              >
                <Text style={styles.addMoreButtonText}>➕ Agregar más</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      {kitchenAlert && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertIcon}>🔔</Text>
          <View style={styles.alertTextContainer}>
            <Text style={styles.alertTitle}>¡Cocina informa!</Text>
            <Text style={styles.alertMessage}>{kitchenAlert.message}</Text>
          </View>
          <TouchableOpacity onPress={() => setKitchenAlert(null)}>
            <Text style={styles.alertClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {!activeTable ? (
        <>
          <View style={styles.header}>
            <Text style={styles.titleDark}>sabor<Text style={styles.titleRed}>EXPRESS</Text></Text>
            <Text style={styles.subtitle}>Panel de Mesero</Text>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.topActionsRow}>
              <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar mesa..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <TouchableOpacity style={styles.scanButton} onPress={handleOpenScanner} activeOpacity={0.8}>
                <Text style={styles.scanButtonIcon}>📷</Text>
              </TouchableOpacity>
            </View>

            {/* BOTÓN DE PEDIDO RÁPIDO PARA LLEVAR */}
            <TouchableOpacity style={styles.quickOrderButton} onPress={handleStartQuickOrder}>
              <Text style={styles.quickOrderIcon}>🛍️</Text>
              <Text style={styles.quickOrderText}>Nuevo Pedido Para Llevar</Text>
            </TouchableOpacity>

            {/* LISTA DE PEDIDOS RÁPIDOS ACTIVOS */}
            {quickOrders.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.sectionTitle}>Pedidos Para Llevar Activos:</Text>
                <View style={styles.row}>
                  {quickOrders.map(order => renderCard(order, true))}
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>Selecciona una ubicación:</Text>
            
            <View style={styles.row}>
                {filteredTables.map(table => renderCard(table, false))}
            </View>

          </ScrollView>

          <Modal visible={isScanning} animationType="slide" transparent={false}>
            <SafeAreaView style={styles.cameraContainer}>
              <View style={styles.cameraHeader}>
                <Text style={styles.cameraTitle}>Escanear Código QR</Text>
                <TouchableOpacity onPress={() => setIsScanning(false)}>
                  <Text style={styles.cameraCloseButton}>✕ Cerrar</Text>
                </TouchableOpacity>
              </View>
              {isScanning && (
                <CameraView style={styles.cameraView} facing="back" onBarcodeScanned={handleBarcodeScanned} barcodeScannerSettings={{ barcodeTypes: ["qr"] }} />
              )}
              <View style={styles.cameraOverlay}>
                <View style={styles.cameraTarget} />
                <Text style={styles.cameraInstruction}>Apunta la cámara hacia el código QR</Text>
              </View>
            </SafeAreaView>
          </Modal>
        </>
      ) : (
        <>
          <View style={styles.orderHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => setActiveTable(null)}>
              <Text style={styles.backButtonText}>← Volver</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.orderHeaderTitle}>Tomando pedido</Text>
              <Text style={styles.orderHeaderTable}>{activeTable.name}</Text>
            </View>
          </View>

          <FlatList
            data={MENU_ITEMS}
            keyExtractor={item => item.id}
            contentContainerStyle={[styles.menuList, { paddingBottom: isCartExpanded ? 280 : 150 }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.menuCard} onPress={() => handleAddItem(item)} activeOpacity={0.7}>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuName}>{item.name}</Text>
                  <Text style={styles.menuDesc}>{item.desc}</Text>
                  <Text style={styles.menuPrice}>${item.price.toLocaleString()}</Text>
                </View>
                <View style={styles.addButton}>
                  <Text style={styles.addButtonText}>+</Text>
                </View>
              </TouchableOpacity>
            )}
          />

          <View style={styles.cartContainer}>
            <TouchableOpacity style={styles.cartHeader} activeOpacity={0.7} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setIsCartExpanded(!isCartExpanded); }}>
              <Text style={styles.cartTitle}>Resumen del Pedido ({orderItems.length})</Text>
              <Text style={styles.cartArrowIcon}>{isCartExpanded ? '▼' : '▲'}</Text>
            </TouchableOpacity>

            {isCartExpanded && (
              <ScrollView style={styles.cartList} showsVerticalScrollIndicator={true}>
                {orderItems.length === 0 ? (
                  <Text style={styles.emptyCartText}>No hay productos agregados aún.</Text>
                ) : (
                  orderItems.map((item, index) => (
                    <View key={item.cartId} style={styles.cartItem}>
                      <Text style={styles.cartItemCount}>{index + 1}.</Text>
                      <View style={styles.cartItemDetails}>
                         <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
                         
                         {/* SWITCH PARA MARCAR ÍTEM INDIVIDUAL PARA LLEVAR */}
                         {!activeTable.isTakeout && (
                           <View style={styles.takeoutToggleRow}>
                             <Text style={styles.takeoutToggleText}>Empacar 🛍️</Text>
                             <Switch
                               trackColor={{ false: "#E2E8F0", true: "#FCD34D" }}
                               thumbColor={item.isTakeoutItem ? "#F59E0B" : "#F8FAFC"}
                               ios_backgroundColor="#E2E8F0"
                               onValueChange={() => toggleItemTakeoutStatus(item.cartId)}
                               value={item.isTakeoutItem}
                               style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
                             />
                           </View>
                         )}
                      </View>
                      
                      <Text style={styles.cartItemPrice}>${item.price.toLocaleString()}</Text>
                      <TouchableOpacity onPress={() => handleRemoveItem(item.cartId)} style={styles.deleteButton}>
                        <Text style={styles.deleteButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            )}

            <View style={styles.cartFooter}>
              <Text style={styles.totalText}>Total: ${orderTotal.toLocaleString()}</Text>
              <TouchableOpacity
                style={[styles.submitButton, orderItems.length === 0 && styles.submitButtonDisabled]}
                disabled={orderItems.length === 0}
                onPress={handleSubmitOrder}
              >
                <Text style={styles.submitButtonText}>Enviar Pedido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  alertBanner: { position: 'absolute', top: 50, left: 20, right: 20, backgroundColor: '#10B981', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 10, zIndex: 100 },
  alertIcon: { fontSize: 24, marginRight: 12 },
  alertTextContainer: { flex: 1 },
  alertTitle: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  alertMessage: { color: '#ECFDF5', fontSize: 14, marginTop: 2 },
  alertClose: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', paddingLeft: 10 },

  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  titleDark: { fontSize: 26, fontWeight: '900', color: '#0F172A' },
  titleRed: { color: '#E61C24' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 2 },

  content: { padding: 16, flex: 1 },

  topActionsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#E2E8F0' },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#0F172A' },
  scanButton: { width: 50, height: 50, backgroundColor: '#1E293B', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
  scanButtonIcon: { fontSize: 22, color: '#FFFFFF' },

  quickOrderButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF3C7', paddingVertical: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#FDE68A' },
  quickOrderIcon: { fontSize: 20, marginRight: 8 },
  quickOrderText: { color: '#92400E', fontWeight: 'bold', fontSize: 16 },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginBottom: 15 },

  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 15, alignItems: 'flex-start' },
  tableCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, marginBottom: 15 },
  tableCardFree: { borderColor: '#E2E8F0' },
  tableCardOccupied: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  tableCardReady: { borderColor: '#6EE7B7', backgroundColor: '#ECFDF5' },

  tableIcon: { fontSize: 32, marginBottom: 10 },
  tableName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
  tableNameOccupied: { color: '#991B1B' },
  tableNameReady: { color: '#065F46' },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeFree: { backgroundColor: '#D1FAE5' },
  statusBadgeOccupied: { backgroundColor: '#FECACA' },
  statusBadgeReady: { backgroundColor: '#10B981' },

  statusText: { fontSize: 12, fontWeight: 'bold' },
  statusTextFree: { color: '#065F46' },
  statusTextOccupied: { color: '#991B1B' },
  statusTextReady: { color: '#FFFFFF' },

  arrowContainer: { position: 'absolute', top: 12, right: 15 },
  arrowText: { fontSize: 14, color: '#991B1B', fontWeight: 'bold' },
  expandedOrderArea: { marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#FECACA', width: '100%', alignItems: 'flex-start' },
  expandedOrderTitle: { fontSize: 12, fontWeight: 'bold', color: '#991B1B', marginBottom: 5, textTransform: 'uppercase' },
  expandedOrderItem: { fontSize: 13, color: '#1E293B', marginBottom: 3 },
  expandedOrderTotal: { fontSize: 14, fontWeight: '900', color: '#991B1B', marginTop: 8 },

  addMoreButton: { marginTop: 10, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'stretch', alignItems: 'center' },
  addMoreButtonText: { color: '#991B1B', fontWeight: 'bold', fontSize: 13 },

  deliverButton: { marginTop: 10, backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#6EE7B7', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'stretch', alignItems: 'center' },
  deliverButtonText: { color: '#065F46', fontWeight: 'bold', fontSize: 13 },

  orderHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#1E293B' },
  backButton: { marginRight: 20, padding: 5 },
  backButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  orderHeaderTitle: { color: '#94A3B8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  orderHeaderTable: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },

  menuList: { padding: 16 },
  menuCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  menuInfo: { flex: 1, paddingRight: 10 },
  menuName: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
  menuDesc: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  menuPrice: { fontSize: 15, fontWeight: 'bold', color: '#10B981' },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' },
  addButtonText: { color: '#E61C24', fontSize: 24, fontWeight: 'bold', marginTop: -2 },

  cartContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 15, maxHeight: '50%' },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cartTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  cartArrowIcon: { fontSize: 18, color: '#E61C24', fontWeight: 'bold' },
  cartList: { paddingHorizontal: 20, maxHeight: 150 },
  emptyCartText: { color: '#94A3B8', fontStyle: 'italic', marginTop: 10, marginBottom: 10 },
  cartItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cartItemCount: { width: 20, color: '#64748B', fontWeight: 'bold', marginTop: 2 },
  cartItemDetails: { flex: 1 },
  cartItemName: { color: '#334155', fontSize: 14, marginBottom: 4 },
  takeoutToggleRow: { flexDirection: 'row', alignItems: 'center' },
  takeoutToggleText: { fontSize: 12, color: '#64748B', marginRight: 5 },
  cartItemPrice: { fontWeight: 'bold', color: '#0F172A', marginRight: 15, marginTop: 2 },
  deleteButton: { backgroundColor: '#FEE2E2', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  deleteButtonText: { color: '#EF4444', fontSize: 14, fontWeight: 'bold' },
  cartFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FFFFFF' },
  totalText: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  submitButton: { backgroundColor: '#E61C24', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  submitButtonDisabled: { backgroundColor: '#FDA4AF' },
  submitButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },

  cameraContainer: { flex: 1, backgroundColor: '#000000' },
  cameraHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#1E293B' },
  cameraTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  cameraCloseButton: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },
  cameraView: { flex: 1 },
  cameraOverlay: { position: 'absolute', top: 80, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' },
  cameraTarget: { width: 250, height: 250, borderWidth: 3, borderColor: '#10B981', borderRadius: 20, backgroundColor: 'transparent' },
  cameraInstruction: { color: '#FFFFFF', fontSize: 14, textAlign: 'center', marginTop: 30, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 10, overflow: 'hidden' }
});