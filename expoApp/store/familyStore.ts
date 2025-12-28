import { db } from "@/config/firebase";
import { useAuthStore } from "@/store/auth";
import {
    collection,
    doc,
    getDocs,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";
import { create } from "zustand";

interface LiveStatus {
  lat?: number;
  lng?: number;
  updatedAt?: any; // Firestore Timestamp or number
  sos?: boolean;
}

interface FamilyState {
  linkedBlindUserId: string | null;
  blindUserLocation: LiveStatus | null;
  connectionStatus: "idle" | "searching" | "connected" | "no-link" | "error";
  error: string | null;

  findLinkedBlindUser: () => Promise<void>;
  subscribeToLiveStatus: () => void;
  unsubscribeLiveStatus: () => void;
}

let liveStatusUnsubscribe: (() => void) | null = null;

export const useFamilyStore = create<FamilyState>((set, get) => ({
  linkedBlindUserId: null,
  blindUserLocation: null,
  connectionStatus: "idle",
  error: null,

  findLinkedBlindUser: async () => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser || currentUser.role !== "family") {
      set({ error: "User is not a family member", connectionStatus: "error" });
      return;
    }

    try {
      set({ connectionStatus: "searching", error: null });

      // Query the 'access' collection to find which document contains this user's UID in 'familyMembers'
      // The document ID of the 'access' doc is the Blind User's UID.
      const q = query(
        collection(db, "access"),
        where("familyMembers", "array-contains", currentUser.uid)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        set({ connectionStatus: "no-link", linkedBlindUserId: null });
        return;
      }

      // Assuming 1-to-1 for now, take the first match
      const blindUserId = snapshot.docs[0].id;
      
      set({ 
        linkedBlindUserId: blindUserId, 
        connectionStatus: "connected" 
      });

      // Automatically start listening once found
      get().subscribeToLiveStatus();

    } catch (err: any) {
      set({ error: err.message, connectionStatus: "error" });
    }
  },

  subscribeToLiveStatus: () => {
    const { linkedBlindUserId } = get();
    if (!linkedBlindUserId) return;

    // Clean up existing listener if any
    if (liveStatusUnsubscribe) {
      liveStatusUnsubscribe();
    }

    const docRef = doc(db, "liveStatus", linkedBlindUserId);

    liveStatusUnsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as LiveStatus;
          set({ blindUserLocation: data });
        } else {
          // Document might not exist yet if they haven't started tracking
          set({ blindUserLocation: null });
        }
      },
      (err) => {
        console.error("Live status listener error:", err);
        set({ error: "Failed to receive updates" });
      }
    );
  },

  unsubscribeLiveStatus: () => {
    if (liveStatusUnsubscribe) {
      liveStatusUnsubscribe();
      liveStatusUnsubscribe = null;
    }
  },
}));
