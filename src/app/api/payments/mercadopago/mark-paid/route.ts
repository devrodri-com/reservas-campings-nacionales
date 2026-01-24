import { NextResponse } from "next/server";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fetchReservaById } from "@/lib/reservasRepo";

type ReqBody = {
  reservaId: string;
};

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Partial<ReqBody>;
  if (!b.reservaId || typeof b.reservaId !== "string") {
    return NextResponse.json({ error: "Missing reservaId" }, { status: 400 });
  }

  const reserva = await fetchReservaById(b.reservaId);
  if (!reserva) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  if (reserva.estado !== "pendiente_pago") {
    return NextResponse.json({ error: "Reserva no está pendiente de pago" }, { status: 409 });
  }

  await updateDoc(doc(db, "reservas", reserva.id), {
    estado: "pagada",
    paymentProvider: "mercadopago",
    paymentStatus: "approved",
    paidAtMs: Date.now(),
    expiresAtMs: deleteField(),
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
