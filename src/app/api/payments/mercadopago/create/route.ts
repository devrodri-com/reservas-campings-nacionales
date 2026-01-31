import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // parse robusto (por si el body viene vacío o no-json)
    const raw = await req.text();
    let reservaId: string | null = null;

    try {
      const parsed = raw ? (JSON.parse(raw) as unknown) : null;
      if (parsed && typeof parsed === "object") {
        const v = (parsed as Record<string, unknown>).reservaId;
        if (typeof v === "string") reservaId = v;
      }
    } catch {
      // ignore parse errors
    }

    if (!reservaId || !reservaId.trim()) {
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
