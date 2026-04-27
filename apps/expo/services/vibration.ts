import { Vibration } from "react-native";

export function vibrate(pattern?: number) {
  if (!pattern) return;

  const map: Record<number, number[]> = {
    1: [300],
    2: [200, 100, 200],
    3: [150, 100, 150, 100, 150],
  };

  Vibration.vibrate(map[pattern] || 300);
}