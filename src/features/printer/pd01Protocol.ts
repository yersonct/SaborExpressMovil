import type { Pd01Row } from "./pd01Receipt";

export const PD01_SERVICE = "0000ae30-0000-1000-8000-00805f9b34fb";
export const PD01_WRITE = "0000ae01-0000-1000-8000-00805f9b34fb";
export const PD01_NOTIFY = "0000ae02-0000-1000-8000-00805f9b34fb";

function crc8(data: Uint8Array): number {
  let crc = 0;
  for (const byte of data) {
    crc ^= byte;
    for (let n = 0; n < 8; n++) crc = (crc & 0x80) ? ((crc << 1) ^ 0x07) & 255 : (crc << 1) & 255;
  }
  return crc;
}
export function pd01Packet(command: number, payload: Uint8Array): Uint8Array {
  if (payload.length > 65535) throw new Error("Paquete PD01 demasiado grande");
  const frame = new Uint8Array(8 + payload.length);
  frame.set([0x51, 0x78, command, 0x00, payload.length & 255, (payload.length >> 8) & 255], 0);
  frame.set(payload, 6);
  frame[6 + payload.length] = crc8(payload);
  frame[7 + payload.length] = 0xff;
  return frame;
}
const u8 = (...items: number[]) => Uint8Array.from(items);
export const PD01_BEGIN = [
  pd01Packet(0xa3, u8(0)),
  pd01Packet(0xa4, u8(0x32)),
  pd01Packet(0xaf, u8(0x80, 0x00)), // energía moderada; no máxima
  pd01Packet(0xbe, u8(1)),
  u8(0x51,0x78,0xa6,0,0x0b,0,0xaa,0x55,0x17,0x38,0x44,0x5f,0x5f,0x5f,0x44,0x38,0x2c,0xa1,0xff),
];
export const PD01_END = [
  pd01Packet(0xbd, u8(25)),
  u8(0x51,0x78,0xa1,0,2,0,0x30,0,0xf9,0xff),
  u8(0x51,0x78,0xa6,0,0x0b,0,0xaa,0x55,0x17,0,0,0,0,0,0,0,0x17,0x11,0xff),
  pd01Packet(0xa3, u8(0)),
];
export function pd01RowPacket(row: Pd01Row) {
  if (row.length !== 48) throw new Error("Fila PD01 inválida");
  return pd01Packet(0xa2, row);
}
// Base64 sin dependencia de Buffer/btoa; compatible con Hermes y React Native.
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
export function bytesToBase64(buf: Uint8Array) {
  let out = "";
  for (let i = 0; i < buf.length; i += 3) {
    const a = buf[i], b = buf[i + 1], c = buf[i + 2];
    const x = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
    out += alphabet[(x >> 18) & 63] + alphabet[(x >> 12) & 63] +
      (i + 1 < buf.length ? alphabet[(x >> 6) & 63] : "=") +
      (i + 2 < buf.length ? alphabet[x & 63] : "=");
  }
  return out;
}
