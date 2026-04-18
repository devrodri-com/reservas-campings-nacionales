import type { Unit } from "@/types/unit";

export type UnitAvailabilityRow = {
  unit: Unit;
  isAvailable: boolean;
  reason: string;
  /** Texto operativo breve (p. ej. fechas de reserva que solapan el rango consultado). */
  detailHint?: string;
};
