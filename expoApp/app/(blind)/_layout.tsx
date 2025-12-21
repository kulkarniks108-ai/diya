import { Stack } from "expo-router";

export default function BlindLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
