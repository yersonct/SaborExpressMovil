export const appFeatureRegistry = {
  addresses: "addresses",
  auth: "auth",
  branches: "branches",
  cart: "cart",
  cashier: "cashier",
  catalog: "catalog",
  chef: "chef",
  client: "Client",
  customers: "customers",
  delivery: "delivery",
  employees: "employees",
  employeeSchedules: "employeeSchedules",
  invoices: "invoices",
  notifications: "notifications",
  orders: "orders",
  payments: "payments",
  products: "products",
  shared: "shared",
  tables: "tables",
  userPreferences: "userPreferences",
  waiter: "waiter",
} as const;

export const appRealtimeFeatures = [
  "notifications",
  "waiter",
  "delivery",
] as const;
