import { decode as base64Decode } from "base-64";

export function base64ToBytes(valueBase64: string): number[] {
  let binary = "";
  try {
    binary = base64Decode(valueBase64);
  } catch {
    return [];
  }
  const bytes: number[] = new Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i) & 0xff;
  }
  return bytes;
}

export function bytesToHex(bytes: readonly number[]): string {
  try {
    return bytes
      .map((b) => (typeof b === "number" ? b : 0))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ")
      .toUpperCase();
  } catch {
    return "";
  }
}
