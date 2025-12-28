import { auth, db } from "@/config/firebase";
import { doc, setDoc } from "firebase/firestore";


export async function savePushToken(token: string) {
  const user = auth.currentUser;
  if (!user) return;

  await setDoc(
    doc(db, "pushTokens", user.uid),
    {
      token,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}
