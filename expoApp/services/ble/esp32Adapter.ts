import { bleManagerSingleton } from "@/services/ble/bleManager";
import type { BleDeviceInfo } from "@/types/ble";
import {
  ESP32_DEVICE_NAME,
  ESP32_EVENT_CHAR_UUID,
  ESP32_SERVICE_UUID,
  type Esp32Event,
  parseEsp32Event,
} from "@/types/esp32";
import { base64ToBytes } from "@/utils/bleBytes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BleError, Device, Subscription } from "react-native-ble-plx";

const STORAGE_KEY_PREFERRED_DEVICE_ID = "ble.preferredDeviceId";

export type Esp32ConnectionState =
  | { state: "idle" }
  | { state: "scanning" }
  | { state: "connecting"; target: string }
  | { state: "connected"; device: BleDeviceInfo }
  | { state: "error"; message: string };

type EventListener = (event: Esp32Event, rawBytes: readonly number[]) => void;

type StateListener = (state: Esp32ConnectionState) => void;

export class Esp32Adapter {
  private device: Device | null = null;
  private notifySub: Subscription | null = null;
  private notifyTransactionId: string | null = null;
  private disconnectSub: Subscription | null = null;
  private state: Esp32ConnectionState = { state: "idle" };
  private eventListeners: Set<EventListener> = new Set();
  private stateListeners: Set<StateListener> = new Set();
  private connectInFlight: Promise<void> | null = null;

  getState(): Esp32ConnectionState {
    return this.state;
  }

  onState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  onEvent(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private setState(next: Esp32ConnectionState): void {
    this.state = next;
    for (const listener of this.stateListeners) listener(next);
  }

  private emitEvent(event: Esp32Event, rawBytes: readonly number[]): void {
    for (const listener of this.eventListeners) listener(event, rawBytes);
  }

  async ensureReady(): Promise<void> {
    const perm = await bleManagerSingleton.ensurePermissions();
    if (!perm.ok) {
      throw new Error(`Missing permissions: ${perm.missing.join(", ")}`);
    }

    const btState = await bleManagerSingleton.getBluetoothState();
    if (btState !== "PoweredOn") {
      throw new Error(`Bluetooth is not enabled (state: ${btState})`);
    }
  }

  async getPreferredDeviceId(): Promise<string | null> {
    const id = await AsyncStorage.getItem(STORAGE_KEY_PREFERRED_DEVICE_ID);
    return id || null;
  }

  async setPreferredDeviceId(deviceId: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY_PREFERRED_DEVICE_ID, deviceId);
  }

  async disconnect(): Promise<void> {
    // If a connect is currently happening, wait for it to settle before tearing down.
    // This avoids racing the underlying BLE stack.
    if (this.connectInFlight) {
      try {
        await this.connectInFlight;
      } catch {
        // Ignore; we are disconnecting anyway.
      }
    }

    // Clean up notification subscription safely
    if (this.notifySub) {
      try {
        this.notifySub.remove();
      } catch (error) {
        // Ignore errors during cleanup - device may already be disconnected
        console.warn("Failed to remove notification subscription:", error);
      }
      this.notifySub = null;
    }
    this.notifyTransactionId = null;

    if (this.disconnectSub) {
      try {
        this.disconnectSub.remove();
      } catch (error) {
        console.warn("Failed to remove disconnect subscription:", error);
      }
      this.disconnectSub = null;
    }

    if (this.device) {
      const id = this.device.id;
      this.device = null;
      try {
        await bleManagerSingleton.disconnect(id);
      } catch (error) {
        // Device may already be disconnected
        console.warn("Failed to disconnect device:", error);
      }
    }

    this.setState({ state: "idle" });
  }

  async connectToDeviceId(deviceId: string): Promise<void> {
    if (this.connectInFlight) return this.connectInFlight;

    const run = (async () => {
      // If we're already connected to this device, treat as success.
      if (this.device?.id === deviceId && this.state.state === "connected") {
        return;
      }

      // If we're connected to a different device, disconnect first.
      if (this.device && this.device.id !== deviceId) {
        await this.disconnect();
      }

      await this.ensureReady();
      this.setState({ state: "connecting", target: deviceId });

      const connected = await bleManagerSingleton.connect(deviceId, true);
      this.device = connected;

      if (this.disconnectSub) {
        this.disconnectSub.remove();
        this.disconnectSub = null;
      }

      // Keep internal state in sync on unexpected disconnects.
      this.disconnectSub = connected.onDisconnected((error) => {
        console.log("Device disconnected:", deviceId, error?.message);
        
        // Clean up subscriptions safely
        if (this.notifySub) {
          try {
            this.notifySub.remove();
          } catch (e) {
            console.warn("Failed to cleanup notification subscription on disconnect:", e);
          }
        }
        
        this.device = null;
        this.notifySub = null;
        this.notifyTransactionId = null;
        
        if (error) {
          this.setState({ state: "error", message: error.message });
        } else {
          this.setState({ state: "idle" });
        }
      });

      const info: BleDeviceInfo = {
        id: connected.id,
        name: connected.name ?? connected.localName ?? null,
        rssi: null,
      };

      await this.setPreferredDeviceId(connected.id);
      this.setState({ state: "connected", device: info });

      await this.subscribeToEvents();
    })();

    this.connectInFlight = run;
    try {
      await run;
    } finally {
      if (this.connectInFlight === run) this.connectInFlight = null;
    }
  }

  async autoConnect(): Promise<void> {
    await this.ensureReady();

    const preferredId = await this.getPreferredDeviceId();
    if (preferredId) {
      try {
        await this.connectToDeviceId(preferredId);
        return;
      } catch {
        // Fallback to scan-by-name
      }
    }

    await this.scanAndConnectByName(ESP32_DEVICE_NAME);
  }

  async scanAndConnectByName(name: string, timeoutMs = 10000): Promise<void> {
    await this.ensureReady();
    this.setState({ state: "scanning" });

    const seen = new Set<string>();
    let resolved = false;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          bleManagerSingleton.stopScan();
          reject(new Error("ESP32 not found during scan"));
        }
      }, timeoutMs);

      bleManagerSingleton.startScan({
        onDevice: async (d) => {
          if (resolved) return;
          if (seen.has(d.id)) return;
          seen.add(d.id);

          if (d.name !== name) return;

          resolved = true;
          clearTimeout(timeout);
          bleManagerSingleton.stopScan();

          try {
            await this.connectToDeviceId(d.id);
            resolve();
          } catch (e) {
            reject(e instanceof Error ? e : new Error("Failed to connect"));
          }
        },
        onError: (error: BleError) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeout);
          bleManagerSingleton.stopScan();
          reject(new Error(error.message));
        },
      });
    });
  }

  private async subscribeToEvents(): Promise<void> {
    if (!this.device) return;

    const transactionId = `esp32_notify_${this.device.id}`;
    if (this.notifySub && this.notifyTransactionId === transactionId) {
      return;
    }

    // Validate that the service + characteristic exist and are notifiable.
    // This prevents immediate monitor failures (which can trigger native BLE-Plx bugs on Android).
    await this.assertEventCharacteristicReady(this.device);

    this.notifyTransactionId = transactionId;
    this.notifySub = bleManagerSingleton.monitorCharacteristicForService(
      this.device,
      ESP32_SERVICE_UUID,
      ESP32_EVENT_CHAR_UUID,
      (valueBase64) => {
        try {
          const bytes = base64ToBytes(valueBase64);
          const event = parseEsp32Event(bytes);
          if (!event) return;
          this.emitEvent(event, bytes);
        } catch (e) {
          this.setState({
            state: "error",
            message: e instanceof Error ? e.message : "Failed to decode BLE notification",
          });
        }
      },
      (error) => {
        this.setState({ state: "error", message: error.message });
      },
      transactionId
    );
  }

  private async assertEventCharacteristicReady(device: Device): Promise<void> {
    const normalizeUuid = (uuid: string) => uuid.trim().toLowerCase();

    const services = await device.services();
    const serviceOk = services.some((s) => normalizeUuid(s.uuid) === normalizeUuid(ESP32_SERVICE_UUID));
    if (!serviceOk) {
      throw new Error(`ESP32 service not found: ${ESP32_SERVICE_UUID}`);
    }

    const chars = await device.characteristicsForService(ESP32_SERVICE_UUID);
    const ch = chars.find((c) => normalizeUuid(c.uuid) === normalizeUuid(ESP32_EVENT_CHAR_UUID));
    if (!ch) {
      throw new Error(`ESP32 event characteristic not found: ${ESP32_EVENT_CHAR_UUID}`);
    }

    if (!ch.isNotifiable && !ch.isIndicatable) {
      throw new Error("ESP32 event characteristic is not notifiable/indicatable");
    }
  }
}

export const esp32Adapter = new Esp32Adapter();
