import type { UnitType } from "@/types/unitType";

/**
 * Precio por noche en modo unit_based según pricingModel del tipo.
 * Misma regla que /reservar y walk-in admin (sin basePriceArs en runtime).
 */
export function computeUnitBasedPricePerNight(
  unitType: UnitType | undefined,
  adultos: number,
  menores: number
): number | null {
  if (!unitType) return null;

  if (unitType.pricingModel === "per_unit") {
    if (typeof unitType.unitPriceArs === "number") return unitType.unitPriceArs;
    return null;
  }

  if (typeof unitType.adultPriceArs === "number" && typeof unitType.childPriceArs === "number") {
    return adultos * unitType.adultPriceArs + menores * unitType.childPriceArs;
  }
  return null;
}
