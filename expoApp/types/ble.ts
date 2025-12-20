export type BleConnectionState = "unknown" | "scanning" | "connecting" | "connected" | "disconnected" | "error";

export interface BleDeviceInfo {
  id: string;
  name: string | null;
  rssi: number | null;
}

export interface BleNotification {
  deviceId: string;
  serviceUUID: string;
  characteristicUUID: string;
  /** base64-encoded payload as provided by react-native-ble-plx */
  valueBase64: string;
}
