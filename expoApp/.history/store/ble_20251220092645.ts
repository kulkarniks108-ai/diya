import { create } from "zustand";
import type { BleDeviceInfo } from "@/types/ble";
import type { Esp32Event } from "@/types/esp32";
import { esp32Adapter, type Esp32ConnectionState } from "@/services/ble/esp32Adapter";
import { bytesToHex } from "@/utils/bleBytes";

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

      const seen = new Set<string>();
      // Reuse underlying scan by delegating to adapter's internal scan in a lightweight way:
      // We keep a simple local scan with manager via adapter.scanAndConnectByName? No.
      // For debug listing, we'll just call the manager scan indirectly by attempting scanAndConnectByName later.
      // Here we expose discovered devices by piggybacking on connection scan in a later iteration.
      // For now, store shows auto-connect + last events primarily.
      set({ devices: Array.from(seen).map(() => ({ id: "", name: null, rssi: null })) });
    },

    stopScan: () => {
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
