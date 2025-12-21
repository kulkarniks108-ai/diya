import { BleManager, type BleError, type Device, type Subscription } from "react-native-ble-plx";
import { Platform } from "react-native";
import type { BleDeviceInfo } from "@/types/ble";
import { ensureBlePermissionsAndroid } from "@/services/ble/blePermissions.android";

export interface BleScanCallbacks {
  onDevice: (device: BleDeviceInfo) => void;
  onError: (error: BleError) => void;
}

export class GenericBleManager {
  private manager: BleManager;
  private scanActive = false;

  constructor() {
    this.manager = new BleManager();
  }

  async ensurePermissions(): Promise<{ ok: boolean; missing: string[] }> {
    if (Platform.OS === "android") {
      const { granted, missing } = await ensureBlePermissionsAndroid();
      return { ok: granted, missing };
    }
    return { ok: true, missing: [] };
  }

  async getBluetoothState(): Promise<string> {
    return this.manager.state();
  }

  onBluetoothStateChange(listener: (state: string) => void, emitCurrent = true): Subscription {
    return this.manager.onStateChange(listener, emitCurrent);
  }

  startScan(callbacks: BleScanCallbacks): void {
    if (this.scanActive) return;
    this.scanActive = true;

    this.manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) {
        callbacks.onError(error);
        return;
      }

      if (!device) return;

      callbacks.onDevice({
        id: device.id,
        name: device.name ?? device.localName ?? null,
        rssi: device.rssi ?? null,
      });
    });
  }

  stopScan(): void {
    if (!this.scanActive) return;
    this.scanActive = false;
    // react-native-ble-plx stopDeviceScan returns a promise on recent versions,
    // but we don't need to await it here.
    void this.manager.stopDeviceScan();
  }

  async connect(deviceId: string, autoConnect = true): Promise<Device> {
    const device = await this.manager.connectToDevice(deviceId, { autoConnect });
    return device.discoverAllServicesAndCharacteristics();
  }

  async disconnect(deviceId: string): Promise<void> {
    await this.manager.cancelDeviceConnection(deviceId);
  }

  async isConnected(deviceId: string): Promise<boolean> {
    const device = await this.manager.devices([deviceId]);
    return device.length === 1;
  }

  monitorCharacteristicForService(
    device: Device,
    serviceUUID: string,
    characteristicUUID: string,
    onValue: (valueBase64: string) => void,
    onError: (error: BleError) => void,
    transactionId?: string
  ): Subscription {
    return device.monitorCharacteristicForService(
      serviceUUID,
      characteristicUUID,
      (error, characteristic) => {
        if (error) {
          onError(error);
          return;
        }

        const value = characteristic?.value;
        if (!value) return;

        onValue(value);
      },
      transactionId
    );
  }

  destroy(): void {
    this.stopScan();
    this.manager.destroy();
  }
}

export const bleManagerSingleton = new GenericBleManager();
