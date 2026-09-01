import React, { useState, useRef } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, Animated, Platform, UIManager, LayoutAnimation, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { styles } from './style/CashierStyles';
import { useCashierContext } from '../components/context/CashierContext';
import { INITIAL_ORDERS, STAFF_TODAY, Order, Employee } from './CashierData';
import { OrdersFeature } from './OrdersFeature';
import { TRANSLATIONS, LanguageCode } from './../../../locales/CashierTranslations';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CashierDashboard() {
  const navigation = useNavigation();
  const { language, isDark } = useCashierContext();
  const t = TRANSLATIONS[language as LanguageCode] || TRANSLATIONS['es'];

  // 🔥 PALETA GLOBAL DE COLORES
  const colors = {
    background: isDark ? '#0F172A' : '#F8FAFC',
    card: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#F8FAFC' : '#1E293B',
    muted: isDark ? '#94A3B8' : '#64748B',
    border: isDark ? '#334155' : '#E2E8F0',
    buttonDark: isDark ? '#334155' : '#1E293B',
  };

  const [activeTab, setActiveTab] = useState<'mesa' | 'llevar' | 'personal'>('mesa');
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [staff, setStaff] = useState<Employee[]>(STAFF_TODAY);
  const [paidHistory, setPaidHistory] = useState<Order[]>([
    { id: 'ORD-099', type: 'mesa', items: 'Base de Caja', total: 35000, status: 'pagado', paymentMethod: 'efectivo', time: '11:00 AM' }, 
    ...INITIAL_ORDERS.filter(o => o.status === 'pagado')
  ]);
  const [closeRegisterModal, setCloseRegisterModal] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const toastAnim = useRef(new Animated.Value(-100)).current;

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
      const newDeliveryOrder: Order = { id: randomId, type: 'llevar', items: '2x Pizza Express\n1x Coca-Cola', total: randomTotal, status: 'pagando_transferencia', paymentMethod: 'transferencia', deliveryPerson: 'Por asignar', time: timeNow, transferProofUrl: 'https://cdn-icons-png.flaticon.com/512/2942/2942269.png' };
      setOrders(prev => [newDeliveryOrder, ...prev]);
      showToast(t.toastDeliveryReceived.replace('${total}', randomTotal.toLocaleString('es-CO')));
    } else {
      const newTableOrder: Order = { id: randomId, type: 'mesa', table: Math.floor(Math.random() * 10) + 1, items: '3x Menú Ejecutivo\n2x Jugo Natural', total: randomTotal, status: 'pendiente', time: timeNow };
      setOrders(prev => [newTableOrder, ...prev]);
      showToast(t.toastTableReady.replace('{table}', String(newTableOrder.table)));
    }
  };

  const handleCloseRegister = () => {
    setCloseRegisterModal(false);
    showToast(t.toastShiftClosed);
  };

  const totalEfectivo = paidHistory.filter(o => o.paymentMethod === 'efectivo').reduce((acc, curr) => acc + curr.total, 0);
  const totalTransferencia = paidHistory.filter(o => o.paymentMethod === 'transferencia').reduce((acc, curr) => acc + curr.total, 0);
  const totalGlobal = totalEfectivo + totalTransferencia;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastAnim }] }]}><Text style={styles.toastText}>{toastMessage}</Text></Animated.View>

      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t.cashierTitle}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>{t.shiftManagement}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.simulateOrderBtn} onPress={simulateIncomingOrder}>
            <Ionicons name="notifications-outline" size={16} color="#FFFFFF" />
            <Text style={styles.simulateOrderBtnText}>{t.simulateBtn}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.closeRegisterBtn, { backgroundColor: colors.buttonDark }]} onPress={() => setCloseRegisterModal(true)}>
            <Ionicons name="lock-closed-outline" size={16} color="#FFFFFF" />
            <Text style={styles.closeRegisterBtnText}>{t.closeShiftBtn}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* PESTAÑAS */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'mesa' && styles.tabButtonActive]} onPress={() => setActiveTab('mesa')}>
          <Text style={[styles.tabText, { color: colors.muted }, activeTab === 'mesa' && styles.tabTextActive]}>
            {t.tabTables} ({orders.filter(o => o.type === 'mesa' && o.status !== 'pagado').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabButton, activeTab === 'llevar' && styles.tabButtonActive]} onPress={() => setActiveTab('llevar')}>
          <Text style={[styles.tabText, { color: colors.muted }, activeTab === 'llevar' && styles.tabTextActive]}>
            {t.tabTakeaway} {orders.some(o => o.type === 'llevar' && o.status === 'pagando_transferencia') ? '🔴' : ''} ({orders.filter(o => o.type === 'llevar' && o.status !== 'pagado').length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {(activeTab === 'mesa' || activeTab === 'llevar') && (
          <OrdersFeature 
            orders={orders} 
            setOrders={setOrders} 
            setPaidHistory={setPaidHistory} 
            showToast={showToast} 
            filterType={activeTab} 
            setActiveTab={setActiveTab}
            lang={language} 
            isDark={isDark} 
          />
        )}
      </View>

      {/* MODAL DE CUADRE DE CAJA */}
      <Modal animationType="fade" transparent={true} visible={closeRegisterModal} onRequestClose={() => setCloseRegisterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.registerSummaryTitle}</Text>
              <TouchableOpacity onPress={() => setCloseRegisterModal(false)}><Text style={styles.closeIcon}>✕</Text></TouchableOpacity>
            </View>

            <View style={[styles.summaryContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.summarySubtitle, { color: colors.muted }]}>{t.shiftSummarySubtitle}</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Ionicons name="cash-outline" size={24} color="#10B981" />
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>{t.cashInDrawer}</Text>
                </View>
                <Text style={styles.summaryValueEfectivo}>${totalEfectivo.toLocaleString('es-CO')}</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Ionicons name="swap-horizontal-outline" size={24} color="#3B82F6" />
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>{t.transfersAppBank}</Text>
                </View>
                <Text style={styles.summaryValueTransfer}>${totalTransferencia.toLocaleString('es-CO')}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.totalSummaryRow}>
                <Text style={[styles.totalSummaryLabel, { color: colors.text }]}>{t.totalSales}</Text>
                <Text style={styles.totalSummaryValue}>${totalGlobal.toLocaleString('es-CO')}</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.closeShiftBtn, { backgroundColor: colors.buttonDark }]} onPress={handleCloseRegister}>
              <Text style={styles.closeShiftBtnText}>{t.approveAndCloseShift}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}