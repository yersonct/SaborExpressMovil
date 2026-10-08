import { API_BASE_URL } from "@/config/api";

export const BASE_URL = `${API_BASE_URL}/api/Auth`;

export const AUTH_ENDPOINTS = {
  login: `${BASE_URL}/login`,
  logout: `${BASE_URL}/logout`,
  me: `${BASE_URL}/me`,
  registerClient: `${API_BASE_URL}/api/Customers/register`,
  confirmEmail: `${BASE_URL}/confirm-email`,
  resendConfirmationCode: `${BASE_URL}/resend-confirmation-code`,
  activateAccount: `${BASE_URL}/activate-account`,
  forgotPassword: `${BASE_URL}/forgot-password`,
  verifyResetCode: `${BASE_URL}/verify-reset-code`,
  resetPassword: `${BASE_URL}/reset-password`,
  resendActivationCode: `${BASE_URL}/resend-activation-code`,
  refreshToken: `${BASE_URL}/refresh-token`,
} as const;
