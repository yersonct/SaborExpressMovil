import { translateMobileCopy } from "@/locales/mobileCopy";
import { useState, useRef, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { useCompleteProfile } from "@/features/customers/hooks/useCompleteProfile";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { styles as baseStyles } from "./style/ClientStyles";
import { useClientPreferences, useClientThemedStyles } from "@/features/userPreferences/context/ClientPreferencesContext";
import { useCatalog } from "@/features/catalog/hooks/useCatalog";
import { useNearestBranch } from "@/features/branches/hooks/useNearestBranch";
import type { PublicBranch } from "@/features/branches/types/branch.types";
import { usePublicBranches } from "@/features/branches/hooks/usePublicBranches";
import { branchHoursLabel, branchIsUnavailable } from "@/features/branches/utils/branchAvailability";
import { showAppAlert } from "@/features/shared/services/alertEvents";
import { useBranchSettings } from "@/features/branches/hooks/useBranchSettings";
import { getRadiusMessages } from "@/features/orders/utils/orderBreakdown";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getCustomerIdFromToken } from "@/features/auth/services/decodeToken";
import { useAddresses } from "@/features/addresses/hooks/useAddresses";
import { useCart } from "@/features/cart/hooks/useCart";
import { useActiveClientOrder } from "@/features/orders/hooks/useActiveClientOrder";
import { deferEffect } from "@/features/shared/utils/deferEffect";

export function useClientDeliveryLocation() {

    const styles = useClientThemedStyles(baseStyles);

    const { colors, t, isDark, language } = useClientPreferences();

    const router = useRouter();

    const { activeOrder, refetch: refetchActiveOrder } = useActiveClientOrder();

    const { customer } = useCompleteProfile();

    const customerDisplayName = [customer?.name, customer?.lastName]
      .map((part) =>
        part
          ?.trim()
          .split(/\s+/)
          .filter(Boolean)
          .map(
            (word) =>
              `${word.charAt(0).toLocaleUpperCase(language)}${word.slice(1).toLocaleLowerCase(language)}`,
          )
          .join(" "),
      )
      .filter(Boolean)
      .join(" ");

    const { user } = useAuth();

    const customerId = user?.token ? getCustomerIdFromToken(user.token) : null;

    const {
      addresses,
      loading: loadingAddresses,
      createAddress,
      setDefaultAddress,
    } = useAddresses(customerId);

    const { cart, addItem, removeItem, clearCart } = useCart();

    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
      null,
    );

    const [showAddressPicker, setShowAddressPicker] = useState(false);

    const [showAllAddresses, setShowAllAddresses] = useState(false);


    const [showBranchesMap, setShowBranchesMap] = useState(false);

    const [showLocationPicker, setShowLocationPicker] = useState(false);

    const [savingMapLocation, setSavingMapLocation] = useState(false);

    const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);

    const [trackingOrderId, setTrackingOrderId] = useState<number | null>(null);

    const [manualBranch, setManualBranch] = useState<PublicBranch | null>(null);

    // La sede se calcula normalmente a partir de la dirección guardada
    // seleccionada, pero el cliente puede pedir usar su GPS en vivo en
    // su lugar (útil si está en un sitio distinto al de la dirección).
    const selectedAddress =
      addresses.find((a) => a.id === selectedAddressId) ?? null;

    // Con muchas direcciones solo se muestran las primeras 3 (la predeterminada
    // va primero). Si la elegida está más abajo, se incluye para que se vea marcada.
    const ADDRESS_PREVIEW_COUNT = 3;

    const previewAddresses = addresses.slice(0, ADDRESS_PREVIEW_COUNT);

    const selectedIsHidden =
      selectedAddress != null &&
      !previewAddresses.some((a) => a.id === selectedAddress.id);

    const visibleAddresses = showAllAddresses
      ? addresses
      : selectedIsHidden
        ? [
            ...previewAddresses.slice(0, ADDRESS_PREVIEW_COUNT - 1),
            selectedAddress!,
          ]
        : previewAddresses;

    const hiddenCount = addresses.length - visibleAddresses.length;


    const [liveLocation, setLiveLocation] = useState<{
      latitude: number;
      longitude: number;
    } | null>(null);

    const [locatingGps, setLocatingGps] = useState(false);


    useEffect(() => deferEffect(() => {
      if (loadingAddresses) return;
      if (
        selectedAddressId &&
        addresses.some((a) => a.id === selectedAddressId)
      )
        return;
      if (addresses.length > 0) {
        setSelectedAddressId(addresses[0].id);
        // Si el cliente ya tiene una dirección real guardada, dejamos de usar
        // el GPS "de bienvenida" y volvemos al flujo normal por dirección.
        setLiveLocation(null);
      }
    }), [loadingAddresses, addresses, selectedAddressId]);


    const coordsForBranch = liveLocation ?? selectedAddress ?? null;


    const {
      branch: nearestBranch,
      loading: loadingBranch,
      error: branchError,
    } = useNearestBranch(coordsForBranch?.latitude, coordsForBranch?.longitude);

    const selectedDeliveryBranch = manualBranch ?? nearestBranch;

    const { branches: publicBranches } = usePublicBranches();

    const deliveryBranch = publicBranches.find(b => b.id === selectedDeliveryBranch?.id)
      ?? selectedDeliveryBranch;

    const branchUnavailable = branchIsUnavailable(deliveryBranch);

    const branchClosedMessage = deliveryBranch
      ? (deliveryBranch.unavailableReason || branchHoursLabel(deliveryBranch, language))
      : translateMobileCopy("No se pudo verificar la sede.");

    const ensureBranchOpen = () => {
      if (!branchUnavailable) return true;
      showAppAlert(translateMobileCopy("Sede no disponible"), branchClosedMessage);
      return false;
    };


    const { settings: branchSettings, loading: loadingSettings } =
      useBranchSettings(deliveryBranch?.id);

    const radiusMsgs = getRadiusMessages(language);

    const {
      categories,
      products,
      loading: loadingCatalog,
    } = useCatalog(deliveryBranch?.id);


    // Incluye el instante entre "direcciones cargadas" y "dirección seleccionada",
    // donde las coordenadas aún son null y se vería un falso "sin sede".
    const resolvingLocation =
      loadingAddresses ||
      locatingGps ||
      (!manualBranch && loadingBranch) ||
      (addresses.length > 0 && !coordsForBranch);

    // Convierte unas coordenadas en dirección guardada y la deja seleccionada
    // como dirección de entrega del pedido.
    const saveLocationAsAddress = useCallback(async (
      coords: { latitude: number; longitude: number },
      isDefault: boolean,
      exactAddress?: string,
    ): Promise<boolean> => {
      try {
        if (!customerId) throw new Error(translateMobileCopy("No se identificó la cuenta del cliente."));
        let addressLine = exactAddress?.trim() || translateMobileCopy("Ubicación actual");
        if (!exactAddress?.trim()) {
          try {
            const [place] = await Location.reverseGeocodeAsync(coords);
            if (place) {
              const parts = [place.street, place.name, place.city].filter(Boolean);
              if (parts.length > 0) addressLine = parts.join(", ");
            }
          } catch {
            // El cliente puede editar luego una dirección aproximada.
          }
        }

        const created = await createAddress({
          addressLine,
          latitude: coords.latitude,
          longitude: coords.longitude,
          isDefault,
        });
        setManualBranch(null);
        setSelectedAddressId(created.id);
        setLiveLocation(null);
        return true;
      } catch (err: any) {
        Alert.alert(
          t("error"),
          err?.message ?? t("addressSaveError"),
        );
        return false;
      }
    }, [createAddress, customerId, t]);

    const handleUseCurrentLocationForBranch = useCallback(async () => {
      if (cart.length > 0) {
        Alert.alert(t("cartMustBeEmptyTitle"), t("cartMustBeEmptyForLocation"));
        return;
      }
      setLocatingGps(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setShowLocationPicker(true); // sin GPS, que la marque en el mapa
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const here = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setManualBranch(null);
        setLiveLocation(here);

        // Cliente sin direcciones: se guarda como su primera dirección.
        if (addresses.length === 0) {
          await saveLocationAsAddress(here, true);
        }
      } catch {
        Alert.alert(
          t("error"),
          t("locationError"),
        );
      } finally {
        setLocatingGps(false);
      }
    }, [addresses.length, cart.length, saveLocationAsAddress, t]);


    // Si el cliente elige explícitamente otra dirección guardada, volvemos
    // a calcular la sede a partir de esa dirección (se cancela el modo GPS).
    const handleSelectAddress = async (addressId: number) => {
      if (addressId === selectedAddressId) {
        setShowAddressPicker(false);
        return;
      }
      if (addressId !== selectedAddressId && cart.length > 0) {
        Alert.alert(t("cartMustBeEmptyTitle"), t("cartMustBeEmptyForLocation"));
        return;
      }


      // La última dirección elegida queda como predeterminada. El backend
      // rechaza marcar como predeterminada una que ya lo es, por eso se revisa.
      const chosen = addresses.find((a) => a.id === addressId);
      if (chosen && !chosen.isDefault) {
        try {
          await setDefaultAddress(addressId);
        } catch (error: any) {
          Alert.alert(t("error"), error?.message ?? t("addressSaveError"));
          return;
        }
      }
      setManualBranch(null);
      setLiveLocation(null);
      setSelectedAddressId(addressId);
      setShowAddressPicker(false);
    };


    // Cliente nuevo sin direcciones guardadas: pedimos el GPS automáticamente
    // una sola vez, así no ve el menú vacío mientras crea su primera dirección.
    const autoGpsRequested = useRef(false);

    useEffect(() => {
      if (loadingAddresses) return;
      if (addresses.length > 0) return;
      if (autoGpsRequested.current) return;

      autoGpsRequested.current = true;
      handleUseCurrentLocationForBranch();
    }, [loadingAddresses, addresses, handleUseCurrentLocationForBranch]);
return { styles, colors, t, isDark, language, router, activeOrder, refetchActiveOrder, customer, customerDisplayName, user, customerId, addresses, loadingAddresses, createAddress, setDefaultAddress, cart, addItem, removeItem, clearCart, selectedAddressId, setSelectedAddressId, showAddressPicker, setShowAddressPicker, showAllAddresses, setShowAllAddresses, showBranchesMap, setShowBranchesMap, showLocationPicker, setShowLocationPicker, savingMapLocation, setSavingMapLocation, showDeliveryOptions, setShowDeliveryOptions, trackingOrderId, setTrackingOrderId, manualBranch, setManualBranch, selectedAddress, ADDRESS_PREVIEW_COUNT, previewAddresses, selectedIsHidden, visibleAddresses, hiddenCount, liveLocation, setLiveLocation, locatingGps, setLocatingGps, coordsForBranch, nearestBranch, loadingBranch, branchError, selectedDeliveryBranch, publicBranches, deliveryBranch, branchUnavailable, branchClosedMessage, ensureBranchOpen, branchSettings, loadingSettings, radiusMsgs, categories, products, loadingCatalog, resolvingLocation, saveLocationAsAddress, handleUseCurrentLocationForBranch, handleSelectAddress, autoGpsRequested };
}
