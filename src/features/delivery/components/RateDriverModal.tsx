import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { deliveryService } from "../services/deliveryService";
import { useClientPreferences, useClientThemedStyles } from "@/features/userPreferences/context/ClientPreferencesContext";
import { deferEffect } from "@/features/shared/utils/deferEffect";

type Props = {
  visible: boolean;
  deliveryId: number | null;
  driverName?: string | null;
  onClose: () => void;
  onSubmitted: () => void;
};

export default function RateDriverModal({
  visible,
  deliveryId,
  driverName,
  onClose,
  onSubmitted,
}: Props) {
  const s = useClientThemedStyles(baseStyles);
  const { t } = useClientPreferences();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => deferEffect(() => {
    if (visible) {
      setScore(0);
      setComment("");
    }
  }), [visible, deliveryId]);

  const submit = async () => {
    if (!deliveryId || score === 0) return;
    setSending(true);
    try {
      await deliveryService.rate(deliveryId, score, comment);
      onSubmitted();
      onClose();
      Alert.alert(t("thankYou"), t("sendRating"));
    } catch (err: any) {
      Alert.alert(
        t("error"),
        err?.message ?? t("ratingSendError"),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.title}>{t("deliveryComplete")}</Text>
          <Text style={s.subtitle}>
            {t("rateQuestion")} {driverName ?? t("assignedDriver")}?
          </Text>

          <View style={s.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => setScore(n)}
                disabled={sending}
              >
                <Ionicons
                  name={n <= score ? "star" : "star-outline"}
                  size={40}
                  color={n <= score ? "#F59E0B" : "#CBD5E1"}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.label}>{[
            "",
            t("rateVeryBad"),
            t("rateBad"),
            t("rateFair"),
            t("rateGood"),
            t("rateExcellent"),
          ][score] || t("starPrompt")}</Text>

          <TextInput
            style={s.input}
            placeholder={t("feedbackPlaceholder")}
            placeholderTextColor="#94A3B8"
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={250}
            editable={!sending}
          />

          <View style={s.row}>
            <TouchableOpacity
              style={[s.btn, s.later]}
              onPress={onClose}
              disabled={sending}
            >
              <Text style={s.laterText}>{t("notNow")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                s.btn,
                s.send,
                (score === 0 || sending) && { opacity: 0.5 },
              ]}
              onPress={submit}
              disabled={score === 0 || sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.sendText}>{t("sendRating")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const baseStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 24,
  },
  card: { backgroundColor: "#FFF", borderRadius: 20, padding: 22 },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
  },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 18,
  },
  label: {
    textAlign: "center",
    marginTop: 8,
    fontWeight: "700",
    color: "#F59E0B",
    minHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    minHeight: 70,
    textAlignVertical: "top",
    color: "#1E293B",
  },
  row: { flexDirection: "row", gap: 10, marginTop: 18 },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  later: { backgroundColor: "#F1F5F9" },
  laterText: { color: "#64748B", fontWeight: "700" },
  send: { backgroundColor: "#E61C24" },
  sendText: { color: "#FFF", fontWeight: "700" },
});
