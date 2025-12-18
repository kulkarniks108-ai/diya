import { analyze } from "@/services/analyze";
import { speak } from "@/services/speech";
import { vibrate } from "@/services/vibration";
import type { AnalyzeResult } from "@/types/vision";
import * as ImagePicker from "expo-image-picker";

interface AssistOptions {
  imageUri?: string;
  prompt?: string;
  language?: string;
  /** Optional capture provider for programmatic capture (e.g., expo-camera) */
  captureFn?: () => Promise<string>;
}

const DEFAULT_PROMPT = "Describe the surroundings and warn about obstacles";
const DEFAULT_LANGUAGE = "en";

/**
 * Orchestrates capture → analyze → speak (+ vibrate).
 * - If `imageUri` is provided, uses it directly.
 * - Else if `captureFn` is provided, uses it for programmatic capture.
 * - Else falls back to ImagePicker camera (system UI).
 */
export async function assist(options: AssistOptions = {}): Promise<AnalyzeResult> {
  const {
    imageUri: providedUri,
    prompt = DEFAULT_PROMPT,
    language = DEFAULT_LANGUAGE,
    captureFn,
  } = options;

  try {
    let imageUri = providedUri;

    if (!imageUri) {
      speak("Capturing image");

      if (captureFn) {
        imageUri = await captureFn();
      } else {
        const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
        if (result.canceled) {
          speak("Cancelled");
          throw new Error("Capture cancelled");
        }
        imageUri = result.assets[0]?.uri;
      }
    }

    if (!imageUri) {
      throw new Error("No image URI available after capture");
    }

    speak("Analyzing surroundings");

    const analysis = await analyze({
      imageUri,
      language,
      detailed: false,
      // Future-ready: pass prompt to AI layer when enabled
      prompt,
    } as any);

    speak(analysis.speechText);
    vibrate(analysis.vibrationPattern);

    return analysis;
  } catch (err) {
    speak("Something went wrong");
    throw err;
  }
}
