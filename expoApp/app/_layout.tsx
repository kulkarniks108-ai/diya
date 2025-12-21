import { initHardwareTriggers } from "@/core/hardwareTriggers";
import { esp32Adapter } from "@/services/ble/esp32Adapter";
import { useAuthStore } from "@/store/auth";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "../components/SafeScreen";

import "./global.css";

export default function RootLayout() {
  const user = useAuthStore((s) => s.user);
  const bleStartedRef = useRef(false);

   useEffect(() => {
    useAuthStore.getState().listenToAuthChanges();
  }, []);

  useEffect(() => {
    // Safe to init once; events are ignored unless a blind user is logged in.
    initHardwareTriggers();
  }, []);

  useEffect(() => {
    if (bleStartedRef.current) return;
    if (!user || user.role !== "blind") return;

    bleStartedRef.current = true;
    void esp32Adapter.autoConnect();
  }, [user]);
  
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
