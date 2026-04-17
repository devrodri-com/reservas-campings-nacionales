import { adminDb } from "@/lib/firebaseAdmin";
import type { UserProfile } from "@/types/user";
import { parseUserProfileFromFirestore } from "@/lib/userProfileDocument";

export async function fetchUserProfileAdmin(uid: string): Promise<UserProfile | null> {
  const snap = await adminDb().collection("users").doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data();
  return parseUserProfileFromFirestore(uid, data as Record<string, unknown>);
}
