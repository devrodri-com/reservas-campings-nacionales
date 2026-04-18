import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { fetchUserProfileAdmin } from "@/lib/userProfileAdmin";

function readActivo(body: unknown): boolean | null {
  if (!body || typeof body !== "object") return null;
  const v = (body as Record<string, unknown>).activo;
  if (v === true) return true;
  if (v === false) return false;
  return null;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ uid: string }> }) {
  try {
    const { uid: targetUid } = await ctx.params;
    if (!targetUid?.trim()) {
      return NextResponse.json({ error: "Usuario no válido." }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    const match = authHeader?.match(/^Bearer\s+(.+)$/i);
    const idToken = match?.[1]?.trim();
    if (!idToken) {
      return NextResponse.json({ error: "Se requiere Authorization: Bearer <idToken>." }, { status: 401 });
    }

    let operatorUid: string;
    try {
      const decoded = await adminAuth().verifyIdToken(idToken);
      operatorUid = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Token inválido o expirado." }, { status: 401 });
    }

    const operator = await fetchUserProfileAdmin(operatorUid);
    if (!operator) {
      return NextResponse.json({ error: "Perfil de usuario no encontrado." }, { status: 403 });
    }
    if (!operator.activo || operator.role !== "admin_global") {
      return NextResponse.json({ error: "No tenés permiso para modificar usuarios." }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
    }

    const activo = readActivo(body);
    if (activo === null) {
      return NextResponse.json({ error: "Se requiere activo: true o false." }, { status: 400 });
    }

    if (!activo && targetUid === operatorUid) {
      return NextResponse.json(
        { error: "No podés desactivar tu propia cuenta desde esta pantalla." },
        { status: 400 }
      );
    }

    const target = await fetchUserProfileAdmin(targetUid);
    if (!target) {
      return NextResponse.json({ error: "El usuario indicado no existe." }, { status: 404 });
    }

    await adminDb().collection("users").doc(targetUid).update({ activo });

    return NextResponse.json({ ok: true, uid: targetUid, activo });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    if (msg.includes("FIREBASE_SERVICE_ACCOUNT_JSON")) {
      return NextResponse.json({ error: "Configuración de servidor incompleta." }, { status: 500 });
    }
    console.error("admin/users/[uid]/activo error:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
