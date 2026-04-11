export type UnitOperationalStatus = "available" | "blocked" | "maintenance";

export type Unit = {
  id: string;
  campingId: string;
  unitTypeId: string;
  number: string;
  displayName: string;
  sector?: string;
  active: boolean;
  operationalStatus: UnitOperationalStatus;
  mapLabel?: string;
  mapX?: number;
  mapY?: number;
  polygonPoints?: string;
  createdAtMs: number;
};
