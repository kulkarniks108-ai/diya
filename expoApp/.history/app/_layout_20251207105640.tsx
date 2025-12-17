import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "../components/SafeScreen";
import "./global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SafeScreen>

        <Stack screenOptions={{ headerShown: false, }} >

          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />

          <Stack.Screen name="movies/[id]" />
        </Stack>
      </SafeScreen>
    </SafeAreaProvider>
  );
}
