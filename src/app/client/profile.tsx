import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getCustomerIdFromToken } from "@/features/auth/services/decodeToken";
import { useAddresses } from "@/features/addresses/hooks/useAddresses";
import { DrawerActions } from "expo-router/react-navigation";
import { useCompleteProfile } from "@/features/customers/hooks/useCompleteProfile";
import { useActiveClientOrder } from "@/features/orders/hooks/useActiveClientOrder";
import { useClientOrders } from "@/features/orders/hooks/useClientOrders";
import { InitialsAvatar } from "@/features/shared/components/InitialsAvatar";
import {
  ACTIVE_ORDER_STATUSES,
  OrderStatus,
  OrderType,
} from "@/features/orders/types/order.types";
import type { OrderSummary } from "@/features/orders/types/order.types";
import type { Delivery } from "@/features/delivery/types/delivery.types";
import { deliveryService } from "@/features/delivery/services/deliveryService";
import { OrderTrackingModal } from "@/features/orders/components/OrderTrackingModal";
import RateDriverModal from "@/features/delivery/components/RateDriverModal";

const STATUS_UI: Record<
  OrderStatus,
  { label: string; bg: string; fg: string }
> = {
  [OrderStatus.Pending]: { label: "Pendiente", bg: "#FEF3C7", fg: "#92400E" },
  [OrderStatus.Confirmed]: {
    label: "Confirmado",
    bg: "#DBEAFE",
    fg: "#1D4ED8",
  },
  [OrderStatus.InPreparation]: {
    label: "Preparando",
    bg: "#FFEDD5",
    fg: "#C2410C",
  },
  [OrderStatus.Ready]: { label: "Listo", bg: "#D1FAE5", fg: "#047857" },
  [OrderStatus.Delivered]: {
    label: "Entregado",
    bg: "#ECFDF5",
    fg: "#059669",
  },
  [OrderStatus.Cancelled]: {
    label: "Cancelado",
    bg: "#FEE2E2",
    fg: "#B91C1C",
  },
};

function formatOrderDate(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${day}, ${time}`;
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText?: (t: string) => void;
  editable?: boolean;
  locked?: boolean;
  error?: string;
  keyboardType?: "default" | "phone-pad";
  placeholder?: string;
};

function Field({
  label,
  value,
  onChangeText,
  editable = false,
  locked = false,
  error,
  keyboardType = "default",
  placeholder,
}: FieldProps) {
  const disabled = locked || !editable;
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          disabled && styles.inputDisabled,
          !!error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function Stat({
  icon,
  color,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: number;
  label: string;
}) {
  return (
    <View style={styles.statColumn}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ClientProfile() {
  const router = useRouter();
  const { customer, loading, completeProfile } = useCompleteProfile();
  const { activeOrder } = useActiveClientOrder();
  const { orders, loading: loadingOrders } = useClientOrders();
  const { user } = useAuth();
  const customerId = user?.token ? getCustomerIdFromToken(user.token) : null;
  const { addresses, refetch: refetchAddresses } = useAddresses(customerId);
  const defaultAddress = addresses.find((a) => a.isDefault) ?? null;

  // Las pestañas mantienen la pantalla abierta: se recarga cada vez que se
  // vuelve a ella, para ver la dirección que se eligió en el menú principal.
  useFocusEffect(
    useCallback(() => {
      refetchAddresses();
    }, [refetchAddresses]),
  );
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<OrderSummary | null>(null);
  const [rateTarget, setRateTarget] = useState<Delivery | null>(null);
  const [trackingRefresh, setTrackingRefresh] = useState(0);
  const askedRatingFor = useRef<number | null>(null);

  // Al terminar un domicilio (últimas 24 h) sin calificar, pide la calificación una sola vez.
  useEffect(() => {
    const last = orders.find(
      (o) =>
        o.orderType === OrderType.Delivery &&
        o.status === OrderStatus.Delivered &&
        Date.now() - new Date(o.createdAt).getTime() < 24 * 3600 * 1000,
    );
    if (!last || askedRatingFor.current === last.id) return;
    askedRatingFor.current = last.id;
    deliveryService
      .getByOrder(last.id)
      .then((list) => {
        const d = list[0];
        if (d && d.customerRating == null) setRateTarget(d);
      })
      .catch(() => {});
  }, [orders]);

  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    phone: "",
  });
  const [errors, setErrors] = useState({ name: "", phone: "" });

  const fillForm = () => {
    if (!customer) return;
    setFormData({
      name: customer.name ?? "",
      lastName: customer.lastName ?? "",
      phone: customer.phone ?? "",
    });
    setErrors({ name: "", phone: "" });
  };

  // Sincroniza el formulario cuando llegan los datos reales del backend
  useEffect(() => {
    fillForm();
  }, [customer]);

  const setField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field in errors) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const cancelEditing = () => {
    fillForm();
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    const newErrors = { name: "", phone: "" };
    const name = formData.name.trim();
    const phone = formData.phone.replace(/\s/g, "");

    if (!name) newErrors.name = "El nombre no puede estar vacío.";
    else if (name.length < 3)
      newErrors.name = "El nombre debe tener mínimo 3 caracteres.";
    else if (/\d/.test(name))
      newErrors.name = "El nombre no puede contener números.";

    // Mismo formato que valida el backend: 7 dígitos (fijo) o 10 (celular).
    if (!phone) newErrors.phone = "El teléfono es obligatorio.";
    else if (!/^\d{7}(\d{3})?$/.test(phone))
      newErrors.phone = "Debe tener 7 o 10 dígitos, sin espacios ni guiones.";

    setErrors(newErrors);
    if (newErrors.name || newErrors.phone) return;

    // La dirección registrada es la predeterminada. Se envía siempre, porque
    // si no, el backend la deja en null. Debe medir entre 5 y 150 caracteres.
    const rawAddress = (defaultAddress?.addressLine ?? customer?.address ?? "")
      .trim()
      .slice(0, 150);
    const addressToSend = rawAddress.length >= 5 ? rawAddress : undefined;

    setSaving(true);
    try {
      await completeProfile({
        name,
        lastName: formData.lastName.trim() || undefined,
        phone,
        address: addressToSend,
      });
      setIsEditing(false);
      Alert.alert(
        "✅ ¡Guardado!",
        "Tu información personal se ha actualizado exitosamente.",
      );
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.message ?? "No se pudo guardar tu información. Intenta de nuevo.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCallDriver = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert("Error", "No se pudo abrir el marcador del teléfono."),
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#E61C24" />
      </SafeAreaView>
    );
  }

  const inProgressCount = orders.filter((o) =>
    ACTIVE_ORDER_STATUSES.includes(o.status),
  ).length;
  const deliveredCount = orders.filter(
    (o) => o.status === OrderStatus.Delivered,
  ).length;
  const recentOrders = orders.slice(0, showAllOrders ? 10 : 3);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== MIS PEDIDOS ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis pedidos</Text>

          <View style={[styles.card, styles.statsRow]}>
            <Stat
              icon="time-outline"
              color="#F59E0B"
              value={inProgressCount}
              label="En curso"
            />
            <View style={styles.statDivider} />
            <Stat
              icon="checkmark-circle-outline"
              color="#10B981"
              value={deliveredCount}
              label="Entregados"
            />
            <View style={styles.statDivider} />
            <Stat
              icon="receipt-outline"
              color="#3B82F6"
              value={orders.length}
              label="Total"
            />
          </View>

          {/* Seguimiento del pedido en curso */}
          {activeOrder && (
            <View style={[styles.card, { marginTop: 14 }]}>
              <View style={styles.trackingHeader}>
                <Text style={styles.trackingTitle}>
                  Pedido #{activeOrder.order.id} en curso
                </Text>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>EN VIVO</Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.stepActive}>
                  <Ionicons name="restaurant" size={16} color="#FFF" />
                </View>
                <View
                  style={
                    activeOrder.step >= 2
                      ? styles.lineActive
                      : styles.lineInactive
                  }
                />
                <View
                  style={
                    activeOrder.step >= 2
                      ? styles.stepActive
                      : styles.stepInactive
                  }
                >
                  <Ionicons
                    name="bicycle"
                    size={16}
                    color={activeOrder.step >= 2 ? "#FFF" : "#94A3B8"}
                  />
                </View>
                <View
                  style={
                    activeOrder.step >= 3
                      ? styles.lineActive
                      : styles.lineInactive
                  }
                />
                <View
                  style={
                    activeOrder.step >= 3
                      ? styles.stepActive
                      : styles.stepInactive
                  }
                >
                  <Ionicons
                    name="home"
                    size={16}
                    color={activeOrder.step >= 3 ? "#FFF" : "#94A3B8"}
                  />
                </View>
              </View>

              <View style={styles.progressLabels}>
                <Text style={styles.labelActive}>Preparando</Text>
                <Text
                  style={
                    activeOrder.step >= 2
                      ? styles.labelActive
                      : styles.labelInactive
                  }
                >
                  En camino
                </Text>
                <Text
                  style={
                    activeOrder.step >= 3
                      ? styles.labelActive
                      : styles.labelInactive
                  }
                >
                  Entregado
                </Text>
              </View>

              {/* Repartidor: solo si ya hay uno asignado */}
              {activeOrder.delivery && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.driverInfo}>
                    <View style={styles.driverAvatar}>
                      <Text style={{ fontSize: 24 }}>🛵</Text>
                    </View>
                    <View style={styles.driverDetails}>
                      <Text style={styles.driverName}>
                        {activeOrder.delivery.deliveryPersonName ??
                          "Repartidor asignado"}
                      </Text>
                      <Text style={styles.driverPhoneLabel}>
                        Contacto:{" "}
                        <Text style={styles.driverPhone}>
                          {activeOrder.delivery.deliveryPersonPhone ??
                            "No disponible"}
                        </Text>
                      </Text>
                    </View>
                    {activeOrder.delivery.deliveryPersonPhone && (
                      <TouchableOpacity
                        style={styles.callButton}
                        onPress={() =>
                          handleCallDriver(
                            activeOrder.delivery!.deliveryPersonPhone!,
                          )
                        }
                      >
                        <Ionicons name="call" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </View>
          )}

          {/* Últimos pedidos */}
          <Text style={[styles.subTitle, { marginTop: 18 }]}>
            Últimos pedidos
          </Text>
          {loadingOrders ? (
            <ActivityIndicator style={{ marginTop: 12 }} color="#E61C24" />
          ) : orders.length === 0 ? (
            <View style={[styles.card, styles.emptyOrders]}>
              <Ionicons name="bag-outline" size={32} color="#CBD5E1" />
              <Text style={styles.emptyOrdersText}>
                Aún no has hecho pedidos.
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              {recentOrders.map((o, index) => {
                const ui = STATUS_UI[o.status];
                const isActive = ACTIVE_ORDER_STATUSES.includes(o.status);
                const itemsCount = o.orderDetails.reduce(
                  (sum, d) => sum + d.quantity,
                  0,
                );
                return (
                  <TouchableOpacity
                    key={o.id}
                    activeOpacity={0.7}
                    onPress={() => setTrackingOrder(o)}
                    style={[
                      styles.orderRow,
                      index > 0 && styles.orderRowBorder,
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderTitle}>Pedido #{o.id}</Text>
                      <Text style={styles.orderMeta}>
                        {formatOrderDate(o.createdAt)} · {itemsCount} producto
                        {itemsCount === 1 ? "" : "s"}
                      </Text>
                      {isActive && o.assignedDeliveryPersonName ? (
                        <Text style={styles.orderDriver}>
                          🛵 {o.assignedDeliveryPersonName}
                        </Text>
                      ) : null}
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.orderTotal}>
                        ${o.total.toLocaleString("es-CO")}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: ui.bg }]}>
                        <Text style={[styles.badgeText, { color: ui.fg }]}>
                          {ui.label}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {orders.length > 3 && (
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => setShowAllOrders((v) => !v)}
                >
                  <Text style={styles.moreButtonText}>
                    {showAllOrders ? "Ver menos" : "Ver más pedidos"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* ===== MIS DATOS ===== */}
        <View style={styles.section}>
          <View style={styles.dataHeaderRow}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
              Mis datos
            </Text>
            <TouchableOpacity
              onPress={() =>
                isEditing ? cancelEditing() : setIsEditing(true)
              }
              disabled={saving}
            >
              <Text style={styles.editLinkText}>
                {isEditing ? "Cancelar" : "Editar"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.avatarContainer}>
              <InitialsAvatar
                name={customer?.name}
                lastName={customer?.lastName}
                size={80}
              />
            </View>

            <Field
              label="Nombre"
              value={formData.name}
              onChangeText={(t) => setField("name", t)}
              editable={isEditing}
              error={errors.name}
            />
            <Field
              label="Apellido"
              value={formData.lastName}
              onChangeText={(t) => setField("lastName", t)}
              editable={isEditing}
            />
            <Field
              label="Documento"
              value={customer?.document ?? "No registrado"}
              locked
            />
            <Field
              label="Correo electrónico"
              value={customer?.email ?? "No disponible"}
              locked
            />
            <Field
              label="Teléfono móvil"
              value={formData.phone}
              onChangeText={(t) => setField("phone", t)}
              editable={isEditing}
              keyboardType="phone-pad"
              error={errors.phone}
            />
            <Field
              label="Dirección predeterminada"
              value={defaultAddress?.addressLine ?? customer?.address ?? ""}
              locked
              placeholder="Sin dirección registrada"
            />

            {/* Guardar: solo aparece mientras se edita */}
            {isEditing && (
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                  <Text style={styles.saveBtnText}>
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Direcciones de entrega: se gestionan aparte */}
            <TouchableOpacity
              style={styles.addressLinkRow}
              onPress={() => router.push("/client/addresses")}
            >
              <Ionicons name="location-outline" size={22} color="#E61C24" />
              <Text style={styles.addressLinkText}>
                Gestionar mis direcciones de entrega
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <OrderTrackingModal
        visible={!!trackingOrder}
        order={trackingOrder}
        refreshKey={trackingRefresh}
        onClose={() => setTrackingOrder(null)}
        onRate={(d) => setRateTarget(d)}
      />

      <RateDriverModal
        visible={!!rateTarget}
        deliveryId={rateTarget?.id ?? null}
        driverName={rateTarget?.deliveryPersonName}
        onClose={() => setRateTarget(null)}
        onSubmitted={() => setTrackingRefresh((k) => k + 1)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  menuButton: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#1E293B" },

  container: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 12,
  },
  subTitle: { fontSize: 14, fontWeight: "bold", color: "#64748B" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  // Resumen
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
  },
  statColumn: { alignItems: "center", flex: 1 },
  statValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1E293B",
    marginTop: 6,
  },
  statLabel: { fontSize: 12, color: "#64748B", marginTop: 2 },
  statDivider: { width: 1, height: 44, backgroundColor: "#F1F5F9" },

  // Seguimiento
  trackingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  trackingTitle: { fontSize: 15, fontWeight: "bold", color: "#1E293B" },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E61C24",
    marginRight: 6,
  },
  liveText: {
    color: "#E61C24",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  stepActive: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  stepInactive: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  lineActive: {
    flex: 1,
    height: 4,
    backgroundColor: "#10B981",
    marginHorizontal: -5,
    zIndex: 1,
  },
  lineInactive: {
    flex: 1,
    height: 4,
    backgroundColor: "#F1F5F9",
    marginHorizontal: -5,
    zIndex: 1,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  labelActive: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#10B981",
    textAlign: "center",
    flex: 1,
  },
  labelInactive: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#94A3B8",
    textAlign: "center",
    flex: 1,
  },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 18 },
  driverInfo: { flexDirection: "row", alignItems: "center" },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  driverDetails: { flex: 1, marginLeft: 15 },
  driverName: { fontSize: 16, fontWeight: "bold", color: "#1E293B" },
  driverPhoneLabel: { fontSize: 13, color: "#334155", marginTop: 4 },
  driverPhone: { fontWeight: "bold", color: "#3B82F6" },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E61C24",
    justifyContent: "center",
    alignItems: "center",
  },

  // Últimos pedidos
  emptyOrders: { alignItems: "center", marginTop: 10, paddingVertical: 24 },
  emptyOrdersText: { color: "#94A3B8", marginTop: 8, fontSize: 14 },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  orderRowBorder: { borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  orderTitle: { fontSize: 15, fontWeight: "bold", color: "#1E293B" },
  orderMeta: { fontSize: 12, color: "#64748B", marginTop: 2 },
  orderDriver: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "600",
    marginTop: 3,
  },
  orderTotal: { fontSize: 15, fontWeight: "bold", color: "#1E293B" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  badgeText: { fontSize: 11, fontWeight: "bold" },
  moreButton: { alignItems: "center", paddingTop: 12 },
  moreButtonText: { color: "#3B82F6", fontWeight: "bold", fontSize: 13 },

  // Mis datos
  avatarContainer: { alignItems: "center", marginBottom: 20 },
  dataHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  editLinkText: { color: "#3B82F6", fontWeight: "bold", fontSize: 16 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
  },
  inputGroup: { marginBottom: 15 },
  inputLabel: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 6,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1E293B",
  },
  inputDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    color: "#64748B",
  },
  inputError: { borderColor: "#EF4444", borderWidth: 1.5 },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 4,
    fontWeight: "500",
  },

  // Botones compactos
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginBottom: 16,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  editBtnText: { color: "#3B82F6", fontWeight: "bold", fontSize: 14 },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  cancelBtnText: { color: "#64748B", fontWeight: "bold", fontSize: 14 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#10B981",
  },
  saveBtnText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 14 },

  addressLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 14,
    gap: 10,
  },
  addressLinkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
});
