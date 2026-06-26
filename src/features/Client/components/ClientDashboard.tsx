import React, { useState, useRef } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, FlatList, Modal, Animated, Platform, UIManager, ScrollView, Alert, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';

// 🔥 Importaciones modulares
import { styles } from './style/ClientStyles';
import { CATEGORIES, MENU_ITEMS } from './ClientData';
import { ClientCheckoutModal } from './ClientCheckoutModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ClientDashboard() { 
  const navigation = useNavigation();
  
  // Estados Generales
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [cart, setCart] = useState<any[]>([]);
  
  // Modales
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [confirmItemModalVisible, setConfirmItemModalVisible] = useState(false);
  const [itemToConfirm, setItemToConfirm] = useState<any | null>(null);

  // Estados de flujo de pago
  const [isCheckingOut, setIsCheckingOut] = useState(false); 
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false); 
  const [paymentMethod, setPaymentMethod] = useState(''); 
  const [receiptUploaded, setReceiptUploaded] = useState(false); 
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  // Animaciones Toast
  const toastAnim = useRef(new Animated.Value(-100)).current;
  const [toastMessage, setToastMessage] = useState('');

  const filteredMenu = activeCategory === 'Todos' ? MENU_ITEMS : MENU_ITEMS.filter(item => item.category === activeCategory);
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
    if (cart.length === 1) handleCloseCart();
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
    if (!paymentMethod) return Alert.alert("Selecciona un método de pago", "Debes elegir cómo deseas pagar antes de continuar.");
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCheckingOut(false);
    setIsUploadingReceipt(true);
  };

  const handleFakeUploadReceipt = () => {
    setReceiptUploaded(true);
    showToast("✅ Evidencia cargada correctamente");
  };

  const submitFinalOrder = () => {
    if (!receiptUploaded) return Alert.alert("Falta el comprobante", "Por favor sube la captura de pantalla de tu pago para confirmar la orden.");
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
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <Ionicons name="menu" size={28} color="#1E293B" />
          </TouchableOpacity>
          <View>
            <Text style={styles.greeting}>Hola, Cliente 👋</Text>
            <Text style={styles.subtitle}>¿Qué vas a pedir hoy?</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.cartButtonHeader} onPress={() => setCartModalVisible(true)}>
          <Ionicons name="cart" size={24} color="#1E293B" />
          {cart.length > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cart.length}</Text></View>}
        </TouchableOpacity>
      </View>

      {/* CATEGORÍAS */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {CATEGORIES.map((cat, index) => (
            <TouchableOpacity key={index} style={[styles.categoryBtn, activeCategory === cat && styles.categoryBtnActive]} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiveCategory(cat) }}>
              <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* MENÚ PRINCIPAL */}
      <FlatList
        data={filteredMenu}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.menuList}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.menuCard} activeOpacity={0.7} onPress={() => handleItemPress(item)}>
            <View style={styles.menuCardImagePlaceholder}><Text style={{fontSize: 40}}>{item.image}</Text></View>
            <View style={styles.menuCardInfo}>
              <Text style={styles.menuCardTitle}>{item.name}</Text>
              <Text style={styles.menuCardDesc} numberOfLines={2}>{item.desc}</Text>
              <View style={styles.menuCardFooter}>
                <Text style={styles.menuCardPrice}>${item.price.toLocaleString('es-CO')}</Text>
                <View style={styles.addButton}><Ionicons name="add" size={20} color="#FFF" /></View>
              </View>
            </View>
          </TouchableOpacity>
        )}
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
            <View style={styles.confirmImageCircle}><Text style={{fontSize: 50}}>{itemToConfirm?.image}</Text></View>
            <Text style={styles.confirmTitle}>¿Agregar al carrito?</Text>
            <Text style={styles.confirmItemName}>{itemToConfirm?.name}</Text>
            <Text style={styles.confirmItemPrice}>${itemToConfirm?.price.toLocaleString('es-CO')}</Text>
            <Text style={styles.confirmDesc}>{itemToConfirm?.desc}</Text>
            <View style={styles.confirmActionsRow}>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setConfirmItemModalVisible(false)}><Text style={styles.confirmCancelText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmAcceptBtn} onPress={confirmAddToCart}><Ionicons name="cart" size={18} color="#FFF" style={{marginRight: 8}} /><Text style={styles.confirmAcceptText}>Agregar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🔥 COMPONENTE SEPARADO: MODAL DE CHECKOUT */}
      <ClientCheckoutModal 
        cartModalVisible={cartModalVisible} handleCloseCart={handleCloseCart} orderConfirmed={orderConfirmed}
        isUploadingReceipt={isUploadingReceipt} isCheckingOut={isCheckingOut} cart={cart}
        removeFromCart={removeFromCart} totalCart={totalCart} proceedToCheckout={proceedToCheckout}
        paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} handlePaymentNextStep={handlePaymentNextStep}
        receiptUploaded={receiptUploaded} setReceiptUploaded={setReceiptUploaded} handleFakeUploadReceipt={handleFakeUploadReceipt}
        submitFinalOrder={submitFinalOrder} setIsUploadingReceipt={setIsUploadingReceipt} setIsCheckingOut={setIsCheckingOut}
      />
    </SafeAreaView>
  );
}