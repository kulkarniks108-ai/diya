import { auth, db } from "@/config/firebase"
import type { AppUser, UserRole } from "@/types/auth"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { create } from "zustand"

let authUnsubscribe: null | (() => void) = null

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return "Something went wrong"
}

interface AuthState {
  user: AppUser | null
  authStatus: "checking" | "signedOut" | "signedIn"
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  listenToAuthChanges: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authStatus: "checking",
  isLoading: false,
  error: null,

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null })
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err: unknown) {
      set({ error: getErrorMessage(err) })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    await signOut(auth)
    set({ user: null, authStatus: "signedOut" })
  },

  listenToAuthChanges: () => {
    if (authUnsubscribe) return

    authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (!firebaseUser) {
        set({ user: null, authStatus: "signedOut", error: null })
        return
      }

      set({ authStatus: "checking" })

      try {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

        if (!userDoc.exists()) {
          set({ user: null, authStatus: "signedOut", error: "User profile not found" })
          await signOut(auth)
          return
        }

        const data = userDoc.data()
        const role = data?.role as unknown

        if (role !== "blind" && role !== "family") {
          set({ user: null, authStatus: "signedOut", error: "Invalid user role" })
          await signOut(auth)
          return
        }

        set({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            role: role as UserRole,
          },
          authStatus: "signedIn",
          error: null,
        })
      } catch (err: unknown) {
        set({
          user: null,
          authStatus: "signedOut",
          error: getErrorMessage(err),
        })
        try {
          await signOut(auth)
        } catch {
          // ignore
        }
      }
    })
  },
}))
