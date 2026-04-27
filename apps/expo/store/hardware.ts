import { create } from "zustand";

export type HardwareAction =
  | { type: "ASSIST"; seq: number }
  | { type: "SOS"; seq: number }
  | { type: "SOS_CLEAR"; seq: number };

interface HardwareState {
  captureFn: (() => Promise<string>) | null;
  pendingAction: HardwareAction | null;

  setCaptureFn: (fn: (() => Promise<string>) | null) => void;
  requestAction: (action: HardwareAction) => void;
  clearPendingAction: () => void;
}

export const useHardwareStore = create<HardwareState>((set) => ({
  captureFn: null,
  pendingAction: null,

  setCaptureFn: (fn) => set({ captureFn: fn }),
  requestAction: (action) => set({ pendingAction: action }),
  clearPendingAction: () => set({ pendingAction: null }),
}));
