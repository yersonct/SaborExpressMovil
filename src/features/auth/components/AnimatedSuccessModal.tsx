import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Image, ActivityIndicator, Animated, StyleSheet } from 'react-native';

interface AnimatedSuccessModalProps {
    visible: boolean;
    title: string;
    text: string;
}

export const AnimatedSuccessModal: React.FC<AnimatedSuccessModalProps> = ({ visible, title, text }) => {
    const [scaleAnim] = useState(() => new Animated.Value(0.5));
    const [opacityAnim] = useState(() => new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true })
            ]).start();
        } else {
            scaleAnim.setValue(0.5);
            opacityAnim.setValue(0);
        }
    }, [opacityAnim, scaleAnim, visible]);

    return (
        <Modal transparent={true} visible={visible} animationType="fade">
            <View style={styles.modalOverlay}>
                <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
                    <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/190/190411.png' }} style={styles.successIcon} />
                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={styles.modalText}>{text}</Text>
                    <ActivityIndicator size="small" color="#E61C24" style={{ marginTop: 15 }} />
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContent: {
        width: '80%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, alignItems: 'center',
        shadowColor: '#E61C24', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 15
    },
    successIcon: { width: 60, height: 60, marginBottom: 15 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', marginBottom: 8 },
    modalText: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 }
});
