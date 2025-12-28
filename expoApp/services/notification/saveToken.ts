import { db } from "@/config/firebase";
import { useAuthStore } from "@/store/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export async function savePushToken(token: string) {
  const user = useAuthStore.getState().user;
  if (!user) return;

  await setDoc(
    doc(db, "pushTokens", user.uid),
    {
      token,
      role: user.role, // "family"
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
