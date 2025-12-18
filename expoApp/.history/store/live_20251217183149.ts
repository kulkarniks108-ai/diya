import { db } from "@/config/firebase";
import { useAuthStore } from "@/store/auth";
import * as Location from "expo-location";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
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

      await setDoc(
        doc(db, "liveStatus", authUser.uid),
        {
          sos: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      set({ sosActive: true });
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
