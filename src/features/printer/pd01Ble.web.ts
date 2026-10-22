import type { Pd01Row } from "./pd01Receipt";
export type DiscoveredPrinter = { id: string; name: string };
export type BlePrinterProtocol = "pd01" | "mxw01";
export const isPd01Available = () => false;
export async function scanPd01Printers(): Promise<DiscoveredPrinter[]> { throw new Error("Bluetooth requiere una APK de Android; no funciona desde el navegador."); }
export async function verifyBlePrinter(_deviceId: string): Promise<BlePrinterProtocol> { throw new Error("Bluetooth requiere una APK de Android."); }
export async function sendPd01Bitmap(_deviceId: string, _rows: Pd01Row[]): Promise<void> { throw new Error("Bluetooth requiere una APK de Android."); }
