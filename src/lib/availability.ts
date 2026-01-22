import type { Reserva } from "@/types/reserva";
import { enumerateNights, parseYmd, toYmd } from "@/lib/dates";

export type AvailabilityDay = {
  date: string; // YYYY-MM-DD
  ocupadas: number;
  disponibles: number;
};

export function buildAvailabilityForRange(params: {
  fromDate: string; // YYYY-MM-DD
  days: number;
  capacidadParcelas: number;
  reservas: Reserva[]; // solo confirmadas
}): AvailabilityDay[] {
  const { fromDate, days, capacidadParcelas, reservas } = params;

  // ocupadas por fecha
  const ocupadasByDate = new Map<string, number>();

  for (const r of reservas) {
    const nights = enumerateNights(r.checkInDate, r.checkOutDate);
    for (const day of nights) {
      const prev = ocupadasByDate.get(day) ?? 0;
      ocupadasByDate.set(day, prev + r.parcelas);
    }
  }

  // construir rango
  const start = parseYmd(fromDate);
  if (Number.isNaN(start.getTime())) return [];

  const out: AvailabilityDay[] = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const date = toYmd(d);
    if (!date) continue;
    const ocupadas = ocupadasByDate.get(date) ?? 0;
    const disponibles = Math.max(0, capacidadParcelas - ocupadas);

    out.push({ date, ocupadas, disponibles });
  }

  return out;
}
