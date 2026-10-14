export const COLOMBIA_TIME_ZONE = "America/Bogota";

// Colombia uses UTC-5 year-round, so this stays independent of the device zone.
const COLOMBIA_UTC_OFFSET_MS = -5 * 60 * 60 * 1000;

export function getColombiaDayKey(value: Date | string | number = new Date()): string | null {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;

  const colombiaWallTime = new Date(date.getTime() + COLOMBIA_UTC_OFFSET_MS);
  const year = colombiaWallTime.getUTCFullYear();
  const month = String(colombiaWallTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(colombiaWallTime.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isColombiaToday(value: Date | string | number): boolean {
  const dayKey = getColombiaDayKey(value);
  return dayKey !== null && dayKey === getColombiaDayKey();
}

export function formatColombiaTime(
  value: Date | string | number,
  locale?: string,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";

  const colombiaWallTime = new Date(date.getTime() + COLOMBIA_UTC_OFFSET_MS);
  return colombiaWallTime.toLocaleTimeString(locale, {
    ...options,
    timeZone: "UTC",
  });
}
