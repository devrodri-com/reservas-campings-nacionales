export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function isYmd(ymd: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(ymd);
}

export function toYmd(d: Date): string {
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

export function parseYmd(ymd: string): Date {
  if (!isYmd(ymd)) return new Date(NaN);

  const [yStr, mStr, dStr] = ymd.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);

  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return new Date(NaN);

  const dt = new Date(y, m - 1, d);
  // Validación extra (por si el Date normaliza cosas raras)
  if (Number.isNaN(dt.getTime())) return new Date(NaN);
  return dt;
}

/**
 * Nights covered by reservation: [checkIn, checkOut)
 * Returns all YYYY-MM-DD dates that are "nights" of the stay.
 */
export function enumerateNights(checkInDate: string, checkOutDate: string): string[] {
  const start = parseYmd(checkInDate);
  const end = parseYmd(checkOutDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const days: string[] = [];
  for (let cur = new Date(start); cur < end; cur.setDate(cur.getDate() + 1)) {
    const date = toYmd(cur);
    if (date) days.push(date);
  }
  return days;
}

export function addDaysYmd(ymd: string, days: number): string {
  const d = parseYmd(ymd);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return toYmd(d);
}

export function todayYmd(): string {
  return toYmd(new Date());
}

export function formatYmdToDmy(ymd: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd;
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Fecha y hora en zona horaria Argentina, para exportación o listados (dd/mm/aaaa HH:mm).
 */
export function formatMsToArgentineDateTime(ms: number): string {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPart["type"]) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const day = get("day");
  const month = get("month");
  const year = get("year");
  const hour = get("hour");
  const minute = get("minute");
  if (!day || !month || !year) return "";
  return `${day}/${month}/${year} ${hour}:${minute}`;
}
