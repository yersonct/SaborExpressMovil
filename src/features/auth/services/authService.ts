import { login } from "./login";
import { registerClient } from "./registerClient";
import { logout } from "./logout";
import { confirmEmail } from "./confirmEmail";
import { resendConfirmationCode } from "./resendConfirmationCode";
import { activateAccount } from "./activateAccount";
import { resendActivationCode } from "./resendActivationCode";
import { forgotPassword } from "./forgotPassword";
import { verifyResetCode } from "./verifyResetCode";
import { resetPassword } from "./resetPassword";

export const authService = {
  login,
  registerClient,
  logout,
  confirmEmail,
  resendConfirmationCode,
  activateAccount,
  resendActivationCode,
  forgotPassword,
  verifyResetCode,
  resetPassword,
};
