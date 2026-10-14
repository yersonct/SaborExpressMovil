export type DeliveryTheme = {
  background: string;
  card: string;
  surface: string;
  elevated: string;
  text: string;
  muted: string;
  mutedText: string;
  border: string;
  accent: string;
  accentSoft: string;
  btnPrimary: string;
  icon: string;
  inputBg: string;
  inputDisabled: string;
  boxBg: string;
  successBg: string;
  successText: string;
  dangerBg: string;
  dangerText: string;
  warningBg: string;
  warningText: string;
  infoBg: string;
  infoText: string;
  badgeSuccessBg: string;
  badgeSuccessText: string;
  badgeWarningBg: string;
  badgeWarningText: string;
  badgeInfoBg: string;
  badgeInfoText: string;
  badgeDangerBg: string;
  badgeDangerText: string;
};

const darkTheme: DeliveryTheme = {
  background: "#0B1120",
  card: "#111827",
  surface: "#111827",
  elevated: "#1B2638",
  text: "#F8FAFC",
  muted: "#CBD5E1",
  mutedText: "#A8B4C5",
  border: "#2F3B50",
  accent: "#E61C24",
  accentSoft: "#3A1820",
  btnPrimary: "#E61C24",
  icon: "#F8FAFC",
  inputBg: "#172033",
  inputDisabled: "#1B2638",
  boxBg: "#1B2638",
  successBg: "#064E3B",
  successText: "#34D399",
  dangerBg: "#7F1D1D",
  dangerText: "#FCA5A5",
  warningBg: "#78350F",
  warningText: "#FBBF24",
  infoBg: "#1E3A8A",
  infoText: "#93C5FD",
  badgeSuccessBg: "#064E3B",
  badgeSuccessText: "#34D399",
  badgeWarningBg: "#78350F",
  badgeWarningText: "#FBBF24",
  badgeInfoBg: "#1E3A8A",
  badgeInfoText: "#93C5FD",
  badgeDangerBg: "#7F1D1D",
  badgeDangerText: "#FCA5A5",
};

const lightTheme: DeliveryTheme = {
  background: "#F8FAFC",
  card: "#FFFFFF",
  surface: "#FFFFFF",
  elevated: "#F1F5F9",
  text: "#1E293B",
  muted: "#64748B",
  mutedText: "#64748B",
  border: "#E2E8F0",
  accent: "#E61C24",
  accentSoft: "#FEE2E2",
  btnPrimary: "#E61C24",
  icon: "#1E293B",
  inputBg: "#FFFFFF",
  inputDisabled: "#F1F5F9",
  boxBg: "#F8FAFC",
  successBg: "#ECFDF5",
  successText: "#10B981",
  dangerBg: "#FEE2E2",
  dangerText: "#DC2626",
  warningBg: "#FEF3C7",
  warningText: "#D97706",
  infoBg: "#DBEAFE",
  infoText: "#2563EB",
  badgeSuccessBg: "#ECFDF5",
  badgeSuccessText: "#10B981",
  badgeWarningBg: "#FEF3C7",
  badgeWarningText: "#D97706",
  badgeInfoBg: "#DBEAFE",
  badgeInfoText: "#2563EB",
  badgeDangerBg: "#FEE2E2",
  badgeDangerText: "#DC2626",
};

export function getDeliveryTheme(isDark: boolean): DeliveryTheme {
  return isDark ? darkTheme : lightTheme;
}
