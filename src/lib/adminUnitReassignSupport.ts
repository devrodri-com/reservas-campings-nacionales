import { enumerateNights } from "@/lib/dates";
import { computeUnitBasedPricePerNight } from "@/lib/computeUnitBasedPricePerNight";
import type { Reserva } from "@/types/reserva";
import type { Unit } from "@/types/unit";
import type { UnitBlock } from "@/types/unitBlock";
import type { UnitType } from "@/types/unitType";

/** Motivo por el que una unidad no puede usarse en un rango (misma lógica que `unitAvailableForReservaRange`). */
export type UnitUnavailableCode = "inactive" | "operational" | "blocked" | "reserved";

export type UnitAvailabilityResult =
  | { available: true }
  | { available: false; code: UnitUnavailableCode };

/**
 * Evalúa disponibilidad de una unidad en un rango de fechas (reservas + bloqueos + estado).
 * Base única para UI y validaciones posteriores.
 */
export function unitAvailabilityForReservaRange(
  unit: Unit,
  reservas: Reserva[],
  unitBlocks: UnitBlock[],
  checkInDate: string,
  checkOutDate: string,
  ignoreReservaId?: string
): UnitAvailabilityResult {
  if (!unit.active) return { available: false, code: "inactive" };
  if (unit.operationalStatus !== "available") return { available: false, code: "operational" };

  const blockedInRange = unitBlocks.some(
    (b) => b.unitId === unit.id && b.fromDate < checkOutDate && b.toDate > checkInDate
  );
  if (blockedInRange) return { available: false, code: "blocked" };

  const nowMs = Date.now();
  const otherReservaBlocks = reservas.some(
    (r) =>
      r.id !== ignoreReservaId &&
      r.unitId === unit.id &&
      (r.estado === "pagada" ||
        (r.estado === "pendiente_pago" &&
          typeof r.expiresAtMs === "number" &&
          r.expiresAtMs > nowMs)) &&
      r.checkInDate < checkOutDate &&
      r.checkOutDate > checkInDate
  );
  if (otherReservaBlocks) return { available: false, code: "reserved" };

  return { available: true };
}

export function unitAvailableForReservaRange(
  unit: Unit,
  reservas: Reserva[],
  unitBlocks: UnitBlock[],
  checkInDate: string,
  checkOutDate: string,
  ignoreReservaId?: string
): boolean {
  return unitAvailabilityForReservaRange(
    unit,
    reservas,
    unitBlocks,
    checkInDate,
    checkOutDate,
    ignoreReservaId
  ).available;
}

export function computeReservaUnitBasedMontoTotalArs(
  reserva: Pick<Reserva, "checkInDate" | "checkOutDate" | "adultos" | "menores">,
  targetUnit: Unit,
  unitTypeById: Map<string, UnitType>
): number | null {
  const noches = enumerateNights(reserva.checkInDate, reserva.checkOutDate).length;
  if (noches < 1) return 0;
  const ut = unitTypeById.get(targetUnit.unitTypeId);
  const pricePerNight = computeUnitBasedPricePerNight(ut, reserva.adultos, reserva.menores);
  if (pricePerNight === null) return null;
  return noches * pricePerNight;
}

export function formatWalkInUnitOptionLabel(unit: Unit, unitType: UnitType | undefined): string {
  const typeName = unitType?.name ?? "Tipo";
  const capacity = unitType?.capacityMax ?? 0;
  const pricingText = (() => {
    if (!unitType) return "Precio no disponible";
    if (unitType.pricingModel === "per_unit") {
      if (typeof unitType.unitPriceArs !== "number") return "Precio no disponible";
      return `Por unidad · $${unitType.unitPriceArs.toLocaleString("es-AR")}/noche`;
    }
    if (
      typeof unitType.adultPriceArs !== "number" ||
      typeof unitType.childPriceArs !== "number"
    ) {
      return "Precio no disponible";
    }
    return `Por persona · Adulto $${unitType.adultPriceArs.toLocaleString("es-AR")} / Menor $${unitType.childPriceArs.toLocaleString("es-AR")}`;
  })();
  return `${unit.displayName} (${typeName}) · ${capacity} personas · ${pricingText}`;
}
