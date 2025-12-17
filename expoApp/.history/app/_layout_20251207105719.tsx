import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "../components/SafeScreen";
import "./global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
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
