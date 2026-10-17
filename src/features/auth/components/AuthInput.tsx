import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AuthInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
  error?: boolean;
  themeColors: any;
  inputRef?: React.Ref<TextInput>;
  onFocus?: () => void;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad"; // 🔥 nuevo
  maxLength?: number; // 🔥 nuevo
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  showPasswordToggle = false,
  onTogglePassword,
  error,
  themeColors,
  inputRef,
  onFocus,
  keyboardType = "default",
  maxLength,
}) => {
  return (
    <>
      <Text style={[styles.inputLabel, { color: themeColors.text }]}>
        {label}
      </Text>
      <View
        style={[
          styles.inputWrapper,
          error ? styles.inputErrorBorder : null,
          {
            backgroundColor: themeColors.inputBackground,
            borderColor: themeColors.border,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          onFocus={onFocus}
          style={[styles.input, { color: themeColors.text }]}
          placeholder={placeholder}
          placeholderTextColor="#A0A0A0"
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          maxLength={maxLength}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={onTogglePassword}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={secureTextEntry ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#64748B"
            />
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  inputErrorBorder: { borderColor: "#E61C24" },
  input: { flex: 1, fontSize: 15 },
});
