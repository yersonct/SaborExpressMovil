import { StyleSheet, Platform } from 'react-native';

const baseFontFamily = Platform.select({ web: 'system-ui, -apple-system, sans-serif', default: undefined });

export const settingsStyles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
    topHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', fontFamily: baseFontFamily },
    container: { padding: 20, paddingBottom: 40 },
    section: { marginBottom: 25 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1, fontFamily: baseFontFamily },
    card: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
    languageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
    settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    textGroup: { marginLeft: 15, flex: 1 },
    settingTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 2, fontFamily: baseFontFamily },
    settingDesc: { fontSize: 13, color: '#94A3B8', fontFamily: baseFontFamily },
    divider: { height: 1, backgroundColor: '#F1F5F9' },
    logoutButton: {
        backgroundColor: '#EF4444',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 4,
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 18,
        marginLeft: 10,
        fontFamily: baseFontFamily,
    }
});
