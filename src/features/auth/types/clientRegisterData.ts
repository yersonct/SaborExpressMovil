export interface ClientRegisterData {
  acceptedPrivacyPolicy: boolean;
  privacyPolicyVersion: string;
  name: string;
  lastName: string;
  email: string;
  password: string;
  document?: string;
  phone?: string;
}
