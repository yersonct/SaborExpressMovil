import { requireOptionalNativeModule } from "expo-modules-core";
import type { Order } from "@/features/cashier/components/CashierData";
import type { Invoice } from "../types/invoice.types";
import { buildInvoiceHtml, type InvoicePdfLabels } from "./invoicePdfTemplate";

export async function generateAndShareInvoicePdf(
  invoice: Invoice,
  order: Order,
  paymentMethod: string,
  labels: InvoicePdfLabels,
) {
  // Avoid crashing the cashier screen when the installed APK predates the
  // native print module. printAsync opens Android's print preview directly,
  // where the invoice can also be saved as a PDF.
  if (!requireOptionalNativeModule("ExpoPrint")) {
    const error = new Error("NATIVE_PDF_MODULES_UNAVAILABLE");
    Object.assign(error, { code: "NATIVE_PDF_MODULES_UNAVAILABLE" });
    throw error;
  }

  const Print = await import("expo-print");
  const html = buildInvoiceHtml(invoice, order, paymentMethod, labels);
  await Print.printAsync({
    html,
    width: 595,
    height: 842,
    margins: { top: 28, right: 28, bottom: 28, left: 28 },
  });
}
