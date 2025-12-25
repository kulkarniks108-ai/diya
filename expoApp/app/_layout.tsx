import { initHardwareTriggers } from "@/core/hardwareTriggers";
import { esp32Adapter } from "@/services/ble/esp32Adapter";
import { useAuthStore } from "@/store/auth";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "../components/SafeScreen";

import "./global.css";

export default function RootLayout() {
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.authStatus);
  const bleStartedRef = useRef(false);
  const router = useRouter();
  const segments = useSegments();

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

  useEffect(() => {
    // Single source of truth for navigation based on auth + role.
    // Avoid <Redirect/> inside layouts to prevent focus-effect navigation loops.
    if (authStatus === "checking") return;

    const rootSegment = segments[0];
    const inAuthGroup = rootSegment === "(auth)";
    const inBlindGroup = rootSegment === "(blind)";
    const inFamilyGroup = rootSegment === "(family)";
    const inLogoutScreen = inAuthGroup && segments[1] === "logout";

// log all the values 
    // console.log("Navigation check:", {
    //   authStatus,
    //   user,
    //   segments,
    //   inAuthGroup,
    //   inBlindGroup,
    //   inFamilyGroup,
    //   inLogoutScreen,
    // });

    if (!user) {
      // If signed out, don't allow landing on the logout confirmation screen.
      if (inLogoutScreen) {
        router.replace("/(auth)");
        return;
      }

      if (!inAuthGroup) {
        router.replace("/(auth)");
      }
      return;
    }

    const target = user.role === "blind" ? "/(blind)/(tabs)" : "/(family)/(tabs)";

    // If user is in the wrong tree (including legacy /(tabs) or most of /(auth)), send them home.
    // Exception: allow /(auth)/logout so users can explicitly sign out.
    if (inAuthGroup && !inLogoutScreen) {
      router.replace(target);
      return;
    }

    if(inLogoutScreen && user) return;

    if (user.role === "blind" && !inBlindGroup) {
      router.replace(target);
      return;
    }

    if (user.role === "family" && !inFamilyGroup) {
      router.replace(target);
      return;
    }
  }, [authStatus, router, segments, user]);
  
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeScreen>

        <Stack screenOptions={{ headerShown: false }} />
      </SafeScreen>
    </SafeAreaProvider>
  );
}
