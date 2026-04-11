import type { Unit } from "@/types/unit";

export type UnitAvailabilityRow = {
  unit: Unit;
  isAvailable: boolean;
  reason: string;
};
