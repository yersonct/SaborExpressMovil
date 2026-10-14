export { notificationService } from "./services/notificationService";
export {
  registerWaiterPushDevice,
  registerCashierPushDevice,
  registerDeliveryPushDevice,
  unregisterPushDevice,
  unregisterWaiterPushDevice,
} from "./services/pushDeviceService";
export type {
  PushDeviceSettings,
  WaiterPushDeviceSettings,
  CashierPushDeviceSettings,
} from "./services/pushDeviceService";
export { normalizeNotificationType } from "./utils/notificationType";
export { localizeClientNotification } from "./utils/localizeClientNotification";
export * from "./types/notification.types";
