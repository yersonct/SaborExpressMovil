import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { translateMobileCopy } from "../locales/mobileCopy";

type LanguageOption = {
    label: string;
    value: string;
};

type LanguageDropdownProps = {
    label?: string;
    value: string;
    options: LanguageOption[];
    onChange: (value: string) => void;
    compact?: boolean;
    colors?: { background: string; surface: string; text: string; mutedText: string; border: string; accent: string; accentSoft: string };
};

export const LanguageDropdown = ({ label = 'Idioma', value, options, onChange, compact = false, colors }: LanguageDropdownProps) => {
    const [visible, setVisible] = useState(false);

    const selectedOption = options.find((option) => option.value === value) ?? options[0];

    return (
        <>
            <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
                {label ? <Text style={[styles.label, colors && { color: colors.mutedText }]}>{label}</Text> : null}
                <TouchableOpacity style={[styles.trigger, compact && styles.triggerCompact, colors && { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setVisible(true)} activeOpacity={0.9}>
                    <View style={styles.triggerContent}>
                        <Text style={[styles.triggerText, colors && { color: colors.text }]}>{selectedOption?.label ?? translateMobileCopy("Seleccionar")}</Text>
                        <Text style={[styles.arrow, colors && { color: colors.accent }]}>▾</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
                <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
                    <View style={[styles.modalCard, colors && { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        {options.map((option) => {
                            const isSelected = option.value === value;

                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[styles.option, colors && { borderBottomColor: colors.border }, isSelected && (colors ? { backgroundColor: colors.accentSoft } : styles.optionSelected)]}
                                    onPress={() => {
                                        onChange(option.value);
                                        setVisible(false);
                                    }}
                                >
                                    <Text style={[styles.optionText, colors && { color: colors.text }, isSelected && !colors && styles.optionTextSelected, isSelected && colors && { color: colors.accent }]}>{option.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Pressable>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 16,
    },
    wrapperCompact: {
        marginBottom: 0,
        width: '100%',
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    trigger: {
        borderWidth: 1,
        borderColor: '#D4D4D8',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    triggerCompact: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        minWidth: 110,
    },
    triggerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    triggerText: {
        color: '#111111',
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
    },
    arrow: {
        color: '#E61C24',
        fontSize: 16,
        marginLeft: 8,
        fontWeight: '700',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E4E4E7',
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    option: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F4F4F5',
    },
    optionSelected: {
        backgroundColor: '#111111',
    },
    optionText: {
        color: '#111111',
        fontSize: 14,
        fontWeight: '600',
    },
    optionTextSelected: {
        color: '#FFFFFF',
    },
});
