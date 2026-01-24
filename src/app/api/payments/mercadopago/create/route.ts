import { NextResponse } from "next/server";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fetchReservaById } from "@/lib/reservasRepo";
import { fetchCampingById } from "@/lib/campingsRepo";
import { resolveMercadoPagoToken } from "@/lib/payments/mercadoPagoConfig";

type ReqBody = {
  reservaId: string;
};

type ResBody = {
  checkoutUrl: string;
  preferenceId: string;
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

  const camping = await fetchCampingById(reserva.campingId);
  if (!camping) {
    return NextResponse.json({ error: "Camping no encontrado" }, { status: 404 });
  }

  const mpToken = resolveMercadoPagoToken(camping);

  // Por ahora seguimos en mock. En Etapa 3, si mpToken existe, acá se crea la preferencia real con MP.
  const preferenceId = `pref_${b.reservaId}_${Date.now()}`;
  const checkoutUrl = `/pago/simulado?reservaId=${encodeURIComponent(b.reservaId)}`;

  await updateDoc(doc(db, "reservas", b.reservaId), {
    mpPreferenceId: preferenceId,
    paymentProvider: "mercadopago",
  });

  const res: ResBody = { checkoutUrl, preferenceId };
  return NextResponse.json(res, { status: 200 });
}
