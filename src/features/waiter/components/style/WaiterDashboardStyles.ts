import { StyleSheet, Platform } from 'react-native';

const baseFontFamily = Platform.select({ web: 'system-ui, -apple-system, sans-serif', default: undefined });

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },

  // CABECERA CON MENÚ HAMBURGUESA
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 40 : 20
  },
  menuHamburgerBtn: { padding: 5, marginRight: 10 },
  headerTitlesBox: { flex: 1 },
  mainTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', fontFamily: baseFontFamily },
  mainSubtitle: { fontSize: 14, color: '#64748B', fontFamily: baseFontFamily },

  toGoButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5
  },
  toGoButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, marginLeft: 6 },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0'
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    gap: 8
  },
  activeTab: { borderBottomColor: '#E61C24' },
  tabText: { fontSize: 15, fontWeight: 'bold', color: '#64748B', fontFamily: baseFontFamily },
  activeTabText: { color: '#E61C24', fontFamily: baseFontFamily },

  // 🔥 OCUPA TODO EL ALTO Y ANCHO DE LA PANTALLA
  content: {
    flex: 1,
    padding: 16,
    width: '100%',
    height: '100%'
  },
  instructionsText: { color: '#64748B', marginBottom: 16, textAlign: 'center', fontStyle: 'italic', fontFamily: baseFontFamily },

  // DISEÑO MESAS
  tableGridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  tableGridCardOccupied: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  statusDot: { position: 'absolute', top: 12, right: 12, width: 12, height: 12, borderRadius: 6 },
  gridTableName: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 4, fontFamily: baseFontFamily },
  capacityBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8, gap: 4 },
  capacityText: { fontSize: 12, color: '#64748B', fontWeight: '600', fontFamily: baseFontFamily },
  gridTableStatus: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' },
  gridTableWaiter: { fontSize: 11, fontWeight: '600', marginTop: 5, textAlign: 'center', fontFamily: baseFontFamily },

  // ÓRDENES ACTIVAS
  emptyOrders: { alignItems: 'center', marginTop: 50 },
  emptyOrdersText: { color: '#94A3B8', fontSize: 16, marginTop: 10, fontWeight: '500', fontFamily: baseFontFamily },
  activeOrderCard: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  activeOrderHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  orderIdText: { fontSize: 13, color: '#94A3B8', fontWeight: 'bold', marginBottom: 4, fontFamily: baseFontFamily },
  orderTableText: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginBottom: 4, fontFamily: baseFontFamily },
  orderTimeText: { fontSize: 14, color: '#64748B', fontWeight: '600', fontFamily: baseFontFamily },
  badgeStatus: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginBottom: 8 },
  // Alinear colores con Tablero del `chef` (pendiente / preparando / listo)
  badgePrep: { backgroundColor: 'rgba(245,158,11,0.15)' },
  badgeReady: { backgroundColor: 'rgba(16,185,129,0.15)' },
  badgeStatusText: { fontSize: 12, fontWeight: 'bold', fontFamily: baseFontFamily },
  badgePrepText: { color: '#fbbf24', fontFamily: baseFontFamily },
  badgeReadyText: { color: '#34d399', fontFamily: baseFontFamily },
  expandText: { fontSize: 13, color: '#3B82F6', fontWeight: '600' },

  activeOrderDetails: { padding: 16, paddingTop: 0 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 },
  orderItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderItemMain: { flexDirection: 'row', flex: 1 },
  orderItemQty: { fontSize: 16, fontWeight: '900', color: '#E61C24', width: 25, fontFamily: baseFontFamily },
  orderItemName: { fontSize: 15, color: '#334155', fontFamily: baseFontFamily },

  badgeMesa: { fontSize: 10, backgroundColor: '#F1F5F9', color: '#475569', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold' },
  badgeToGo: { fontSize: 10, backgroundColor: '#FEF2F2', color: '#E61C24', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold' },
  miniBadgeCocina: { fontSize: 10, backgroundColor: '#FFFBEB', color: '#D97706', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold' },
  miniBadgeBarra: { fontSize: 10, backgroundColor: '#E0F2FE', color: '#0369A1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold' },

  orderActions: { flexDirection: 'row', marginTop: 16, gap: 10 },
  actionAddBtn: { flex: 1, backgroundColor: '#F1F5F9', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1' },
  actionAddText: { color: '#475569', fontWeight: 'bold' },
  actionReadyBtn: { flex: 1, backgroundColor: '#D1FAE5', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#A7F3D0' },
  actionReadyText: { color: '#047857', fontWeight: 'bold' },
  actionDeliverBtn: { flex: 1, backgroundColor: '#10B981', padding: 12, borderRadius: 8, alignItems: 'center' },
  actionDeliverText: { color: '#FFF', fontWeight: 'bold' },

  // 🔥 ESTILO BOTÓN CANCELAR 
  actionCancelBtn: { flex: 1, backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  actionCancelText: { color: '#E61C24', fontWeight: 'bold' },

  // VISTA TOMANDO PEDIDO
  orderHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#1E293B' },
  backButton: { marginRight: 20, padding: 5 },
  orderHeaderTitle: { color: '#94A3B8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  orderHeaderTable: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },

  menuList: { padding: 16 },
  menuCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 5, elevation: 2 },
  menuItemName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 4, fontFamily: baseFontFamily },
  menuItemDesc: { fontSize: 13, color: '#64748B', marginBottom: 8, fontFamily: baseFontFamily },
  menuItemPrice: { fontSize: 16, fontWeight: '900', color: '#10B981', fontFamily: baseFontFamily },
  menuCardActions: { alignItems: 'flex-end', marginLeft: 12 },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  addButtonText: { fontSize: 24, color: '#E61C24', fontWeight: 'bold', marginTop: -2 },

  // CARRITO FLOTANTE Y SELECTORES
  floatingCart: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cartHeaderText: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', fontFamily: baseFontFamily },
  cartExpandedArea: { padding: 16, backgroundColor: '#F8FAFC' },
  emptyCartText: { textAlign: 'center', color: '#94A3B8', fontStyle: 'italic' },

  cartItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cartItemInfo: { flex: 1 },






  cartItemTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 15, },






  cartItemText: { fontSize: 15, color: '#334155', marginBottom: 6, fontFamily: baseFontFamily },



  cartNoteButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#00000094', justifyContent: 'center', alignItems: 'center', marginTop: 32, marginRight: 5, position: 'absolute', right: 0, top: -20 },






  cartNoteButtonActive: { backgroundColor: '#FEF2F2', borderColor: '#FECACA', position: 'absolute', right: 0, top: -10 },
  cartItemNote: { fontSize: 12, color: '#0F766E', fontWeight: '600', marginBottom: 6, lineHeight: 16, fontFamily: baseFontFamily },
  buttonred: { position: 'absolute', right: 0, top: -20 },
  toGoToggleBtn: { alignSelf: 'flex-start', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' },
  toGoToggleBtnActive: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  toGoToggleText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  toGoToggleTextActive: { color: '#E61C24', fontWeight: 'bold' },

  cartItemPrice: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginRight: 15, fontFamily: baseFontFamily },
  deleteButton: { backgroundColor: '#FEE2E2', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  deleteButtonText: { color: '#EF4444', fontSize: 12, fontWeight: 'bold' },

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
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', fontFamily: baseFontFamily },

  noteModalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  noteModalCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  noteModalIconWrap: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 12, alignSelf: 'center' },
  noteModalTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', textAlign: 'center', fontFamily: baseFontFamily },
  noteModalSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 8, marginBottom: 14, lineHeight: 18, fontFamily: baseFontFamily },
  noteModalInput: { minHeight: 110, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 14, padding: 14, fontSize: 15, color: '#1E293B', textAlignVertical: 'top', backgroundColor: '#F8FAFC' },
  noteModalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  noteModalCancelBtn: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  noteModalCancelText: { color: '#475569', fontWeight: '700', fontFamily: baseFontFamily },
  noteModalConfirmBtn: { flex: 1, backgroundColor: '#E61C24', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  noteModalConfirmText: { color: '#FFFFFF', fontWeight: '700', fontFamily: baseFontFamily }
});
