/** Solo dígitos; permite vacío. Para enteros no negativos en formularios admin. */
export function adminDigitsOnlyNonNegative(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Vacío → null; entero ≥ 0 válido; resto → null. */
export function adminParseOptionalUint(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number.parseInt(t, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}
