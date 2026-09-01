import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    backButton: {
        paddingRight: 15,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 25,
        lineHeight: 20,
    },
    errorText: {
        color: '#E61C24',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 15,
        fontWeight: '600',
        backgroundColor: 'rgba(230, 28, 36, 0.1)',
        padding: 10,
        borderRadius: 8,
    },
    submitButton: {
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#E61C24',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});