import type { Order } from "@/features/cashier/components/CashierData";
import type { Invoice } from "../types/invoice.types";
import { buildInvoiceHtml, type InvoicePdfLabels } from "./invoicePdfTemplate";

export async function generateAndShareInvoicePdf(
  invoice: Invoice,
  order: Order,
  paymentMethod: string,
  labels: InvoicePdfLabels,
) {
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);

  const frameDocument = frame.contentDocument;
  const frameWindow = frame.contentWindow;
  if (!frameDocument || !frameWindow) {
    frame.remove();
    throw new Error("No se pudo preparar la vista de impresión.");
  }

  frameWindow.addEventListener("afterprint", () => frame.remove(), {
    once: true,
  });
  frameDocument.open();
  frameDocument.write(buildInvoiceHtml(invoice, order, paymentMethod, labels));
  frameDocument.close();
  frameWindow.focus();
  frameWindow.print();
}
