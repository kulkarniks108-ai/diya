export const ESP32_DEVICE_NAME = "2ndEye-01";

// Custom UUIDs (stable, future-ready)
export const ESP32_SERVICE_UUID = "2d9b6a40-3f7a-4c2b-9a2e-2a6a2c2c2e10";
export const ESP32_EVENT_CHAR_UUID = "2d9b6a40-3f7a-4c2b-9a2e-2a6a2c2c2e11";

export type Esp32Event =
  | { type: "BUTTON_SHORT"; seq: number }
  | { type: "BUTTON_LONG"; seq: number }
  | { type: "BUTTON_DOUBLE"; seq: number };

/**
 * Notification payload format (3 bytes):
 * - Byte0: eventType (1=short, 2=long, 3=double)
 * - Byte1: value (1=pressed)
 * - Byte2: seq (0-255)
 */
export function parseEsp32Event(bytes: readonly number[]): Esp32Event | null {
  if (bytes.length < 3) return null;

  const eventType = bytes[0];
  const value = bytes[1];
  const seq = bytes[2];

  // Basic validation: value should be 1 for a press
  if (value !== 1) return null;

  switch (eventType) {
    case 1:
      return { type: "BUTTON_SHORT", seq };
    case 2:
      return { type: "BUTTON_LONG", seq };
    case 3:
      return { type: "BUTTON_DOUBLE", seq };
    default:
      return null;
  }
}
