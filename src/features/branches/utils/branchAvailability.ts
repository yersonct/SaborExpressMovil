import type { PublicBranch } from "../types/branch.types";

type LanguageCode = "es" | "en" | "pt" | "fr";
const copies = {
  es: { open: "Abierta ahora", closed: "Cerrada ahora", noHours: "Horario no configurado", schedule: "Horario", noService: "Sede no disponible" },
  en: { open: "Open now", closed: "Closed now", noHours: "Hours not configured", schedule: "Hours", noService: "Branch unavailable" },
  pt: { open: "Aberta agora", closed: "Fechada agora", noHours: "Horário não configurado", schedule: "Horário", noService: "Unidade indisponível" },
  fr: { open: "Ouverte", closed: "Fermée", noHours: "Horaires non configurés", schedule: "Horaires", noService: "Établissement indisponible" },
} satisfies Record<LanguageCode, { open: string; closed: string; noHours: string; schedule: string; noService: string }>;

export function branchIsUnavailable(branch: PublicBranch | null | undefined): boolean {
  return branch?.isOpen === false || branch?.isActive === false;
}

export function branchAvailabilityLabel(branch: PublicBranch, language: string = "es"): string {
  const copy = copies[language as LanguageCode] ?? copies.es;
  if (branch.isActive === false) return copy.noService;
  if (branch.hasSchedule === false) return copy.noHours;
  return branch.isOpen === true ? copy.open : copy.closed;
}

export function branchHoursLabel(branch: PublicBranch, language: string = "es"): string {
  const copy = copies[language as LanguageCode] ?? copies.es;
  if (!branch.openingTime || !branch.closingTime) return copy.noHours;
  return `${copy.schedule}: ${branch.openingTime} – ${branch.closingTime} (Colombia)`;
}
