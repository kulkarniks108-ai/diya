import * as Speech from "expo-speech";

export function speak(text: string) {
  if (!text) return;

  Speech.stop();
  Speech.speak(text, {
    language: "en",
    rate: 0.9,
    pitch: 1.0,
  });
}