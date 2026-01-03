import { db } from "@/config/firebase"
import { useAuthStore } from "@/store/auth"
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore"
import { create } from "zustand"

export interface LiveStatus {
  lat?: number
  lng?: number
  updatedAt?: any // Firestore Timestamp or number
  sos?: boolean
}

interface FamilyState {
  linkedBlindUserId: string | null
  blindUserLocation: LiveStatus | null
  connectionStatus: "idle" | "searching" | "connected" | "no-link" | "error"
  error: string | null

  findLinkedBlindUser: () => Promise<void>
  subscribeToLiveStatus: () => void
  unsubscribeLiveStatus: () => void
}

let liveStatusUnsubscribe: (() => void) | null = null

export const useFamilyStore = create<FamilyState>((set, get) => ({
  linkedBlindUserId: null,
  blindUserLocation: null,
  connectionStatus: "idle",
  error: null,

  findLinkedBlindUser: async () => {
    const currentUser = useAuthStore.getState().user
    if (!currentUser || currentUser.role !== "family") {
      set({ error: "User is not a family member", connectionStatus: "error" })
      return
    }

    try {
      set({ connectionStatus: "searching", error: null })

      const q = query(
        collection(db, "access"),
        where("familyMembers", "array-contains", currentUser.uid)
      )

      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        set({ connectionStatus: "no-link", linkedBlindUserId: null })
        return
      }

      const blindUserId = snapshot.docs[0].id

      set({ linkedBlindUserId: blindUserId, connectionStatus: "connected" })

      get().subscribeToLiveStatus()
    } catch (err: any) {
      set({ error: err?.message ?? "Failed to find linked user", connectionStatus: "error" })
    }
  },

  subscribeToLiveStatus: () => {
    const { linkedBlindUserId } = get()
    if (!linkedBlindUserId) return

    if (liveStatusUnsubscribe) {
      liveStatusUnsubscribe()
    }

    const docRef = doc(db, "liveStatus", linkedBlindUserId)

    liveStatusUnsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          set({ blindUserLocation: docSnap.data() as LiveStatus })
        } else {
          set({ blindUserLocation: null })
        }
      },
      () => {
        set({ error: "Failed to receive updates" })
      }
    )
  },

  unsubscribeLiveStatus: () => {
    if (liveStatusUnsubscribe) {
      liveStatusUnsubscribe()
      liveStatusUnsubscribe = null
    }
  },
}))
