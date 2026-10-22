import type { AuthResponse } from "../types";

export type SessionEndReason =
  | "expired"
  | "role_revoked"
  | "server_down"
  | "shift_changed"
  | "another_device";

type SessionExpiredHandler = (reason: SessionEndReason) => void;
type SessionUpdatedHandler = (session: AuthResponse) => void;

let handler: SessionExpiredHandler | null = null;
let updatedHandler: SessionUpdatedHandler | null = null;

export function setSessionExpiredHandler(fn: SessionExpiredHandler) {
  handler = fn;
}

export function notifySessionExpired(reason: SessionEndReason = "expired") {
  if (handler) handler(reason);
}

export function setSessionUpdatedHandler(fn: SessionUpdatedHandler | null) {
  updatedHandler = fn;
}

export function notifySessionUpdated(session: AuthResponse) {
  updatedHandler?.(session);
}
