import { getColombiaDayKey } from "@/features/shared/utils/colombia-date";

export const WAITER_LAST_NOTIFICATIONS_VIEWED_KEY =
  "saborexpress-waiter-notifications-seen-through";

export function getTodayInColombiaKey(date: Date): string {
  return getColombiaDayKey(date) ?? "";
}

export function isFromColombiaDay(
  createdAt: string | undefined,
  dayKey: string,
): boolean {
  if (!createdAt) return false;
  return getColombiaDayKey(createdAt) === dayKey;
}
