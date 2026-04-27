import * as Speech from 'expo-speech';

export function speakText(text: string) {
  if (!text || typeof text !== 'string') return;

  Speech.stop();

  Speech.speak(text, {
    language: 'en-IN',
    rate: 0.9,
    pitch: 1.0,
  });
}
