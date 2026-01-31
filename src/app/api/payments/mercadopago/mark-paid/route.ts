import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const reservaId = (body as Record<string, unknown>).reservaId;

    if (typeof reservaId !== "string" || !reservaId.trim()) {
      return NextResponse.json({ error: "reservaId requerido" }, { status: 400 });
    }

    const db = adminDb();
    const reservaRef = db.collection("reservas").doc(reservaId);
    const reservaSnap = await reservaRef.get();

    if (!reservaSnap.exists) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    const data = reservaSnap.data();
    if (!data || data.estado !== "pendiente_pago") {
      return NextResponse.json({ error: "Reserva no está pendiente de pago" }, { status: 409 });
    }

    const paidAtMs = Date.now();

    // Actualizar reservas/{id}
    await reservaRef.update({
      estado: "pagada",
      paymentProvider: "mercadopago",
      paymentStatus: "approved",
      paidAtMs,
      expiresAtMs: FieldValue.delete(),
    });

    // Actualizar o crear reservas_public/{id} (merge)
    const publicRef = db.collection("reservas_public").doc(reservaId);
    await publicRef.set(
      {
        estado: "pagada",
        paidAtMs,
        expiresAtMs: FieldValue.delete(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    console.error("mark-paid error:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
