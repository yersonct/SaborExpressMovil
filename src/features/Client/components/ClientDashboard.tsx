import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
  Animated,
  Platform,
  UIManager,
  ScrollView,
  Alert,
  LayoutAnimation
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORIES = ['Todos', '🍔 Hamburguesas', '🍕 Pizzas', '🥤 Bebidas', '🍟 Extras'];

const MENU_ITEMS = [
  { id: '1', name: 'Hamburguesa Clásica', category: '🍔 Hamburguesas', price: 15000, desc: 'Carne de res, queso, lechuga y tomate.', image: '🍔' },
  { id: '2', name: 'Hamburguesa SaborExpress', category: '🍔 Hamburguesas', price: 22000, desc: 'Doble carne, tocineta, queso cheddar y salsa especial.', image: '🍔' },
  { id: '3', name: 'Pizza Familiar', category: '🍕 Pizzas', price: 55000, desc: '8 porciones con pepperoni y extra queso.', image: '🍕' },
  { id: '4', name: 'Gaseosa 500ml', category: '🥤 Bebidas', price: 4000, desc: 'Coca-Cola, Sprite, Quatro.', image: '🥤' },
  { id: '5', name: 'Jugo Natural', category: '🥤 Bebidas', price: 6000, desc: 'Mango, Fresa, Mora en agua o leche.', image: '🧃' },
  { id: '6', name: 'Papas Francesas', category: '🍟 Extras', price: 5000, desc: 'Porción grande con salsas.', image: '🍟' },
];

export default function ClientDashboard() { 
  const navigation = useNavigation();
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [cart, setCart] = useState<any[]>([]);
  
  // Modales
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [confirmItemModalVisible, setConfirmItemModalVisible] = useState(false);
  const [itemToConfirm, setItemToConfirm] = useState<any | null>(null);

  // Estados de flujo de pago
  const [isCheckingOut, setIsCheckingOut] = useState(false); 
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false); 
  const [paymentMethod, setPaymentMethod] = useState(''); // Solo 'tarjeta' o 'transferencia'
  const [receiptUploaded, setReceiptUploaded] = useState(false); 
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  // Animaciones
  const toastAnim = useRef(new Animated.Value(-100)).current;
  const [toastMessage, setToastMessage] = useState('');

  const filteredMenu = activeCategory === 'Todos' 
    ? MENU_ITEMS 
    : MENU_ITEMS.filter(item => item.category === activeCategory);

  const totalCart = cart.reduce((sum, item) => sum + item.price, 0);

  const showToast = (message: string) => {
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: Platform.OS === 'ios' ? 50 : 20, duration: 300, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true })
    ]).start();
  };

  const handleItemPress = (item: any) => {
    setItemToConfirm(item);
    setConfirmItemModalVisible(true);
  };

  const confirmAddToCart = () => {
    if (itemToConfirm) {
      setCart([...cart, { ...itemToConfirm, cartId: Math.random().toString() }]);
      showToast(`🛒 ${itemToConfirm.name} agregado`);
      setConfirmItemModalVisible(false);
      setItemToConfirm(null);
    }
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.cartId !== cartId));
    if (cart.length === 1) {
      handleCloseCart();
    }
  };

  const handleCloseCart = () => {
    setCartModalVisible(false);
    setIsCheckingOut(false);
    setIsUploadingReceipt(false);
    setPaymentMethod('');
    setReceiptUploaded(false);
  };

  const proceedToCheckout = () => {
    if (cart.length === 0) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCheckingOut(true); 
  };

  const handlePaymentNextStep = () => {
    if (!paymentMethod) {
      Alert.alert("Selecciona un método de pago", "Debes elegir cómo deseas pagar antes de continuar.");
      return;
    }
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    // AMBOS métodos (Tarjeta o Transferencia) requieren subir evidencia del pago
    setIsCheckingOut(false);
    setIsUploadingReceipt(true);
  };

  const handleFakeUploadReceipt = () => {
    // Simula la subida de un archivo o captura de pantalla
    setReceiptUploaded(true);
    showToast("✅ Evidencia cargada correctamente");
  };

  const submitFinalOrder = () => {
    if (!receiptUploaded) {
      Alert.alert("Falta el comprobante", "Por favor sube la captura de pantalla de tu pago para confirmar la orden.");
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setOrderConfirmed(true);
    setIsUploadingReceipt(false);
    
    setTimeout(() => {
      setOrderConfirmed(false);
      handleCloseCart();
      setCart([]);
    }, 4000);
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* TOAST ANIMADO */}
      <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastAnim }] }]}>
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Ionicons name="menu" size={28} color="#1E293B" />
          </TouchableOpacity>
          <View>
            <Text style={styles.greeting}>Hola, Cliente 👋</Text>
            <Text style={styles.subtitle}>¿Qué vas a pedir hoy?</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.cartButtonHeader} onPress={() => setCartModalVisible(true)}>
          <Ionicons name="cart" size={24} color="#1E293B" />
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* CATEGORÍAS */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {CATEGORIES.map((cat, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.categoryBtn, activeCategory === cat && styles.categoryBtnActive]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setActiveCategory(cat)
              }}
            >
              <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* MENÚ */}
      <FlatList
        data={filteredMenu}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.menuList}
        renderItem={({ item }) => {
          return (
            <TouchableOpacity 
              style={styles.menuCard} 
              activeOpacity={0.7} 
              onPress={() => handleItemPress(item)}
            >
              <View style={styles.menuCardImagePlaceholder}>
                <Text style={{fontSize: 40}}>{item.image}</Text>
              </View>
              <View style={styles.menuCardInfo}>
                <Text style={styles.menuCardTitle}>{item.name}</Text>
                <Text style={styles.menuCardDesc} numberOfLines={2}>{item.desc}</Text>
                
                <View style={styles.menuCardFooter}>
                  <Text style={styles.menuCardPrice}>${item.price.toLocaleString('es-CO')}</Text>
                  
                  <View style={styles.addButton}>
                    <Ionicons name="add" size={20} color="#FFF" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )
        }}
      />

      {/* BOTÓN FLOTANTE CARRITO */}
      {cart.length > 0 && (
        <TouchableOpacity style={styles.floatingCartBtn} onPress={() => setCartModalVisible(true)}>
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartCount}><Text style={styles.floatingCartCountText}>{cart.length}</Text></View>
            <Text style={styles.floatingCartText}>Ver carrito</Text>
          </View>
          <Text style={styles.floatingCartTotal}>${totalCart.toLocaleString('es-CO')}</Text>
        </TouchableOpacity>
      )}

      {/* MODAL 1: CONFIRMAR PRODUCTO */}
      <Modal animationType="fade" transparent={true} visible={confirmItemModalVisible} onRequestClose={() => setConfirmItemModalVisible(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmImageCircle}>
              <Text style={{fontSize: 50}}>{itemToConfirm?.image}</Text>
            </View>
            <Text style={styles.confirmTitle}>¿Agregar al carrito?</Text>
            <Text style={styles.confirmItemName}>{itemToConfirm?.name}</Text>
            <Text style={styles.confirmItemPrice}>${itemToConfirm?.price.toLocaleString('es-CO')}</Text>
            <Text style={styles.confirmDesc}>{itemToConfirm?.desc}</Text>

            <View style={styles.confirmActionsRow}>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setConfirmItemModalVisible(false)}>
                <Text style={styles.confirmCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmAcceptBtn} onPress={confirmAddToCart}>
                <Ionicons name="cart" size={18} color="#FFF" style={{marginRight: 8}} />
                <Text style={styles.confirmAcceptText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: CARRITO / PAGO / COMPROBANTE */}
      <Modal animationType="slide" transparent={true} visible={cartModalVisible} onRequestClose={handleCloseCart}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, (isCheckingOut || isUploadingReceipt) && {minHeight: '65%'}]}>
            
            {orderConfirmed ? (
              // 4. PANTALLA DE ÉXITO
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={90} color="#10B981" />
                <Text style={styles.successTitle}>¡Pago Confirmado!</Text>
                <Text style={styles.successText}>La cocina ya está preparando tu comida.</Text>
                <View style={styles.successDivider} />
                <Text style={styles.successNote}>Sigue el recorrido de tu repartidor en "Mi Perfil".</Text>
              </View>

            ) : isUploadingReceipt ? (
              // 3. PANTALLA PARA SUBIR COMPROBANTE DE PAGO
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => { setIsUploadingReceipt(false); setIsCheckingOut(true); }} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={26} color="#1E293B" />
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, { flex: 1, textAlign: 'center' }]}>Comprobante</Text>
                  <TouchableOpacity onPress={handleCloseCart} style={{ width: 26, alignItems: 'flex-end' }}>
                    <Ionicons name="close" size={28} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {paymentMethod === 'transferencia' ? (
                    <View style={styles.bankInfoBox}>
                      <Ionicons name="phone-portrait" size={32} color="#1E293B" style={{marginBottom: 10}} />
                      <Text style={styles.bankInfoText}>Transfiere exactamente:</Text>
                      <Text style={styles.bankInfoTotal}>${totalCart.toLocaleString('es-CO')}</Text>
                      
                      <View style={styles.bankDataRow}>
                        <Text style={styles.bankDataLabel}>Nequi / DaviPlata:</Text>
                        <Text style={styles.bankDataValue}>300 123 4567</Text>
                      </View>
                      <View style={styles.bankDataRow}>
                        <Text style={styles.bankDataLabel}>A nombre de:</Text>
                        <Text style={styles.bankDataValue}>SaborExpress S.A.S</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.bankInfoBox}>
                      <Ionicons name="card" size={32} color="#1E293B" style={{marginBottom: 10}} />
                      <Text style={styles.bankInfoText}>Monto a pagar con tarjeta:</Text>
                      <Text style={styles.bankInfoTotal}>${totalCart.toLocaleString('es-CO')}</Text>
                      
                      <TouchableOpacity style={styles.payLinkBtn} onPress={() => Alert.alert('Redirigiendo...', 'Abriendo pasarela de pago segura (Wompi, MercadoPago, etc.)')}>
                         <Ionicons name="lock-closed" size={16} color="#FFF" style={{marginRight: 6}} />
                         <Text style={styles.payLinkBtnText}>Ir a pagar con Tarjeta</Text>
                      </TouchableOpacity>
                      <Text style={[styles.bankInfoText, {marginTop: 15, textAlign: 'center', fontSize: 13}]}>
                        Realiza el pago en el enlace seguro y guarda una captura de pantalla de la aprobación.
                      </Text>
                    </View>
                  )}

                  <Text style={styles.uploadSubtitle}>Adjunta tu comprobante de pago para validar la orden:</Text>

                  {receiptUploaded ? (
                    <View style={styles.uploadedBox}>
                      <Ionicons name="document-text" size={40} color="#10B981" />
                      <Text style={styles.uploadedText}>Comprobante adjuntado con éxito</Text>
                      <TouchableOpacity onPress={() => setReceiptUploaded(false)}>
                        <Text style={styles.reuploadText}>Cambiar archivo</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.uploadArea} onPress={handleFakeUploadReceipt}>
                      <Ionicons name="cloud-upload-outline" size={40} color="#94A3B8" />
                      <Text style={styles.uploadTextTitle}>Toca para subir imagen</Text>
                      <Text style={styles.uploadTextSub}>Formatos: JPG, PNG o PDF</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    style={[styles.confirmOrderBtn, !receiptUploaded && styles.confirmOrderBtnDisabled, {marginTop: 20}]} 
                    onPress={submitFinalOrder}
                    disabled={!receiptUploaded}
                  >
                    <Ionicons name="paper-plane" size={18} color="#FFF" style={{marginRight: 8}} />
                    <Text style={styles.confirmOrderBtnText}>Enviar y Procesar Pedido</Text>
                  </TouchableOpacity>
                </ScrollView>
              </>

            ) : isCheckingOut ? (
              // 2. PANTALLA DE SELECCIÓN DE PAGO (SOLO TARJETA Y TRANSFERENCIA)
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setIsCheckingOut(false)} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={26} color="#1E293B" />
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, { flex: 1, textAlign: 'center' }]}>Método de Pago</Text>
                  <TouchableOpacity onPress={handleCloseCart} style={{ width: 26, alignItems: 'flex-end' }}>
                    <Ionicons name="close" size={28} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.paymentTotalBox}>
                  <Text style={styles.paymentTotalLabel}>Total a pagar</Text>
                  <Text style={styles.paymentTotalBig}>${totalCart.toLocaleString('es-CO')}</Text>
                </View>

                <Text style={styles.paymentSubtitle}>¿Cómo deseas pagar?</Text>

                <View style={styles.paymentGrid}>
                  
                  {/* Opción 1: Tarjeta */}
                  <TouchableOpacity 
                    style={[styles.paymentCard, paymentMethod === 'tarjeta' && styles.paymentCardActive]} 
                    onPress={() => setPaymentMethod('tarjeta')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.iconCircle, paymentMethod === 'tarjeta' && styles.iconCircleActive]}>
                      <Ionicons name="card" size={28} color={paymentMethod === 'tarjeta' ? '#E61C24' : '#64748B'} />
                    </View>
                    <Text style={[styles.paymentCardTitle, paymentMethod === 'tarjeta' && styles.paymentCardTitleActive]}>Tarjeta online</Text>
                    <Text style={styles.paymentCardDesc}>Link de pago seguro</Text>
                  </TouchableOpacity>

                  {/* Opción 2: Transferencia (Nequi / Bancos) */}
                  <TouchableOpacity 
                    style={[styles.paymentCard, paymentMethod === 'transferencia' && styles.paymentCardActive]} 
                    onPress={() => setPaymentMethod('transferencia')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.iconCircle, paymentMethod === 'transferencia' && styles.iconCircleActive]}>
                      <Ionicons name="phone-portrait" size={28} color={paymentMethod === 'transferencia' ? '#E61C24' : '#64748B'} />
                    </View>
                    <Text style={[styles.paymentCardTitle, paymentMethod === 'transferencia' && styles.paymentCardTitleActive]}>Transferencia</Text>
                    <Text style={styles.paymentCardDesc}>Nequi / DaviPlata</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.checkoutFooter}>
                  <TouchableOpacity 
                    style={[styles.confirmOrderBtn, !paymentMethod && styles.confirmOrderBtnDisabled]} 
                    onPress={handlePaymentNextStep}
                    disabled={!paymentMethod}
                  >
                    <Text style={styles.confirmOrderBtnText}>Continuar</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" style={{marginLeft: 8}} />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              // 1. PANTALLA DEL CARRITO
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Tu Pedido</Text>
                  <TouchableOpacity onPress={handleCloseCart}>
                    <Ionicons name="close" size={28} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {cart.length === 0 ? (
                  <View style={{alignItems: 'center', paddingVertical: 40}}>
                    <Ionicons name="cart-outline" size={60} color="#E2E8F0" />
                    <Text style={styles.emptyCartText}>Aún no has agregado nada.</Text>
                  </View>
                ) : (
                  <ScrollView style={{maxHeight: '55%'}} showsVerticalScrollIndicator={false}>
                    {cart.map((item, index) => (
                      <View key={item.cartId} style={styles.cartItem}>
                        <View style={styles.cartItemImageMini}>
                          <Text style={{fontSize: 24}}>{item.image}</Text>
                        </View>
                        <View style={{flex: 1, marginLeft: 12}}>
                          <Text style={styles.cartItemName}>{item.name}</Text>
                          <Text style={styles.cartItemPrice}>${item.price.toLocaleString('es-CO')}</Text>
                        </View>
                        <TouchableOpacity style={styles.deleteCartBtn} onPress={() => removeFromCart(item.cartId)}>
                          <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}

                {cart.length > 0 && (
                  <View style={styles.checkoutFooter}>
                    <View style={styles.checkoutTotalRow}>
                      <Text style={styles.checkoutTotalLabel}>Total:</Text>
                      <Text style={styles.checkoutTotalValue}>${totalCart.toLocaleString('es-CO')}</Text>
                    </View>
                    <TouchableOpacity style={styles.confirmOrderBtn} onPress={proceedToCheckout}>
                      <Text style={styles.confirmOrderBtnText}>Continuar al Pago</Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFF" style={{marginLeft: 8}} />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  toastContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 30, left: 20, right: 20, backgroundColor: '#10B981', padding: 16, borderRadius: 12, zIndex: 999, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
  toastText: { color: '#FFFFFF', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  menuButton: { marginRight: 15 },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  subtitle: { fontSize: 14, color: '#64748B' },
  cartButtonHeader: { position: 'relative', padding: 5, backgroundColor: '#F1F5F9', borderRadius: 20, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  cartBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#E61C24', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  cartBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  categoriesContainer: { paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#FFFFFF' },
  categoryBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F1F5F9', marginRight: 10, borderWidth: 1, borderColor: 'transparent' },
  categoryBtnActive: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
  categoryText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  categoryTextActive: { color: '#E61C24', fontWeight: 'bold' },

  menuList: { padding: 15, paddingBottom: 100 },
  menuCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 14, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  menuCardImagePlaceholder: { width: 85, height: 85, backgroundColor: '#F8FAFC', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuCardInfo: { flex: 1, justifyContent: 'space-between' },
  menuCardTitle: { fontSize: 17, fontWeight: 'bold', color: '#1E293B' },
  menuCardDesc: { fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 18 },
  menuCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  menuCardPrice: { fontSize: 18, fontWeight: '900', color: '#10B981' },
  
  addButton: { backgroundColor: '#E61C24', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },

  floatingCartBtn: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#E61C24', borderRadius: 16, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 8, shadowColor: '#E61C24', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8 },
  floatingCartLeft: { flexDirection: 'row', alignItems: 'center' },
  floatingCartCount: { backgroundColor: '#FFFFFF', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  floatingCartCountText: { color: '#E61C24', fontWeight: 'bold', fontSize: 16 },
  floatingCartText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  floatingCartTotal: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },

  confirmOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  confirmBox: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 25, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 15 },
  confirmImageCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 4, borderColor: '#F1F5F9' },
  confirmTitle: { fontSize: 16, color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
  confirmItemName: { fontSize: 24, fontWeight: '900', color: '#1E293B', textAlign: 'center', marginBottom: 5 },
  confirmItemPrice: { fontSize: 22, fontWeight: 'bold', color: '#10B981', marginBottom: 15 },
  confirmDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 25, paddingHorizontal: 10 },
  confirmActionsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 15 },
  confirmCancelBtn: { flex: 1, paddingVertical: 16, backgroundColor: '#F1F5F9', borderRadius: 14, alignItems: 'center' },
  confirmCancelText: { color: '#64748B', fontWeight: 'bold', fontSize: 16 },
  confirmAcceptBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', paddingVertical: 16, backgroundColor: '#E61C24', borderRadius: 14, alignItems: 'center', shadowColor: '#E61C24', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  confirmAcceptText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, minHeight: '45%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  backButton: { width: 26 },
  emptyCartText: { textAlign: 'center', fontSize: 16, color: '#94A3B8', marginTop: 15, fontWeight: '500' },
  
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cartItemImageMini: { width: 45, height: 45, backgroundColor: '#F8FAFC', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cartItemName: { fontSize: 16, color: '#1E293B', fontWeight: '600' },
  cartItemPrice: { fontSize: 15, color: '#10B981', fontWeight: 'bold', marginTop: 4 },
  deleteCartBtn: { padding: 10, backgroundColor: '#FEF2F2', borderRadius: 10 },

  paymentTotalBox: { alignItems: 'center', backgroundColor: '#F8FAFC', paddingVertical: 20, borderRadius: 16, marginBottom: 25 },
  paymentTotalLabel: { color: '#64748B', fontSize: 14, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 5 },
  paymentTotalBig: { color: '#1E293B', fontSize: 36, fontWeight: '900' },
  
  paymentSubtitle: { fontSize: 16, color: '#1E293B', fontWeight: 'bold', marginBottom: 15 },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  
  paymentCard: { width: '48%', backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 16, padding: 15, marginBottom: 15, alignItems: 'center', justifyContent: 'center' },
  paymentCardActive: { borderColor: '#E61C24', backgroundColor: '#FEF2F2' },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  iconCircleActive: { backgroundColor: '#FCA5A5' },
  paymentCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginBottom: 4 },
  paymentCardTitleActive: { color: '#B91C1C' },
  paymentCardDesc: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },

  // NUEVOS ESTILOS PARA LA TRANSFERENCIA / PAGO ONLINE
  bankInfoBox: { backgroundColor: '#F1F5F9', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20 },
  bankInfoText: { color: '#64748B', fontSize: 14, marginBottom: 5 },
  bankInfoTotal: { color: '#1E293B', fontSize: 32, fontWeight: '900', marginBottom: 15 },
  bankDataRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  bankDataLabel: { color: '#64748B', fontWeight: '600' },
  bankDataValue: { color: '#1E293B', fontWeight: 'bold' },
  payLinkBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 10 },
  payLinkBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  
  uploadSubtitle: { fontSize: 15, color: '#1E293B', fontWeight: 'bold', marginBottom: 15, textAlign: 'center', paddingHorizontal: 10 },
  uploadArea: { borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 16, padding: 30, alignItems: 'center', backgroundColor: '#F8FAFC' },
  uploadTextTitle: { color: '#3B82F6', fontWeight: 'bold', fontSize: 16, marginTop: 10, marginBottom: 4 },
  uploadTextSub: { color: '#94A3B8', fontSize: 12 },
  
  uploadedBox: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#10B981', borderRadius: 16, padding: 20, alignItems: 'center' },
  uploadedText: { color: '#065F46', fontWeight: 'bold', fontSize: 16, marginTop: 10, marginBottom: 10 },
  reuploadText: { color: '#3B82F6', fontWeight: 'bold', textDecorationLine: 'underline' },

  checkoutFooter: { marginTop: 10, paddingTop: 10 },
  checkoutTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  checkoutTotalLabel: { fontSize: 18, color: '#64748B', fontWeight: 'bold' },
  checkoutTotalValue: { fontSize: 26, color: '#1E293B', fontWeight: '900' },
  
  confirmOrderBtn: { flexDirection: 'row', justifyContent: 'center', backgroundColor: '#10B981', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  confirmOrderBtnDisabled: { backgroundColor: '#A7F3D0', shadowOpacity: 0 },
  confirmOrderBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },

  successContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
  successTitle: { fontSize: 28, fontWeight: '900', color: '#1E293B', marginTop: 20, marginBottom: 8 },
  successText: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 20 },
  successDivider: { height: 1, width: '100%', backgroundColor: '#F1F5F9', marginVertical: 15 },
  successNote: { fontSize: 15, color: '#3B82F6', textAlign: 'center', fontWeight: 'bold', paddingHorizontal: 20 }
});