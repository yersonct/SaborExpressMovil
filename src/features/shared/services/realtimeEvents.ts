export const BRANCH_OPERATIONAL_SETTINGS_CHANGED =
  "BranchOperationalSettingsChanged";
export const PRODUCTS_CHANGED = "ProductsChanged";
export const ORDERS_CHANGED = "OrdersChanged";
export const TABLES_CHANGED = "TablesChanged";
export const DELIVERIES_CHANGED = "DeliveriesChanged";
export const PAYMENTS_CHANGED = "PaymentsChanged";
export const REVIEWS_CHANGED = "ReviewsChanged";
export const ADMIN_DATA_CHANGED = "AdminDataChanged";
export const PUBLIC_BRANCHES_CHANGED = "PublicBranchesChanged";
export const EMPLOYEE_SCHEDULES_CHANGED = "EmployeeSchedulesChanged";
export const RECEIVE_NOTIFICATION = "ReceiveNotification";
export const NOTIFICATIONS_CHANGED = "NotificationsChanged";
export const DELIVERY_LOCATION_UPDATED = "DeliveryLocationUpdated";
export const REALTIME_CONNECTED = "RealtimeConnected";

export const REALTIME_HUB_EVENTS = [
  RECEIVE_NOTIFICATION,
  NOTIFICATIONS_CHANGED,
  DELIVERY_LOCATION_UPDATED,
  ORDERS_CHANGED,
  TABLES_CHANGED,
  DELIVERIES_CHANGED,
  PAYMENTS_CHANGED,
  PRODUCTS_CHANGED,
  REVIEWS_CHANGED,
  BRANCH_OPERATIONAL_SETTINGS_CHANGED,
  ADMIN_DATA_CHANGED,
  EMPLOYEE_SCHEDULES_CHANGED,
  PUBLIC_BRANCHES_CHANGED,
] as const;

type RealtimeListener = (...args: unknown[]) => void;

const listenersByEvent = new Map<string, Set<RealtimeListener>>();
let realtimeConnected = false;
type RealtimeInvoker = (method: string, ...args: unknown[]) => Promise<unknown>;
let realtimeInvoker: RealtimeInvoker | null = null;

export function setRealtimeConnectionState(connected: boolean) {
  realtimeConnected = connected;
}

export function registerRealtimeInvoker(invoker: RealtimeInvoker) {
  realtimeInvoker = invoker;
  return () => {
    if (realtimeInvoker === invoker) realtimeInvoker = null;
  };
}

export async function invokeRealtimeMethod(
  method: string,
  ...args: unknown[]
): Promise<boolean> {
  if (!realtimeInvoker) return false;
  try {
    await realtimeInvoker(method, ...args);
    return true;
  } catch {
    return false;
  }
}

export function subscribeRealtimeEvent(
  eventName: string,
  listener: RealtimeListener,
) {
  let listeners = listenersByEvent.get(eventName);
  if (!listeners) {
    listeners = new Set<RealtimeListener>();
    listenersByEvent.set(eventName, listeners);
  }
  listeners.add(listener);
  if (eventName === REALTIME_CONNECTED && realtimeConnected) {
    try {
      listener();
    } catch {
      // Un consumidor con errores no debe interrumpir el registro de otros.
    }
  }

  return () => {
    listeners?.delete(listener);
    if (listeners?.size === 0) listenersByEvent.delete(eventName);
  };
}

export function emitRealtimeEvent(eventName: string, ...args: unknown[]) {
  for (const listener of [...(listenersByEvent.get(eventName) ?? [])]) {
    try {
      listener(...args);
    } catch {
      // Un consumidor con errores no debe interrumpir a los demás.
    }
  }
}
