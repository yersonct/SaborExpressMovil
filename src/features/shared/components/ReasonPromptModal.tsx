import React from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { translateMobileCopy } from '@/locales/mobileCopy';

interface Props {
  visible: boolean;
  title: string;
  description: string;
  placeholder: string;
  cancelLabel: string;
  confirmLabel: string;
  value: string;
  onChangeText: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
  minimumLength?: number;
}

export function ReasonPromptModal({
  visible,
  title,
  description,
  placeholder,
  cancelLabel,
  confirmLabel,
  value,
  onChangeText,
  onCancel,
  onConfirm,
  busy = false,
  minimumLength = 3,
}: Props) {
  const disabled = busy || value.trim().length < minimumLength;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 18, backgroundColor: 'rgba(15,23,42,0.65)' }}>
        <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, gap: 12 }}>
          <Text style={{ color: '#172033', fontSize: 19, fontWeight: '800' }}>{title}</Text>
          <Text style={{ color: '#64748B', fontSize: 14, lineHeight: 20 }}>{description}</Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            editable={!busy}
            multiline
            maxLength={300}
            accessibilityLabel={title}
            accessibilityHint={value.trim().length < minimumLength
              ? translateMobileCopy('Escribe al menos {{count}} caracteres.', { count: minimumLength })
              : undefined}
            textAlignVertical="top"
            style={{ minHeight: 96, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 12, color: '#172033', fontSize: 15 }}
          />
          {value.trim().length < minimumLength && (
            <Text accessibilityRole="alert" style={{ color: '#B91C1C', fontSize: 12 }}>
              {translateMobileCopy('Escribe al menos {{count}} caracteres.', { count: minimumLength })}
            </Text>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
            <Pressable disabled={busy} onPress={onCancel} accessibilityRole="button" style={{ paddingHorizontal: 14, paddingVertical: 11 }}>
              <Text style={{ color: '#475569', fontWeight: '700' }}>{cancelLabel}</Text>
            </Pressable>
            <Pressable disabled={disabled} onPress={onConfirm} accessibilityRole="button" style={{ borderRadius: 9, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: '#DC2626', opacity: disabled ? 0.5 : 1 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
