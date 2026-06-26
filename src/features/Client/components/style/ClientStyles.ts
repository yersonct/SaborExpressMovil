import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
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