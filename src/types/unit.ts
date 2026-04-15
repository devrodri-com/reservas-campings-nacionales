export type UnitOperationalStatus = "available" | "blocked" | "maintenance";

export type Unit = {
  id: string;
  campingId: string;
  unitTypeId: string;
  number: string;
  displayName: string;
  sector?: string;
  /** Precio propio en ARS; si no se define, aplica la lógica del unitType. */
  priceOverrideArs?: number;
  active: boolean;
  operationalStatus: UnitOperationalStatus;
  mapLabel?: string;
  mapX?: number;
  mapY?: number;
  polygonPoints?: string;
  createdAtMs: number;
};
