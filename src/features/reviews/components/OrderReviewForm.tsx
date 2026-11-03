import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getCustomerIdFromToken } from "@/features/auth/services/decodeToken";
import { useClientPreferences } from "@/features/userPreferences/context/ClientPreferencesContext";
import { translateMobileCopy } from "@/locales/mobileCopy";
import { reviewService, type OrderReview } from "../services/reviewService";

const errorMessage = (cause: unknown, fallback: string) => translateMobileCopy(
  cause && typeof cause === "object" && "message" in cause && typeof cause.message === "string" ? cause.message : fallback,
);

export function OrderReviewForm({ orderId }: { orderId: number }) {
  const { user } = useAuth();
  const { colors } = useClientPreferences();
  const customerId = user?.token ? getCustomerIdFromToken(user.token) : null;
  const [rating, setRating] = useState(0), [comment, setComment] = useState("");
  const [review, setReview] = useState<OrderReview | null>(null);
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const [error, setError] = useState(""), [retry, setRetry] = useState(0);
  const submitLock = useRef(false);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        if (!customerId) throw new Error(translateMobileCopy("No se identificó la cuenta del cliente."));
        const reviews = await reviewService.forCustomer(customerId);
        if (active) { setReview(reviews.find(item => item.orderId === orderId) ?? null); setError(""); }
      } catch (cause) {
        if (active) setError(errorMessage(cause, "No se pudieron cargar tus reseñas."));
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [customerId, orderId, retry]);
  const submit = async () => {
    if (submitLock.current || loading || saving || review) return;
    if (!rating) { setError(translateMobileCopy("Selecciona una calificación de 1 a 5 estrellas.")); return; }
    submitLock.current = true;
    setSaving(true); setError("");
    try { setReview(await reviewService.create(orderId, rating, comment)); }
    catch (cause) { setError(errorMessage(cause, "No se pudo enviar la reseña. Intenta nuevamente.")); }
    finally { submitLock.current = false; setSaving(false); }
  };
  return (
    <View style={styles.box}>
      <Text style={[styles.title, { color: colors.text }]}>{translateMobileCopy("Calificar el pedido")}</Text>
      {loading ? <ActivityIndicator color="#E61C24" /> : review ? (
        <View accessibilityRole="summary">
          <Text style={{ color: colors.text }}>{translateMobileCopy("Tu calificación del pedido")}: {review.rating}/5</Text>
          {!!review.comment && <Text style={{ color: colors.text }}>{review.comment}</Text>}
        </View>
      ) : (
        <>
          <View style={styles.stars} accessibilityLabel={translateMobileCopy("Calificación del pedido")}>
            {[1, 2, 3, 4, 5].map(value => (
              <TouchableOpacity key={value} accessibilityRole="radio" accessibilityState={{ checked: rating === value, disabled: saving }} accessibilityLabel={translateMobileCopy("{{rating}} de 5 estrellas", { rating: value })} disabled={saving} onPress={() => { setRating(value); setError(""); }} style={styles.star}>
                <Ionicons name={value <= rating ? "star" : "star-outline"} size={30} color="#F59E0B" />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={[styles.input, { color: colors.text }]} accessibilityLabel={translateMobileCopy("Comentario del pedido (opcional)")} placeholder={translateMobileCopy("Comentario del pedido (opcional)")} placeholderTextColor="#64748B" multiline maxLength={500} value={comment} onChangeText={setComment} editable={!saving} textAlignVertical="top" />
          <Text style={styles.count}>{comment.length}/500</Text>
          <TouchableOpacity style={[styles.button, (saving || !rating) && { opacity: 0.6 }]} onPress={() => { void submit(); }} disabled={saving || !rating} accessibilityRole="button" accessibilityState={{ disabled: saving || !rating, busy: saving }}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>{translateMobileCopy("Enviar reseña")}</Text>}
          </TouchableOpacity>
        </>
      )}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {!!error && !saving && <TouchableOpacity accessibilityRole="button" style={styles.retry} onPress={() => { setLoading(true); setRetry(value => value + 1); }}><Text style={{ color: colors.text }}>{translateMobileCopy("Reintentar")}</Text></TouchableOpacity>}
    </View>
  );
}
const styles = StyleSheet.create({
  box: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderColor: "#CBD5E1", gap: 10, width: "100%", maxWidth: 640, alignSelf: "center" },
  title: { fontSize: 17, fontWeight: "700", flexShrink: 1 },
  stars: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 4 },
  star: { minWidth: 44, minHeight: 48, alignItems: "center", justifyContent: "center" },
  input: { borderWidth: 1, borderColor: "#94A3B8", borderRadius: 10, padding: 12, minHeight: 100, fontSize: 16 },
  count: { textAlign: "right", color: "#64748B", fontSize: 12 },
  button: { minHeight: 48, padding: 12, backgroundColor: "#E61C24", borderRadius: 10, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#FFFFFF", fontWeight: "700", textAlign: "center" },
  error: { color: "#DC2626", flexShrink: 1 }, retry: { minHeight: 44, padding: 12, alignItems: "center" },
});
