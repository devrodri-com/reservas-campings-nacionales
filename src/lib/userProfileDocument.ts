import type { UserProfile, UserRole } from "@/types/user";

export function isUserRoleValue(v: unknown): v is UserRole {
  return (
    v === "admin_global" ||
    v === "admin_camping" ||
    v === "viewer" ||
    v === "viewer_global"
  );
}

/**
 * Valida y parsea el documento Firestore `users/{uid}` (sin el campo uid en el doc).
 */
export function parseUserProfileFromFirestore(
  uid: string,
  raw: Record<string, unknown> | undefined
): UserProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw;
  if (typeof o.email !== "string" || !isUserRoleValue(o.role) || typeof o.activo !== "boolean") {
    return null;
  }
  if (o.campingId !== undefined && typeof o.campingId !== "string") return null;
  return {
    uid,
    email: o.email,
    role: o.role,
    activo: o.activo,
    ...(typeof o.campingId === "string" ? { campingId: o.campingId } : {}),
  };
}
