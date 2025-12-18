import { assist } from "@/core/assist";

/**
 * Thin wrapper retained for compatibility.
 * Prefer using `assist()` directly with a programmatic captureFn.
 */
export async function captureAndDescribe() {
  await assist({
    prompt: "Describe the surroundings and warn about obstacles",
    language: "en",
  });
}
