import type { ToastNotification } from "@/features/shared/components/NotificationToast";

type Translator = (key: string) => string;

export function localizeClientNotification(
  notification: ToastNotification,
  t?: Translator,
): ToastNotification {
  if (!t) return notification;

  const orderId = notification.relatedEntityId ?? notification.message.match(/#(\d+)/)?.[1] ?? "";
  const fillOrder = (message: string) => message.replace("{order}", String(orderId));

  if (notification.type === "OrderReady" || notification.type === "OrderInPreparation") {
    const isReady = notification.type === "OrderReady";
    const titleKey = isReady ? "notificationReadyTitle" : "notificationPrepTitle";
    const messageKey = isReady ? "notificationReadyMessage" : "notificationPrepMessage";
    const title = t(titleKey);
    const message = t(messageKey);
    if (title !== titleKey && message !== messageKey) {
      return { ...notification, title, message: fillOrder(message) };
    }
  }

  if (notification.type === "PaymentConfirmed") {
    return { ...notification, title: t("notificationPaymentTitle"), message: fillOrder(t("notificationPaymentMessage")) };
  }

  if (notification.type === "OrderStatusChanged") {
    const delivered = /entregad|entregue|delivered|livr[ée]/i.test(`${notification.title} ${notification.message}`);
    return {
      ...notification,
      title: t(delivered ? "notificationDeliveredTitle" : "notificationOnWayTitle"),
      message: fillOrder(t(delivered ? "notificationDeliveredMessage" : "notificationOnWayMessage")),
    };
  }

  return notification;
}
