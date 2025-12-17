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
  clearSOS: () => Promise<void>;
  triggerSOS: () => Promise<void>;
}

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
        throw new Error("Permission denied");
      }

      // 🔹 ask permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Location permission denied");
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
      throw new Error("Permission denied");
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
