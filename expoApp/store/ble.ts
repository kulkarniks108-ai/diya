import { create } from "zustand";
import type { BleDeviceInfo } from "@/types/ble";
import type { Esp32Event } from "@/types/esp32";
import { esp32Adapter, type Esp32ConnectionState } from "@/services/ble/esp32Adapter";
import { bytesToHex } from "@/utils/bleBytes";
import { bleManagerSingleton } from "@/services/ble/bleManager";

interface BleState {
  connection: Esp32ConnectionState;
  devices: BleDeviceInfo[];
  scanning: boolean;
  lastEvent: Esp32Event | null;
  lastEventRawHex: string | null;
  error: string | null;

  startScan: () => Promise<void>;
  stopScan: () => void;
  connect: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  autoConnect: () => Promise<void>;
}

export const useBleStore = create<BleState>((set, get) => {
  esp32Adapter.onState((state) => set({ connection: state }));
  esp32Adapter.onEvent((event, rawBytes) => {
    set({ lastEvent: event, lastEventRawHex: bytesToHex(rawBytes) });
  });

  return {
    connection: { state: "idle" },
    devices: [],
    scanning: false,
    lastEvent: null,
    lastEventRawHex: null,
    error: null,

    startScan: async () => {
      set({ error: null, scanning: true, devices: [] });

      try {
        await esp32Adapter.ensureReady();
      } catch (e) {
        set({ scanning: false, error: e instanceof Error ? e.message : "Failed to prepare BLE" });
        return;
      }

      const seenById = new Map<string, BleDeviceInfo>();

      bleManagerSingleton.startScan({
        onDevice: (device) => {
          seenById.set(device.id, device);
          set({ devices: Array.from(seenById.values()) });
        },
        onError: (err) => {
          bleManagerSingleton.stopScan();
          set({ scanning: false, error: err.message });
        },
      });

      // Auto-stop scan after 10s to avoid draining battery.
      setTimeout(() => {
        if (!get().scanning) return;
        bleManagerSingleton.stopScan();
        set({ scanning: false });
      }, 10_000);
    },

    stopScan: () => {
      bleManagerSingleton.stopScan();
      set({ scanning: false });
    },

    connect: async (deviceId: string) => {
      set({ error: null });
      try {
        await esp32Adapter.connectToDeviceId(deviceId);
      } catch (e) {
        set({ error: e instanceof Error ? e.message : "Failed to connect" });
      }
    },

    disconnect: async () => {
      set({ error: null });
      try {
        await esp32Adapter.disconnect();
      } catch (e) {
        set({ error: e instanceof Error ? e.message : "Failed to disconnect" });
      }
    },

    autoConnect: async () => {
      set({ error: null });
      try {
        await esp32Adapter.autoConnect();
      } catch (e) {
        set({ error: e instanceof Error ? e.message : "Auto-connect failed" });
      }
    },
  };
});
