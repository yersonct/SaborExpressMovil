import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface InitialsAvatarProps {
  name?: string | null;
  lastName?: string | null;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
}

export const InitialsAvatar = ({
  name,
  lastName,
  size = 80,
  backgroundColor = "#FEF2F2",
  textColor = "#E61C24",
}: InitialsAvatarProps) => {
  const initials =
    [name?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4, color: textColor }]}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontWeight: "900",
  },
});
