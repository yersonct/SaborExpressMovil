import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: { width: '100%' },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    backButton: { paddingRight: 15 },
    title: { fontSize: 22, fontWeight: 'bold' },
    subtitle: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4, marginTop: 10 },
    rolesContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 15 },
    roleCard: {
        width: '48%', padding: 15, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center'
    },
    roleCardActive: { backgroundColor: '#E61C24', borderColor: '#E61C24' },
    roleText: { marginTop: 8, fontSize: 14, fontWeight: '600' },
    
    cvButton: {
        flexDirection: 'row', alignItems: 'center', height: 54, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', paddingHorizontal: 15, marginBottom: 20
    },
    cvButtonText: { fontSize: 14, marginLeft: 10, flex: 1, fontWeight: '500' },

    errorText: { color: '#E61C24', fontSize: 14, textAlign: 'center', marginBottom: 15, fontWeight: '600', backgroundColor: 'rgba(230, 28, 36, 0.1)', padding: 10, borderRadius: 8 },
    submitButton: { height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 5, shadowColor: '#E61C24', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
    submitButtonText: { fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
});