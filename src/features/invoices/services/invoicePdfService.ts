import { Platform } from "react-native";
import type { Order } from "@/features/cashier/components/CashierData";
import type { Invoice } from "../types/invoice.types";
import type { InvoicePdfLabels } from "./invoicePdfTemplate";

export async function generateAndShareInvoicePdf(
  invoice: Invoice,
  order: Order,
  paymentMethod: string,
  labels: InvoicePdfLabels,
) {
  if (Platform.OS === "web") {
    const webPrinter = await import("./invoicePdfWebService");
    return webPrinter.generateAndShareInvoicePdf(
      invoice,
      order,
      paymentMethod,
      labels,
    );
  }

  const nativePrinter = await import("./invoicePdfNativeService");
  return nativePrinter.generateAndShareInvoicePdf(
    invoice,
    order,
    paymentMethod,
    labels,
  );
}
