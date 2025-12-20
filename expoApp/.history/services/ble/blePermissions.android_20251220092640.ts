import { PermissionsAndroid, Platform } from "react-native";

export async function ensureBlePermissionsAndroid(): Promise<{ granted: boolean; missing: string[] }> {
  if (Platform.OS !== "android") return { granted: true, missing: [] };

  const apiLevel = typeof Platform.Version === "number" ? Platform.Version : 0;
  const missing: string[] = [];

  // Android 12+ (API 31+) uses BLUETOOTH_SCAN / BLUETOOTH_CONNECT
  if (apiLevel >= 31) {
    const scanGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Bluetooth Scan Permission",
        message: "We need Bluetooth permission to find your ESP32 device.",
        buttonPositive: "Allow",
        buttonNegative: "Cancel",
      }
    );

    const connectGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Bluetooth Connect Permission",
        message: "We need Bluetooth permission to connect to your ESP32 device.",
        buttonPositive: "Allow",
        buttonNegative: "Cancel",
      }
    );

    if (scanGranted !== PermissionsAndroid.RESULTS.GRANTED) missing.push("BLUETOOTH_SCAN");
    if (connectGranted !== PermissionsAndroid.RESULTS.GRANTED) missing.push("BLUETOOTH_CONNECT");

    return { granted: missing.length === 0, missing };
  }

  // Android < 12 often requires location permission for BLE scans
  const fineGranted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: "Location Permission",
      message: "We need location permission to scan for Bluetooth devices.",
      buttonPositive: "Allow",
      buttonNegative: "Cancel",
    }
  );

  if (fineGranted !== PermissionsAndroid.RESULTS.GRANTED) missing.push("ACCESS_FINE_LOCATION");

  return { granted: missing.length === 0, missing };
}
