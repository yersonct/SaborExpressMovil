import { Platform } from "react-native";
import type { Invoice } from "@/features/invoices/types/invoice.types";
import type { Order } from "@/features/cashier/components/CashierData";
import type { InvoicePdfLabels } from "@/features/invoices/services/invoicePdfTemplate";
import { generateAndShareInvoicePdf } from "@/features/invoices/services/invoicePdfService";
import { getToken } from "@/features/auth/services/tokenStorage";
import { loadPd01Printer } from "./pd01Prefs";
import { sendPd01Bitmap, scanPd01Printers, isPd01Available } from "./pd01Ble";
import { buildPd01TestRows, buildReceiptLines, receiptLinesToBitmap } from "./pd01Receipt";
export { scanPd01Printers, isPd01Available };
export async function printPd01Test(deviceId: string) { await sendPd01Bitmap(deviceId, buildPd01TestRows()); }
export async function printInvoiceOrPdf(
  invoice: Invoice, order: Order, method: string, labels: InvoicePdfLabels,
) {
  if (Platform.OS === "android" && isPd01Available()) {
    const selected = await loadPd01Printer(await getToken());
    if (selected) {
      if (invoice.isVoided) throw new Error("No se puede imprimir una factura anulada.");
      await sendPd01Bitmap(selected.id, receiptLinesToBitmap(buildReceiptLines(invoice, order, method)));
      return;
    }
  }
  // Compatibilidad: PDF cuando no hay impresora seleccionada o se usa la web.
  await generateAndShareInvoicePdf(invoice, order, method, labels);
}
