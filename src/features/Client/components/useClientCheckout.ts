import { useState, useRef } from "react";
import { Alert, LayoutAnimation, Linking } from "react-native";
import { PaymentStatus } from "@/features/payments/types/payment.types";
import { useWompiPolling } from "@/features/payments/hooks/useWompiPolling";
import { buildWompiCheckoutUrl } from "@/features/payments/utils/wompiUrl";
import { orderService } from "@/features/orders/services/orderService";
import { paymentService } from "@/features/payments/services/paymentService";
import { OrderType } from "@/features/orders/types/order.types";
import { useNotificationListener } from "@/features/notifications/context/UserNotificationsContext";
import type { useClientDeliveryLocation } from "./useClientDeliveryLocation";
import type { useClientCatalogCart } from "./useClientCatalogCart";
export function useClientCheckout(context: ReturnType<typeof useClientDeliveryLocation> & ReturnType<typeof useClientCatalogCart>) {
const { t, refetchActiveOrder, customerId, cart, clearCart, selectedAddressId, deliveryBranch, ensureBranchOpen, setIsUploadingReceipt, paymentMethod, setOrderConfirmed, setOrderPaid, totalCart, handleCloseCart, validateDeliveryCoverage } = context;



    const [submitting, setSubmitting] = useState(false);

    const orderSubmitLockRef = useRef(false);

    const { polling, startPolling, stopPolling } = useWompiPolling();

    // Pedido/pago Wompi en curso, para poder cancelarlo si no se paga
    const wompiInFlightRef = useRef<{
      orderId: number;
      paymentId: number;
    } | null>(null);


    const finishOrderSuccess = (paid: boolean = false) => {
      wompiInFlightRef.current = null;
      setOrderPaid(paid);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      setOrderConfirmed(true);
      setIsUploadingReceipt(false);

      setTimeout(() => {
        setOrderConfirmed(false);
        handleCloseCart();
        clearCart();
      }, 4000);
    };


    // Cancela el pedido que quedó sin pagar. Antes revisa con Wompi si el
    // pago alcanzó a aprobarse; en ese caso lo da por bueno y NO cancela.
    // Devuelve true si el pedido terminó pagado.
    const abandonUnpaidWompiOrder = async (reason: string): Promise<boolean> => {
      const inFlight = wompiInFlightRef.current;
      if (!inFlight) return false;

      try {
        const payment = await paymentService.syncWompi(inFlight.paymentId);
        if (payment.status === PaymentStatus.Completed) {
          finishOrderSuccess(true);
          return true;
        }
      } catch (error) {
        refetchActiveOrder();
        throw error;
      }

      try {
        await orderService.cancelMine(inFlight.orderId, reason);
      } catch (error) {
        refetchActiveOrder();
        throw error;
      }
      wompiInFlightRef.current = null;
      refetchActiveOrder();
      return false;
    };


    // Botón "Cancelar espera" del modal
    const handleStopWaiting = async () => {
      stopPolling();
      try {
        const paid = await abandonUnpaidWompiOrder(
          "Cancelado por el cliente: no completó el pago",
        );
        if (!paid) Alert.alert(t("orderCancelledTitle"), t("orderCancelledMessage"));
      } catch (error: any) {
        Alert.alert(t("error"), error?.message ?? t("paymentUnconfirmedMessage"));
      }
    };

    useNotificationListener((n) => {
      const inFlight = wompiInFlightRef.current;
      if (
        n.type === "PaymentConfirmed" &&
        inFlight &&
        n.relatedEntityId === inFlight.orderId
      ) {
        stopPolling();
        finishOrderSuccess(true);
      }
    });

    const submitFinalOrder = async () => {
      if (orderSubmitLockRef.current || submitting || polling) return;
      if (!ensureBranchOpen() || !validateDeliveryCoverage()) return;
      if (!selectedAddressId) {
        Alert.alert(
          t("selectAddressTitle"),
          t("selectAddressMessage"),
        );
        return;
      }
      if (paymentMethod !== "efectivo" && paymentMethod !== "wompi") return;

      orderSubmitLockRef.current = true;
      setSubmitting(true);
      let createdOrderId: number | null = null;
      let handedOff = false; // true cuando el flujo ya no depende de este try
      try {
        const order = await orderService.create({
          customerId,
          addressId: selectedAddressId,
          branchId: deliveryBranch?.id,
          tableId: null,
          orderType: OrderType.Delivery,
          notes: null,
        });
        createdOrderId = order.id;

        await orderService.addDetails(
          order.id,
          cart.map((item: any) => ({
            productId: Number(item.id),
            quantity: 1,
            notes: null,
          })),
        );


        if (paymentMethod === "wompi") {
          // El backend calcula el monto real desde el pedido; este valor se ignora
          const widget = await paymentService.initWompi({
            orderId: order.id,
            amount: totalCart,
          });

          wompiInFlightRef.current = {
            orderId: order.id,
            paymentId: widget.paymentId,
          };

          startPolling(
            widget.paymentId,
            async (finalStatus) => {
              if (finalStatus === PaymentStatus.Completed) {
                if (wompiInFlightRef.current) finishOrderSuccess(true);
              } else {
                // Rechazado: se cancela para que no quede nada colgado
                try {
                  await abandonUnpaidWompiOrder(
                    "Cancelado automáticamente: el pago fue rechazado",
                  );
                } catch (error: any) {
                  Alert.alert(t("error"), error?.message ?? t("paymentUnconfirmedMessage"));
                  return;
                }
                Alert.alert(
                  t("paymentRejectedTitle"),
                  t("paymentRejectedMessage"),
                );
              }
            },
            () => {
              // Tiempo agotado: NO se cancela (Nequi puede aprobar tarde).
              // El cajero no lo verá hasta que el pago quede Completed.
              Alert.alert(
                t("paymentUnconfirmedTitle"),
                t("paymentUnconfirmedMessage"),
              );
            },
          );
          handedOff = true;

          await Linking.openURL(
            buildWompiCheckoutUrl(widget, "https://wompi.co/"),
          );
          return;
        }

        // Confirmar en pantalla solo después de la confirmación del servidor.
        await orderService.confirmCash(order.id);
        handedOff = true;
        finishOrderSuccess();
      } catch (err: any) {
        // Si algo falló antes de entregar el flujo (crear detalles o iniciar
        // Wompi), se cancela para no dejar un pedido que el cajero pueda ver.
        if (createdOrderId && !handedOff) {
          try {
            await orderService.cancelMine(
              createdOrderId,
              "Cancelado automáticamente: no se pudo completar el pedido",
            );
          } catch (cancelError: any) {
            refetchActiveOrder();
            Alert.alert(t("error"), [err?.message ?? t("createOrderError"), cancelError?.message ?? t("paymentUnconfirmedMessage")].join("\n\n"));
            return;
          }
        }
        Alert.alert(
          t("error"),
          err?.message ?? t("createOrderError"),
        );
      } finally {
        orderSubmitLockRef.current = false;
        setSubmitting(false);
      }
    };
return { submitting, setSubmitting, orderSubmitLockRef, polling, startPolling, stopPolling, wompiInFlightRef, finishOrderSuccess, abandonUnpaidWompiOrder, handleStopWaiting, submitFinalOrder };
}
