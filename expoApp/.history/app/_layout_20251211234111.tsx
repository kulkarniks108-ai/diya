import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "../components/SafeScreen";
import "./global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeScreen>

        <Stack screenOptions={{ headerShown: false, }} >

          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />

        </Stack>
      </SafeScreen>
    </SafeAreaProvider>
  );
}
