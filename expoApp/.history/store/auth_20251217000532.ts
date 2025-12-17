import { auth, db } from "@/config/firebase";
import { AppUser, UserRole } from "@/types/auth";
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    User,
} from "firebase/auth";
import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";
import { create } from "zustand";

interface AuthState {
  user: AppUser | null;
  isLoading: boolean;
  error: string | null;

  register: (
    email: string,
    password: string,
    role: UserRole
  ) => Promise<void>;

  login: (email: string, password: string) => Promise<void>;

  logout: () => Promise<void>;

  listenToAuthChanges: () => void;

  addFamilyMemberByEmail: (email: string) => Promise<void>;

  removeFamilyMember: (familyUid: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  // ---------------- REGISTER ----------------
  register: async (email, password, role) => {
    try {
      set({ isLoading: true, error: null });

      const cred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const uid = cred.user.uid;

      // create user profile
      await setDoc(doc(db, "users", uid), {
        email,
        role,
        createdAt: serverTimestamp(),
      });

      // auto-create access doc for blind users
      if (role === "blind") {
        await setDoc(doc(db, "access", uid), {
          familyMembers: [],
        });
      }
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // ---------------- LOGIN ----------------
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // ---------------- LOGOUT ----------------
  logout: async () => {
    await signOut(auth);
    set({ user: null });
  },

  // ---------------- AUTH LISTENER ----------------
  listenToAuthChanges: () => {
    onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (!firebaseUser) {
        set({ user: null });
        return;
      }

      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

      if (!userDoc.exists()) {
        set({ error: "User profile not found" });
        return;
      }

      const data = userDoc.data();

      set({
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          role: data.role,
        },
      });
    });
  },

  // ---------------- ADD FAMILY MEMBER ----------------
  addFamilyMemberByEmail: async (email) => {
    const currentUser = get().user;
    if (!currentUser || currentUser.role !== "blind") {
      set({ error: "Permission denied" });
      return;
    }

    try {
      set({ isLoading: true, error: null });

      const q = query(
        collection(db, "users"),
        where("email", "==", email),
        where("role", "==", "family")
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error("Family user not found");
      }

      const familyUid = snapshot.docs[0].id;

      await updateDoc(doc(db, "access", currentUser.uid), {
        familyMembers: arrayUnion(familyUid),
      });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // ---------------- REMOVE FAMILY MEMBER ----------------
  removeFamilyMember: async (familyUid) => {
    const currentUser = get().user;
    if (!currentUser || currentUser.role !== "blind") {
      set({ error: "Permission denied" });
      return;
    }

    try {
      await updateDoc(doc(db, "access", currentUser.uid), {
        familyMembers: arrayRemove(familyUid),
      });
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));
