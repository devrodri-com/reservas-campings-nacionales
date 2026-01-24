import { NextResponse } from "next/server";

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

  const preferenceId = `pref_${b.reservaId}_${Date.now()}`;
  const checkoutUrl = `/pago/simulado?reservaId=${encodeURIComponent(b.reservaId)}`;

  const res: ResBody = { checkoutUrl, preferenceId };
  return NextResponse.json(res, { status: 200 });
}
