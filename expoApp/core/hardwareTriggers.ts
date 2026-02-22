import { PROMPTS } from "@/constants/prompt";
import { assist } from "@/core/assist";
import { esp32Adapter } from "@/services/ble/esp32Adapter";
import { speak } from "@/services/speech";
import { useAuthStore } from "@/store/auth";
import { useHardwareStore } from "@/store/hardware";
import { useLiveStore } from "@/store/live";

let initialized = false;
const DEBOUNCE_TIME_MS = 3000;
const lastTriggerTime: Record<string, number> = {
  BUTTON_SHORT: 0,
  BUTTON_LONG: 0,
  BUTTON_DOUBLE: 0,
};

export function initHardwareTriggers(): void {
  if (initialized) return;
  initialized = true;

  esp32Adapter.onEvent(async (event) => {
    const authUser = useAuthStore.getState().user;
    if (!authUser || authUser.role !== "blind") {
      return;
    }

    const now = Date.now();
    const lastTime = lastTriggerTime[event.type] ?? 0;
    if (now - lastTime < DEBOUNCE_TIME_MS) {
      console.log(`Hardware trigger debounced: ${event.type}`);
      return;
    }
    lastTriggerTime[event.type] = now;

    if (event.type === "BUTTON_SHORT") {
      console.log("Hardware trigger: BUTTON_SHORT");
      const captureFn = useHardwareStore.getState().captureFn;
      if (captureFn) {
        try {
          await assist({
            captureFn,
            prompt: PROMPTS.imageAssist.DescribeInShortFocus,
            language: "en",
          });
        } catch {
          // assist() already speaks an error
        }
        return;
      }

      // If capture function isn't available (camera screen not mounted), request UI to open it.
      speak("Open the camera screen to capture surroundings");
      useHardwareStore
        .getState()
        .requestAction({ type: "ASSIST", seq: event.seq });
      return;
    }

    if (event.type === "BUTTON_LONG") {
      await useLiveStore.getState().triggerSOS();
      const err = useLiveStore.getState().error;
      if (err) {
        speak("Failed to trigger SOS");
      } else {
        speak("SOS triggered");
      }
      return;
    }

    if (event.type === "BUTTON_DOUBLE") {
      const captureFn = useHardwareStore.getState().captureFn;
      if (captureFn) {
        try {
          await assist({
            captureFn,
            prompt: PROMPTS.imageAssist.DescribeInLongDetail,
            language: "en",
          });
        } catch {
          // assist() already speaks an error
        }
        return;
      }

      // If capture function isn't available (camera screen not mounted), request UI to open it.
      speak("Open the camera screen to capture surroundings");
      useHardwareStore
        .getState()
        .requestAction({ type: "ASSIST", seq: event.seq });
      return;
    }
  });
}
