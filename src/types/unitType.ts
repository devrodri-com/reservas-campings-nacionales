export type UnitTypeBookingMode = "overnight_only" | "day_use_only" | "both";
export type UnitTypePricingModel = "per_person" | "per_unit";

export type UnitType = {
  id: string;
  campingId: string;
  code: string;
  name: string;
  pricingModel: UnitTypePricingModel;
  bookingMode: UnitTypeBookingMode;
  adultPriceArs?: number;
  childPriceArs?: number;
  unitPriceArs?: number;
  /** Compat temporal mientras haya flujos legacy que consumen precio único. */
  basePriceArs: number;
  capacityMax: number;
  active: boolean;
  createdAtMs: number;
};
