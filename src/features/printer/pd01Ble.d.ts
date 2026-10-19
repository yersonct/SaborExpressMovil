import type { Pd01Row } from "./pd01Receipt";
export type DiscoveredPrinter = { id: string; name: string };
export function isPd01Available(): boolean;
export function scanPd01Printers(): Promise<DiscoveredPrinter[]>;
export function sendPd01Bitmap(deviceId: string, rows: Pd01Row[]): Promise<void>;
