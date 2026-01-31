import { NextResponse } from "next/server";

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

    const preferenceId = `pref_${reservaId}_${Date.now()}`;
    const checkoutUrl = `/pago/simulado?reservaId=${encodeURIComponent(reservaId)}`;

    return NextResponse.json({ checkoutUrl, preferenceId }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
