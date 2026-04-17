import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/types/user";
import { parseUserProfileFromFirestore } from "@/lib/userProfileDocument";

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return parseUserProfileFromFirestore(uid, data as Record<string, unknown>);
}
