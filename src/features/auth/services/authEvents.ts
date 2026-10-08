export type SessionEndReason = "expired" | "role_revoked";

type SessionExpiredHandler = (reason: SessionEndReason) => void;

let handler: SessionExpiredHandler | null = null;

export function setSessionExpiredHandler(fn: SessionExpiredHandler) {
  handler = fn;
}

export function notifySessionExpired(reason: SessionEndReason = "expired") {
  if (handler) handler(reason);
}
