import { useState, useEffect, useMemo } from "react";
import { Animated, Platform, Alert, LayoutAnimation } from "react-native";
import { useRememberedUiState } from "@/features/shared/hooks/useRememberedUiState";
import { localizeMobileCatalogText } from "@/locales/mobileCopy";
import { calcBreakdown, haversineKm } from "@/features/orders/utils/orderBreakdown";
import { SERVER_BASE_URL } from "@/features/catalog/services/catalogService";
import type { useClientDeliveryLocation } from "./useClientDeliveryLocation";
export function useClientCatalogCart(context: ReturnType<typeof useClientDeliveryLocation>) {
const { t, language, cart, addItem, removeItem, setShowBranchesMap, setShowLocationPicker, setShowDeliveryOptions, liveLocation, coordsForBranch, deliveryBranch, ensureBranchOpen, branchSettings, loadingSettings, radiusMsgs, categories, products } = context;

    // Estados Generales
    const [activeCategory, setActiveCategory] = useRememberedUiState<string>("client:category", "__all__");


    const handleOpenBranchPicker = () => {
      if (cart.length > 0) {
        Alert.alert(t("cartMustBeEmptyTitle"), t("cartMustBeEmptyForLocation"));
        return;
      }
      setShowBranchesMap(true);
    };

    const handleOpenLocationPicker = () => {
      if (cart.length > 0) {
        Alert.alert(t("cartMustBeEmptyTitle"), t("cartMustBeEmptyForLocation"));
        return;
      }
      setShowLocationPicker(true);
    };

    const handleOpenDeliveryOptions = () => {
      if (cart.length > 0) {
        Alert.alert(t("cartMustBeEmptyTitle"), t("cartMustBeEmptyForLocation"));
        return;
      }
      setShowDeliveryOptions(true);
    };

    const switchDeliveryOptionsTo = (openModal: () => void) => {
      setShowDeliveryOptions(false);
      setTimeout(openModal, 200);
    };


    // Modales
    const [cartModalVisible, setCartModalVisible] = useState(false);

    const [confirmItemModalVisible, setConfirmItemModalVisible] =
      useState(false);

    const [itemToConfirm, setItemToConfirm] = useState<any | null>(null);


    // Estados de flujo de pago
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState("");

    const [orderConfirmed, setOrderConfirmed] = useState(false);

        const [orderPaid, setOrderPaid] = useState(false);


    // Animaciones Toast
    const [toastAnim] = useState(() => new Animated.Value(-100));

    const [toastMessage, setToastMessage] = useState("");


    const localizeCategoryName = (name: string) => {
      const category = categories.find((item) => item.name === name);
      const product = products.find((item) => item.categoryName === name);
      return localizeMobileCatalogText(
        name,
        {
          en: category?.nameEn ?? product?.categoryNameEn,
          pt: category?.namePt ?? product?.categoryNamePt,
          fr: category?.nameFr ?? product?.categoryNameFr,
        },
        language,
      );
    };


    const categoryNames = useMemo(() => [
      "__all__",
      ...categories
        .map((c) => c.name)
        .filter((name) => products.some((p) => p.categoryName === name)),
    ], [categories, products]);


    useEffect(() => {
      if (products.length > 0 && categories.length > 0 && !categoryNames.includes(activeCategory)) setActiveCategory("__all__");
    }, [activeCategory, categories.length, categoryNames, products.length, setActiveCategory]);

    const filteredMenu = (
      activeCategory === "__all__"
        ? products
        : products.filter((p) => p.categoryName === activeCategory)
    ).map((p) => ({
      id: String(p.id),
      name: localizeMobileCatalogText(
        p.name,
        { en: p.nameEn, pt: p.namePt, fr: p.nameFr },
        language,
      ),
      category: localizeCategoryName(p.categoryName),
      price: p.price,
      desc: localizeMobileCatalogText(
        p.description,
        {
          en: p.descriptionEn,
          pt: p.descriptionPt,
          fr: p.descriptionFr,
        },
        language,
      ),
      image: p.photo ? `${SERVER_BASE_URL}${p.photo}` : null,
    }));

     const subtotalCart = cart.reduce((sum, item) => sum + item.price, 0);

    const breakdown = calcBreakdown(
      subtotalCart,
      branchSettings?.taxRate ?? 0,
      branchSettings?.deliveryFee ?? 0,
    );

    // El desglose calcula el Impoconsumo sobre productos; el domicilio se suma aparte.
    const totalCart = breakdown.total;


    // Distancia sede ↔ ubicación elegida, para avisar ANTES de pagar.
    // El backend vuelve a validar al crear el pedido.
    const distanceKm =
      coordsForBranch &&
      deliveryBranch?.latitude != null &&
      deliveryBranch?.longitude != null
        ? haversineKm(
            coordsForBranch.latitude,
            coordsForBranch.longitude,
            Number(deliveryBranch.latitude),
            Number(deliveryBranch.longitude),
          )
        : null;

    const outOfRadius =
      distanceKm != null &&
      !!branchSettings &&
      !branchSettings.isDefault &&
      distanceKm > branchSettings.deliveryRadiusKm;

    const radiusText =
      outOfRadius && branchSettings && deliveryBranch
        ? radiusMsgs.radiusBody(
            distanceKm!.toFixed(1),
            String(branchSettings.deliveryRadiusKm),
            deliveryBranch.name,
          )
        : "";

    const showToast = (message: string) => {
      setToastMessage(message);
      Animated.sequence([
        Animated.timing(toastAnim, {
          toValue: Platform.OS === "ios" ? 50 : 20,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(toastAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    };


    const handleItemPress = (item: any) => {
      setItemToConfirm(item);
      setConfirmItemModalVisible(true);
    };


    const confirmAddToCart = () => {
      if (itemToConfirm) {
        addItem(itemToConfirm);
        showToast(`🛒 ${itemToConfirm.name} ${t("added")}`);
        setConfirmItemModalVisible(false);
        setItemToConfirm(null);
      }
    };


    const removeFromCart = (cartId: string) => {
      removeItem(cartId);
      if (cart.length === 1) handleCloseCart();
    };


    const handleCloseCart = () => {
      setCartModalVisible(false);
      setIsCheckingOut(false);
      setIsUploadingReceipt(false);
      setPaymentMethod("");
    };


    const validateDeliveryCoverage = () => {
      if (!branchSettings || branchSettings.isDefault) {
        Alert.alert(radiusMsgs.notConfiguredTitle, radiusMsgs.notConfiguredBody);
        return false;
      }
      // La advertencia roja visible explica el motivo y también aparece dentro
      // del carrito; no se abre un segundo cuadro de alerta.
      if (outOfRadius) return false;
      if (liveLocation) {
        Alert.alert(
          t("saveLocationBeforeOrderTitle"),
          t("saveLocationBeforeOrderMessage"),
        );
        return false;
      }
      return true;
    };


    const proceedToCheckout = () => {
      if (cart.length === 0 || loadingSettings) return;
      if (!ensureBranchOpen() || !validateDeliveryCoverage()) return;
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsCheckingOut(true);
    };


    const handlePaymentNextStep = () => {
      if (!ensureBranchOpen() || !validateDeliveryCoverage()) return;
      if (!paymentMethod)
        return Alert.alert(
          t("selectPaymentTitle"),
          t("selectPaymentMessage"),
        );

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsCheckingOut(false);
      setIsUploadingReceipt(true);
    };
return { activeCategory, setActiveCategory, handleOpenBranchPicker, handleOpenLocationPicker, handleOpenDeliveryOptions, switchDeliveryOptionsTo, cartModalVisible, setCartModalVisible, confirmItemModalVisible, setConfirmItemModalVisible, itemToConfirm, setItemToConfirm, isCheckingOut, setIsCheckingOut, isUploadingReceipt, setIsUploadingReceipt, paymentMethod, setPaymentMethod, orderConfirmed, setOrderConfirmed, orderPaid, setOrderPaid, toastAnim, toastMessage, setToastMessage, localizeCategoryName, categoryNames, filteredMenu, subtotalCart, breakdown, totalCart, distanceKm, outOfRadius, radiusText, showToast, handleItemPress, confirmAddToCart, removeFromCart, handleCloseCart, validateDeliveryCoverage, proceedToCheckout, handlePaymentNextStep };
}
