import type { ClientRegisterData } from "../../types";

// Debe coincidir EXACTO con RegisterCustomerDto (C#)
interface RegisterDtoRequest {
  AcceptedPrivacyPolicy: boolean;
  PrivacyPolicyVersion: string;
  Name: string;
  LastName: string;
  Email: string;
  Password: string;
  Phone?: string;
  Document?: string;
}

export function mapClientRegisterRequest(
  data: ClientRegisterData,
): RegisterDtoRequest {
  return {
    AcceptedPrivacyPolicy: data.acceptedPrivacyPolicy,
    PrivacyPolicyVersion: data.privacyPolicyVersion,
    Name: data.name,
    LastName: data.lastName,
    Email: data.email,
    Password: data.password,
    Phone: data.phone,
    Document: data.document,
  };
}
