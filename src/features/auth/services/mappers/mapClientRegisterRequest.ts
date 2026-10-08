import type { ClientRegisterData } from "../../types";

// Debe coincidir EXACTO con RegisterCustomerDto (C#)
interface RegisterDtoRequest {
  Name: string;
  LastName: string;
  Email: string;
  Password: string;
  Phone: string;
  Document?: string;
}

export function mapClientRegisterRequest(
  data: ClientRegisterData,
): RegisterDtoRequest {
  return {
    Name: data.name,
    LastName: data.lastName,
    Email: data.email,
    Password: data.password,
    Phone: data.phone,
    Document: data.document,
  };
}
