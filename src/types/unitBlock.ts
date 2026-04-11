export type UnitBlockType = "maintenance" | "manual_block";

export type UnitBlock = {
  id: string;
  campingId: string;
  unitId: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  blockType: UnitBlockType;
  reason?: string;
  createdByUid: string;
  createdAtMs: number;
};
