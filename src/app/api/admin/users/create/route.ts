import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { fetchUserProfileAdmin } from "@/lib/userProfileAdmin";
import type { UserProfile, UserRole } from "@/types/user";

const MIN_PASSWORD_LENGTH = 6;

/** Roles que pueden crearse vía esta API (nunca `admin_global` por este endpoint). */
type CreatableRole = "admin_camping" | "viewer" | "viewer_global";

function isCreatableRole(v: unknown): v is CreatableRole {
  return v === "admin_camping" || v === "viewer" || v === "viewer_global";
}

function readNonEmptyString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function readOptionalCampingId(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

async function campingExists(campingId: string): Promise<boolean> {
  const snap = await adminDb().collection("campings").doc(campingId).get();
  return snap.exists;
}

function authorizeCreation(
  creator: UserProfile,
  newRole: CreatableRole,
  newCampingId: string | undefined
): { ok: true } | { ok: false; status: 403; message: string } {
  if (!creator.activo) {
    return { ok: false, status: 403, message: "Tu cuenta está inactiva." };
  }

  if (creator.role === "viewer" || creator.role === "viewer_global") {
    return { ok: false, status: 403, message: "No tenés permiso para crear usuarios." };
  }

  if (creator.role === "admin_global") {
    if (newRole === "admin_camping" || newRole === "viewer") {
      if (!newCampingId) {
        return { ok: false, status: 403, message: "Este rol requiere campingId." };
      }
    }
    if (newRole === "viewer_global" && newCampingId) {
      return { ok: false, status: 403, message: "viewer_global no debe tener campingId." };
    }
    return { ok: true };
  }

  if (creator.role === "admin_camping") {
    if (newRole !== "viewer") {
      return { ok: false, status: 403, message: "Solo podés crear usuarios con rol viewer." };
    }
    if (!creator.campingId) {
      return { ok: false, status: 403, message: "Tu perfil no tiene camping asignado." };
    }
    if (newCampingId !== creator.campingId) {
      return { ok: false, status: 403, message: "Solo podés crear viewers para tu camping." };
    }
    return { ok: true };
  }

  return { ok: false, status: 403, message: "No tenés permiso para crear usuarios." };
}

function validatePayload(
  newRole: CreatableRole,
  campingId: string | undefined
): { ok: true; campingIdForDoc: string | undefined } | { ok: false; status: 400; message: string } {
  if (newRole === "admin_camping" || newRole === "viewer") {
    if (!campingId) {
      return { ok: false, status: 400, message: "campingId es obligatorio para este rol." };
    }
    return { ok: true, campingIdForDoc: campingId };
  }
  if (newRole === "viewer_global") {
    if (campingId) {
      return { ok: false, status: 400, message: "viewer_global no debe incluir campingId." };
    }
    return { ok: true, campingIdForDoc: undefined };
  }
  return { ok: false, status: 400, message: "Rol no válido." };
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const match = authHeader?.match(/^Bearer\s+(.+)$/i);
    const idToken = match?.[1]?.trim();
    if (!idToken) {
      return NextResponse.json({ error: "Se requiere Authorization: Bearer <idToken>." }, { status: 401 });
    }

    let creatorUid: string;
    try {
      const decoded = await adminAuth().verifyIdToken(idToken);
      creatorUid = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Token inválido o expirado." }, { status: 401 });
    }

    const creator = await fetchUserProfileAdmin(creatorUid);
    if (!creator) {
      return NextResponse.json({ error: "Perfil de usuario no encontrado." }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Body inválido." }, { status: 400 });
    }

    const o = body as Record<string, unknown>;
    const email = readNonEmptyString(o.email)?.toLowerCase() ?? null;
    const password = readNonEmptyString(o.password);
    const roleRaw = o.role;
    const campingIdRaw = readOptionalCampingId(o.campingId);

    if (!email) {
      return NextResponse.json({ error: "email es obligatorio." }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: "password es obligatorio." }, { status: 400 });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `password debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` },
        { status: 400 }
      );
    }
    if (!isCreatableRole(roleRaw)) {
      return NextResponse.json({ error: "role no válido o no permitido para alta vía API." }, { status: 400 });
    }
    const newRole = roleRaw;

    const authz = authorizeCreation(creator, newRole, campingIdRaw);
    if (!authz.ok) {
      return NextResponse.json({ error: authz.message }, { status: authz.status });
    }

    const payload = validatePayload(newRole, campingIdRaw);
    if (!payload.ok) {
      return NextResponse.json({ error: payload.message }, { status: payload.status });
    }

    if (payload.campingIdForDoc) {
      const exists = await campingExists(payload.campingIdForDoc);
      if (!exists) {
        return NextResponse.json({ error: "El camping indicado no existe." }, { status: 400 });
      }
    }

    let createdUid: string | null = null;
    try {
      const userRecord = await adminAuth().createUser({
        email,
        password,
        emailVerified: false,
      });
      createdUid = userRecord.uid;

      const profileDoc: {
        email: string;
        role: UserRole;
        activo: boolean;
        campingId?: string;
      } = {
        email,
        role: newRole,
        activo: true,
      };
      if (payload.campingIdForDoc) {
        profileDoc.campingId = payload.campingIdForDoc;
      }

      await adminDb().collection("users").doc(createdUid).set(profileDoc);
    } catch (e: unknown) {
      if (createdUid) {
        try {
          await adminAuth().deleteUser(createdUid);
        } catch {
          /* best effort */
        }
      }

      if (typeof e === "object" && e !== null && "code" in e) {
        const code = (e as { code: string }).code;
        if (code === "auth/email-already-exists") {
          return NextResponse.json({ error: "Ya existe un usuario con ese email." }, { status: 409 });
        }
        if (code === "auth/weak-password") {
          return NextResponse.json({ error: "La contraseña es demasiado débil." }, { status: 400 });
        }
        if (code === "auth/invalid-email") {
          return NextResponse.json({ error: "Email inválido." }, { status: 400 });
        }
      }

      const msg = e instanceof Error ? e.message : "Error desconocido";
      console.error("admin/users/create error:", e);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      uid: createdUid,
      email,
      role: newRole,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    if (msg.includes("FIREBASE_SERVICE_ACCOUNT_JSON")) {
      return NextResponse.json({ error: "Configuración de servidor incompleta." }, { status: 500 });
    }
    console.error("admin/users/create fatal:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
