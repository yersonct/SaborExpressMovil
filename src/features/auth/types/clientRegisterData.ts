export interface ClientRegisterData {
  name: string;
  lastName: string;
  email: string;
  password: string;
  document?: string;
  phone: string; // 🔥 nuevo campo obligatorio
}
