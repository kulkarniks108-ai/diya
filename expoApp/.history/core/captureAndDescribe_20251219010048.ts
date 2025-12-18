import { analyze } from "@/services/analyze";
import { speak } from "@/services/speech";
import { vibrate } from "@/services/vibration";
import * as ImagePicker from "expo-image-picker";

export async function captureAndDescribe() {
  try {
    speak("Capturing image");

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (result.canceled) {
      speak("Cancelled");
      return;
    }

    const imageUri = result.assets[0].uri;

    speak("Analyzing surroundings");

    const analysis = await analyze({
      imageUri,
      userIntent: "general",
      language: "en",
      detailed: false,
    });

    speak(analysis.speechText);
    vibrate(analysis.vibrationPattern);
  } catch {
    speak("Something went wrong");
  }
}
