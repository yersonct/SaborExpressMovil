import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Alert, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './style/ClientStyles';

export const ClientCheckoutModal = ({
  cartModalVisible,
  handleCloseCart,
  orderConfirmed,
  isUploadingReceipt,
  isCheckingOut,
  cart,
  removeFromCart,
  totalCart,
  proceedToCheckout,
  paymentMethod,
  setPaymentMethod,
  handlePaymentNextStep,
  receiptUploaded,
  setReceiptUploaded,
  handleFakeUploadReceipt,
  submitFinalOrder,
  setIsUploadingReceipt,
  setIsCheckingOut
}: any) => {

  return (
    <Modal animationType="slide" transparent={true} visible={cartModalVisible} onRequestClose={handleCloseCart}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, (isCheckingOut || isUploadingReceipt) && { minHeight: '65%' }]}>
          
          {orderConfirmed ? (
            // 4. PANTALLA DE ÉXITO
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={90} color="#10B981" />
              <Text style={styles.successTitle}>¡Pedido Confirmado!</Text>
              <Text style={styles.successText}>La cocina ya está preparando tu comida.</Text>
              <View style={styles.successDivider} />
              <Text style={styles.successNote}>Sigue el recorrido de tu repartidor en "Mi Perfil".</Text>
            </View>

          ) : isUploadingReceipt ? (
            // 3. PANTALLA DE CONFIRMACIÓN O COMPROBANTE DE PAGO
            <>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => { setIsUploadingReceipt(false); setIsCheckingOut(true); }} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={26} color="#1E293B" />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { flex: 1, textAlign: 'center' }]}>Confirmación</Text>
                <TouchableOpacity onPress={handleCloseCart} style={{ width: 26, alignItems: 'flex-end' }}>
                  <Ionicons name="close" size={28} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                
                {paymentMethod === 'wompi' ? (
                  // VISTA PARA PAGO CON WOMPI
                  <View style={styles.bankInfoBox}>
                    <Ionicons name="card" size={32} color="#1E293B" style={{marginBottom: 10}} />
                    <Text style={styles.bankInfoText}>Monto a pagar con Wompi:</Text>
                    <Text style={styles.bankInfoTotal}>${totalCart.toLocaleString('es-CO')}</Text>
                    
                    <TouchableOpacity style={styles.payLinkBtn} onPress={() => Alert.alert('Redirigiendo...', 'Abriendo pasarela segura de Wompi (Nequi, Tarjeta, PSE)')}>
                       <Ionicons name="lock-closed" size={16} color="#FFF" style={{marginRight: 6}} />
                       <Text style={styles.payLinkBtnText}>Ir a pagar con Wompi</Text>
                    </TouchableOpacity>
                    
                    <Text style={[styles.bankInfoText, {marginTop: 15, textAlign: 'center', fontSize: 13}]}>
                      Realiza el pago en el enlace seguro y guarda una captura de pantalla de la transacción aprobada.
                    </Text>
                  </View>
                ) : (
                  // VISTA PARA PAGO EN EFECTIVO (REPARTIDOR)
                  <View style={[styles.bankInfoBox, { backgroundColor: '#ECFDF5', borderColor: '#10B981', borderWidth: 1 }]}>
                    <Ionicons name="cash" size={40} color="#10B981" style={{marginBottom: 10}} />
                    <Text style={[styles.bankInfoText, {color: '#065F46'}]}>Pago en Efectivo (Contra entrega):</Text>
                    <Text style={[styles.bankInfoTotal, {color: '#047857'}]}>${totalCart.toLocaleString('es-CO')}</Text>
                    
                    <Text style={[styles.bankInfoText, {marginTop: 15, textAlign: 'center', fontSize: 14, color: '#065F46'}]}>
                      Le pagarás directamente al repartidor cuando entregue tu pedido. Por favor, intenta tener el dinero exacto.
                    </Text>
                  </View>
                )}

                {/* LA SUBIDA DE COMPROBANTE SOLO APARECE SI ES WOMPI */}
                {paymentMethod === 'wompi' && (
                  <>
                    <Text style={styles.uploadSubtitle}>Adjunta tu comprobante de Wompi para validar la orden:</Text>

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
                        <Text style={styles.uploadTextTitle}>Toca para subir captura</Text>
                        <Text style={styles.uploadTextSub}>Formatos: JPG o PNG</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                <TouchableOpacity 
                  style={[
                    styles.confirmOrderBtn, 
                    (paymentMethod === 'wompi' && !receiptUploaded) && styles.confirmOrderBtnDisabled, 
                    {marginTop: 20, marginBottom: 20}
                  ]} 
                  onPress={submitFinalOrder}
                  disabled={paymentMethod === 'wompi' && !receiptUploaded}
                >
                  <Ionicons name={paymentMethod === 'efectivo' ? "bicycle" : "paper-plane"} size={20} color="#FFF" style={{marginRight: 8}} />
                  <Text style={styles.confirmOrderBtnText}>
                    {paymentMethod === 'efectivo' ? 'Confirmar Pedido y Enviar' : 'Procesar Pago y Pedido'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </>

          ) : isCheckingOut ? (
            // 2. PANTALLA DE SELECCIÓN DE MÉTODO DE PAGO
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
                
                {/* OPCIÓN 1: WOMPI */}
                <TouchableOpacity 
                  style={[styles.paymentCard, paymentMethod === 'wompi' && styles.paymentCardActive]} 
                  onPress={() => {
                    setPaymentMethod('wompi');
                    setReceiptUploaded(false); // Requiere subir foto obligatoriamente
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconCircle, paymentMethod === 'wompi' && styles.iconCircleActive]}>
                    <Ionicons name="card" size={28} color={paymentMethod === 'wompi' ? '#E61C24' : '#64748B'} />
                  </View>
                  <Text style={[styles.paymentCardTitle, paymentMethod === 'wompi' && styles.paymentCardTitleActive]}>Wompi</Text>
                  <Text style={styles.paymentCardDesc}>Nequi, Tarjetas, PSE</Text>
                </TouchableOpacity>

                {/* OPCIÓN 2: EFECTIVO */}
                <TouchableOpacity 
                  style={[styles.paymentCard, paymentMethod === 'efectivo' && styles.paymentCardActive]} 
                  onPress={() => {
                    setPaymentMethod('efectivo');
                    setReceiptUploaded(true); // Engañamos al sistema para que no pida foto
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconCircle, paymentMethod === 'efectivo' && styles.iconCircleActive]}>
                    <Ionicons name="cash" size={28} color={paymentMethod === 'efectivo' ? '#E61C24' : '#64748B'} />
                  </View>
                  <Text style={[styles.paymentCardTitle, paymentMethod === 'efectivo' && styles.paymentCardTitleActive]}>Efectivo</Text>
                  <Text style={styles.paymentCardDesc}>Pago al repartidor</Text>
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
            // 1. PANTALLA DEL CARRITO (Tus platos seleccionados)
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
                  {cart.map((item: any) => (
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
  );
};