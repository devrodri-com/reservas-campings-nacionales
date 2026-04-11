export type UnitTypeBookingMode = "overnight_only" | "day_use_only" | "both";

export type UnitType = {
  id: string;
  campingId: string;
  code: string;
  name: string;
  bookingMode: UnitTypeBookingMode;
  basePriceArs: number;
  capacityMax: number;
  active: boolean;
  createdAtMs: number;
};
