import { db } from "@/config/firebase";
import { useAuthStore } from "@/store/auth";
import { sendSOS } from "@/utils/notifications/sendPush";
import * as Location from "expo-location";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { create } from "zustand";

interface LiveLocation {
  lat: number;
  lng: number;
  updatedAt: number;
}

interface LiveState {
  location: LiveLocation | null;
  isTracking: boolean;
  error: string | null;
  sosActive: boolean;
  getCurrentLocation: () => Promise<void>;
  startLiveTracking: () => Promise<void>;
  stopLiveTracking: () => void;
  clearSOS: () => Promise<void>;
  triggerSOS: () => Promise<void>;
}
let locationSubscription: Location.LocationSubscription | null = null;

export const useLiveStore = create<LiveState>((set) => ({
  location: null,
  isTracking: false,
  sosActive: false,
  error: null,

  getCurrentLocation: async () => {
    try {
      set({ isTracking: true, error: null });

      // 🔹 get current user from authStore
      const authUser = useAuthStore.getState().user;
      if (!authUser || authUser.role !== "blind") {
        throw new Error("Permission denied: only blind users can access live location");
      }

      // 🔹 ensure location services are enabled on the device
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        throw new Error("Location services are turned off. Enable GPS and try again.");
      }

      // 🔹 check and request foreground permission
      const currentPerm = await Location.getForegroundPermissionsAsync();
      if (currentPerm.status !== "granted") {
        const req = await Location.requestForegroundPermissionsAsync();
        if (req.status !== "granted") {
          throw new Error("Location permission denied. Please grant permission in Settings.");
        }
      }

      // 🔹 get location
      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;

      const locationData = {
        lat: latitude,
        lng: longitude,
        updatedAt: Date.now(),
      };

      // 🔹 update local store
      set({ location: locationData });

      // 🔹 write to Firestore
      await setDoc(
        doc(db, "liveStatus", authUser.uid),
        {
          lat: latitude,
          lng: longitude,
          updatedAt: serverTimestamp(),
          sos: false,
        },
        { merge: true }
      );
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isTracking: false });
    }
  },

  startLiveTracking: async () => {
  try {
    set({ error: null, isTracking: true });

    const authUser = useAuthStore.getState().user;
    if (!authUser || authUser.role !== "blind") {
      throw new Error("Permission denied: only blind users can start live tracking");
    }

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      throw new Error("Location services are turned off. Enable GPS and try again.");
    }

    const currentPerm = await Location.getForegroundPermissionsAsync();
    if (currentPerm.status !== "granted") {
      const req = await Location.requestForegroundPermissionsAsync();
      if (req.status !== "granted") {
        throw new Error("Location permission denied. Please grant permission in Settings.");
      }
    }

    
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }

    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 2,
      },
      async (position) => {
        const { latitude, longitude } = position.coords;

        const locationData = {
          lat: latitude,
          lng: longitude,
          updatedAt: Date.now(),
        };

        
        set({ location: locationData });

        
        await setDoc(
          doc(db, "liveStatus", authUser.uid),
          {
            lat: latitude,
            lng: longitude,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    );
  } catch (err: any) {
    set({ error: err.message, isTracking: false });
  }
},

stopLiveTracking: () => {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
  set({ isTracking: false });
},


  triggerSOS: async () => {
    try {
      set({ error: null });

      const authUser = useAuthStore.getState().user;
      if (!authUser || authUser.role !== "blind") {
        throw new Error("Permission denied");
      }

      // 1. Update Firestore status
      await setDoc(
        doc(db, "liveStatus", authUser.uid),
        {
          sos: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      set({ sosActive: true });

      // 2. Fetch linked family members directly from Firestore (Source of Truth)
      const accessSnap = await getDoc(doc(db, "access", authUser.uid));
      if (!accessSnap.exists()) return;

      const { familyMembers } = accessSnap.data() as { familyMembers?: string[] };
      if (!familyMembers || familyMembers.length === 0) return;

      // 3. Fetch push tokens for all family members in parallel
      const tokenPromises = familyMembers.map((uid) =>
        getDoc(doc(db, "pushTokens", uid))
      );
      const tokenSnaps = await Promise.all(tokenPromises);

      const tokens: string[] = [];
      tokenSnaps.forEach((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data?.token) {
            tokens.push(data.token);
          }
        }
      });

      // 4. Send Push Notification
      if (tokens.length > 0) {
        await sendSOS(tokens, { url: "/(family)/safety" });
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  clearSOS: async () => {
    try {
      const authUser = useAuthStore.getState().user;
      if (!authUser || authUser.role !== "blind") {
        throw new Error("Permission denied, you are not a blind user");
      }

      await setDoc(
        doc(db, "liveStatus", authUser.uid),
        {
          sos: false,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      set({ sosActive: false });
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));
