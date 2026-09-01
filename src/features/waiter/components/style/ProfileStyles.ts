import { StyleSheet, Platform } from 'react-native';

const baseFontFamily = Platform.select({ web: 'system-ui, -apple-system, sans-serif', default: undefined });

export const profileStyles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', fontFamily: baseFontFamily },
    container: { padding: 20, paddingBottom: 40 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 15, fontFamily: baseFontFamily },
    statsSection: { marginBottom: 30 },
    statsCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, justifyContent: 'space-around', alignItems: 'center' },
    statColumn: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginTop: 8, fontFamily: baseFontFamily },
    statLabel: { fontSize: 13, color: '#64748B', marginTop: 2, textAlign: 'center', fontFamily: baseFontFamily },
    dividerVertical: { width: 1, height: 50, backgroundColor: '#E2E8F0' },
    profileSection: { marginBottom: 20 },
    profileHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    editButtonText: { color: '#E61C24', fontWeight: 'bold', fontSize: 16, fontFamily: baseFontFamily },
    profileCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    avatarContainer: { alignItems: 'center', marginBottom: 20 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', borderWidth: 2, borderColor: '#E2E8F0' },
    inputGroup: { marginBottom: 15 },
    inputLabel: { fontSize: 13, color: '#64748B', marginBottom: 6, fontWeight: '600', textTransform: 'uppercase', fontFamily: baseFontFamily },
    input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, color: '#1E293B', fontFamily: baseFontFamily },
    inputDisabled: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#64748B' },
    inputError: { borderColor: '#EF4444', borderWidth: 1.5 },
    errorText: { color: '#EF4444', fontSize: 12, marginTop: 5, marginLeft: 4, fontWeight: '500', fontFamily: baseFontFamily },
});
