import { sendPd01Bitmap, scanPd01Printers, isPd01Available, verifyBlePrinter } from "./pd01Ble";
import { buildPd01TestRows } from "./pd01Receipt";
import type { ApiLanguage } from "@/features/auth/services/apiLanguage";
export { scanPd01Printers, isPd01Available, verifyBlePrinter };
export async function printPd01Test(deviceId: string, language: ApiLanguage = "es") { await sendPd01Bitmap(deviceId, buildPd01TestRows(language)); }
export { printInvoiceOrPdf } from "@/features/printers/services/invoicePrintService";
