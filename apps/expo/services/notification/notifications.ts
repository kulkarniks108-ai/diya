import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.error("No Expo projectId found");
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  console.log("Expo Push Token:", token);

 Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldShowAlert: true,   // legacy support
      shouldShowBanner: true,  // ✅ REQUIRED (Android / iOS)
      shouldShowList: true,    // ✅ REQUIRED (Android)
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
});

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("sos", {
      name: "SOS Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 500, 500],
    });
  }

  return token;
}
