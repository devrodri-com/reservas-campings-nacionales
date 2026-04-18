import type { Camping } from "@/types/camping";
import { formatArs } from "@/lib/money";

export function looksLikeHttpUrl(value: string): boolean {
  const t = value.trim();
  if (/^https?:\/\//i.test(t) || /^\/\//.test(t)) return true;
  if (/^www\.google\./i.test(t) && t.toLowerCase().includes("maps")) return true;
  return false;
}

/** Texto de ubicación que no conviene mostrar como copy (links Maps, embeds, acortadores, etc.). */
export function looksLikeMapsOrLinkNoise(value: string): boolean {
  const t = value.trim();
  if (!t) return false;
  if (looksLikeHttpUrl(t)) return true;
  const lower = t.toLowerCase();
  if (/^maps\.app\.goo\.gl\//i.test(t)) return true;
  if (lower.includes("google.com/maps") || lower.includes("maps.google")) return true;
  if (lower.includes("maps/embed") || lower.includes("/embed?")) return true;
  if (lower.includes("goo.gl/maps") || lower.includes("maps.app.goo.gl")) return true;
  return false;
}

export function getCampingDisplayAddress(camping: Camping): string | null {
  const dir = camping.direccion?.trim();
  if (dir) return dir;
  const ubi = camping.ubicacionTexto?.trim();
  if (ubi && !looksLikeMapsOrLinkNoise(ubi)) return ubi;
  return null;
}

export function getCampingContextLocation(camping: Camping): string | null {
  const raw = camping.ubicacionTexto;
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  if (looksLikeMapsOrLinkNoise(t)) return null;
  if (t.length > 120) return `${t.slice(0, 117)}…`;
  return t;
}

export function getCampingCapacityLabel(camping: Camping): string {
  if (camping.inventoryMode === "unit_based") return "Disponibilidad por unidad";
  return `${camping.capacidadParcelas} parcelas`;
}

export function getCampingPriceLabel(camping: Camping): string {
  if (camping.inventoryMode === "unit_based") return "Tarifa según tipo y ocupación";
  return `$${formatArs(camping.precioNocheArs)} / noche / parcela`;
}

export function getCampingMapsUrl(camping: Camping): string | null {
  const u = camping.mapsUrl?.trim();
  return u ? u : null;
}
