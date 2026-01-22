import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile, UserRole } from "@/types/user";

type UserProfileDoc = Omit<UserProfile, "uid">;

function isUserRole(v: unknown): v is UserRole {
  return v === "admin_global" || v === "admin_camping" || v === "viewer";
}

function isUserProfileDoc(v: unknown): v is UserProfileDoc {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.email === "string" &&
    isUserRole(o.role) &&
    typeof o.activo === "boolean" &&
    (o.campingId === undefined || typeof o.campingId === "string")
  );
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!isUserProfileDoc(data)) return null;
  return { uid, ...data };
}
