import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },

    headerTopBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 10,
        zIndex: 10,
    },
    themeToggle: {
        flexDirection: 'row',
        borderRadius: 30,
        padding: 4,
        alignItems: 'center',
    },
    themeIconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    themeIconButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    languageSelectorContainer: {
        width: 130,
    },

    scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 80 },
    logoContainer: { alignItems: 'center', marginBottom: -60 },
    logo: { width: '100%', height: 320, marginBottom: -20 },

    formContainer: {
        width: '100%', padding: 32, borderRadius: 24,
        shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 10,
    },
    backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    backButtonText: { fontSize: 15, fontWeight: '600' },
    forgotPasswordContainer: { alignItems: 'flex-end', marginBottom: 20, marginTop: -5 },
    forgotText: { color: '#E61C24', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
    errorText: { color: '#E61C24', fontSize: 14, textAlign: 'center', marginBottom: 15, fontWeight: '500', backgroundColor: 'rgba(230, 28, 36, 0.1)', padding: 10, borderRadius: 8 },
    loader: { marginTop: 10, marginBottom: 10 },

    loginButton: { height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#E61C24', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
    loginButtonText: { fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },

    registerClientLinkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
    registerClientText: { fontSize: 14, fontWeight: '500' },
    registerClientAction: { color: '#E61C24', fontSize: 14, fontWeight: 'bold' },

    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
    line: { flex: 1, height: 1 },
    dividerText: { marginHorizontal: 15, fontSize: 13, fontWeight: '600' },
    workWithUsBtn: { flexDirection: 'row', height: 54, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    workWithUsText: { fontSize: 15, fontWeight: '600' },

    welcomeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    profileCard: { width: '100%', borderRadius: 24, padding: 40, alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, marginBottom: 40 },
    profileImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 25, borderWidth: 4, borderColor: '#E61C24' },
    welcomeTitle: { fontSize: 16, marginBottom: 8, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    userName: { fontSize: 28, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
    roleBadge: { backgroundColor: 'rgba(230, 28, 36, 0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(230, 28, 36, 0.2)' },
    roleText: { color: '#E61C24', fontWeight: '800', fontSize: 13, letterSpacing: 1.2 },
    logoutButton: { width: '100%', height: 56, borderWidth: 2, borderColor: '#E61C24', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    logoutButtonText: { color: '#E61C24', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
});
