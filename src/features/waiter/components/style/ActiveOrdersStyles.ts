import { StyleSheet, Platform } from 'react-native';

const baseFontFamily = Platform.select({ web: 'system-ui, -apple-system, sans-serif', default: undefined });

export const localStyles = StyleSheet.create({
    actionsContainer: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    addMoreBtn: {
        backgroundColor: '#F8FAFC',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 12,
    },
    addMoreBtnText: {
        color: '#475569',
        fontWeight: 'bold',
        fontSize: 15,
        fontFamily: baseFontFamily,
    },
    decisionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    cancelBtn: {
        flex: 0.8,
        backgroundColor: '#FEF2F2',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    cancelBtnText: {
        color: '#EF4444',
        fontWeight: 'bold',
        fontSize: 15,
        fontFamily: baseFontFamily,
    },
    confirmBtn: {
        flex: 1.2,
        backgroundColor: '#10B981',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
        fontFamily: baseFontFamily,
    }
});

export const modalStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    modalBox: { width: '85%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 10 },
    iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16, backgroundColor: '#FEE2E2' },
    title: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 8, textAlign: 'center', fontFamily: baseFontFamily },
    message: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 24, fontFamily: baseFontFamily },
    buttonContainer: { flexDirection: 'row', gap: 12, width: '100%' },
    cancelModalBtn: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    cancelModalBtnText: { color: '#475569', fontWeight: 'bold', fontSize: 16, fontFamily: baseFontFamily },
    confirmModalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#EF4444' },
    confirmModalBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, fontFamily: baseFontFamily },
});
