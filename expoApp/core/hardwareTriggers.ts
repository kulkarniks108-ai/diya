import { assist } from "@/core/assist";
import { speak } from "@/services/speech";
import { esp32Adapter } from "@/services/ble/esp32Adapter";
import { useHardwareStore } from "@/store/hardware";
import { useLiveStore } from "@/store/live";
import { useAuthStore } from "@/store/auth";

let initialized = false;

export function initHardwareTriggers(): void {
  if (initialized) return;
  initialized = true;

  esp32Adapter.onEvent(async (event) => {
    const authUser = useAuthStore.getState().user;
    if (!authUser || authUser.role !== "blind") {
      return;
    }

    if (event.type === "BUTTON_SHORT") {
      const captureFn = useHardwareStore.getState().captureFn;
      if (captureFn) {
        try {
          await assist({
            captureFn,
            prompt: "Describe the surroundings and warn about obstacles",
            language: "en",
          });
        } catch {
          // assist() already speaks an error
        }
        return;
      }

      // If capture function isn't available (camera screen not mounted), request UI to open it.
      speak("Open the camera screen to capture surroundings");
      useHardwareStore.getState().requestAction({ type: "ASSIST", seq: event.seq });
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

    // BUTTON_DOUBLE reserved for future
  });
}
