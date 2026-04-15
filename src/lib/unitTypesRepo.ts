import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  UnitType,
  UnitTypeBookingMode,
  UnitTypePricingModel,
} from "@/types/unitType";

type UnitTypeDoc = {
  campingId: string;
  code: string;
  name: string;
  pricingModel?: UnitTypePricingModel;
  bookingMode: UnitTypeBookingMode;
  adultPriceArs?: number;
  childPriceArs?: number;
  unitPriceArs?: number;
  basePriceArs?: number;
  capacityMax: number;
  active: boolean;
  createdAtMs: number;
};
type CreateUnitTypeInput = Omit<UnitType, "id" | "createdAtMs" | "pricingModel"> & {
  pricingModel?: UnitTypePricingModel;
};
function isUnitTypeBookingMode(v: unknown): v is UnitTypeBookingMode {
  return v === "overnight_only" || v === "day_use_only" || v === "both";
}

function isUnitTypePricingModel(v: unknown): v is UnitTypePricingModel {
  return v === "per_person" || v === "per_unit";
}

function inferPricingModel(raw: Record<string, unknown>): UnitTypePricingModel {
  if (isUnitTypePricingModel(raw.pricingModel)) return raw.pricingModel;
  if (
    typeof raw.unitPriceArs === "number" &&
    typeof raw.adultPriceArs !== "number" &&
    typeof raw.childPriceArs !== "number"
  ) {
    return "per_unit";
  }
  return "per_person";
}

function isUnitTypeDoc(v: unknown): v is UnitTypeDoc {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  const hasPricingData =
    typeof o.adultPriceArs === "number" ||
    typeof o.childPriceArs === "number" ||
    typeof o.unitPriceArs === "number";
  const hasLegacyBase = typeof o.basePriceArs === "number";
  return (
    typeof o.campingId === "string" &&
    typeof o.code === "string" &&
    typeof o.name === "string" &&
    isUnitTypeBookingMode(o.bookingMode) &&
    (isUnitTypePricingModel(o.pricingModel) || hasPricingData || hasLegacyBase) &&
    typeof o.capacityMax === "number" &&
    typeof o.active === "boolean" &&
    typeof o.createdAtMs === "number"
  );
}

function normalizeUnitTypeDoc(
  id: string,
  raw: Record<string, unknown>
): UnitType | null {
  if (!isUnitTypeDoc(raw)) return null;

  const pricingModel = inferPricingModel(raw);
  const legacyBase =
    typeof raw.basePriceArs === "number"
      ? raw.basePriceArs
      : typeof raw.adultPriceArs === "number"
        ? raw.adultPriceArs
        : typeof raw.unitPriceArs === "number"
          ? raw.unitPriceArs
          : 0;

  const normalizedBase: Omit<UnitType, "id"> = {
    campingId: raw.campingId as string,
    code: raw.code as string,
    name: raw.name as string,
    pricingModel,
    bookingMode: raw.bookingMode as UnitTypeBookingMode,
    // Compat temporal para consumidores legacy de basePriceArs
    basePriceArs: legacyBase,
    capacityMax: raw.capacityMax as number,
    active: raw.active as boolean,
    createdAtMs: raw.createdAtMs as number,
  };

  if (pricingModel === "per_unit") {
    const unitPriceArs =
      typeof raw.unitPriceArs === "number"
        ? raw.unitPriceArs
        : typeof raw.basePriceArs === "number"
          ? raw.basePriceArs
          : typeof raw.adultPriceArs === "number"
            ? raw.adultPriceArs
            : 0;
    return {
      id,
      ...normalizedBase,
      unitPriceArs,
      // Compat temporal de precio base legacy
      basePriceArs: unitPriceArs,
    };
  }

  const adultPriceArs =
    typeof raw.adultPriceArs === "number"
      ? raw.adultPriceArs
      : typeof raw.basePriceArs === "number"
        ? raw.basePriceArs
        : 0;
  const childPriceArs =
    typeof raw.childPriceArs === "number"
      ? raw.childPriceArs
      : typeof raw.basePriceArs === "number"
        ? raw.basePriceArs
        : 0;

  return {
    id,
    ...normalizedBase,
    adultPriceArs,
    childPriceArs,
    // Compat temporal de precio base legacy
    basePriceArs: adultPriceArs,
  };
}

function updatePayload(
  patch: Partial<Omit<UnitType, "id" | "campingId" | "createdAtMs">>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined)
  ) as Record<string, unknown>;
}

export async function fetchUnitTypesByCamping(campingId: string): Promise<UnitType[]> {
  const snap = await getDocs(
    query(
      collection(db, "unitTypes"),
      where("campingId", "==", campingId),
      orderBy("name")
    )
  );

  const list: UnitType[] = [];
  snap.docs.forEach((d) => {
    const data = d.data();
    if (!data || typeof data !== "object") return;
    const normalized = normalizeUnitTypeDoc(d.id, data as Record<string, unknown>);
    if (normalized) list.push(normalized);
  });

  return list;
}

export async function createUnitType(
  input: CreateUnitTypeInput
): Promise<UnitType> {
  const createdAtMs = Date.now();
  const pricingModel = input.pricingModel ?? inferPricingModel(input as Record<string, unknown>);

  const normalizedByModel =
    pricingModel === "per_unit"
      ? {
          unitPriceArs: input.unitPriceArs ?? input.basePriceArs ?? 0,
          adultPriceArs: undefined,
          childPriceArs: undefined,
        }
      : {
          adultPriceArs: input.adultPriceArs ?? input.basePriceArs ?? 0,
          childPriceArs: input.childPriceArs ?? input.basePriceArs ?? 0,
          unitPriceArs: undefined,
        };

  const compatBasePriceArs =
    pricingModel === "per_unit"
      ? normalizedByModel.unitPriceArs
      : normalizedByModel.adultPriceArs;

  const docData: UnitTypeDoc = {
    ...input,
    pricingModel,
    ...normalizedByModel,
    // Compat temporal para consumidores legacy de basePriceArs
    basePriceArs: compatBasePriceArs,
    createdAtMs,
  };
  const ref = await addDoc(collection(db, "unitTypes"), docData);
  return { id: ref.id, ...docData, pricingModel, basePriceArs: compatBasePriceArs ?? 0 };
}

export async function updateUnitType(
  id: string,
  patch: Partial<Omit<UnitType, "id" | "campingId" | "createdAtMs">>
): Promise<void> {
  const normalizedPatch: Partial<Omit<UnitType, "id" | "campingId" | "createdAtMs">> = {
    ...patch,
  };

  if (patch.pricingModel === "per_person") {
    normalizedPatch.unitPriceArs = undefined;
    normalizedPatch.basePriceArs = patch.adultPriceArs ?? patch.basePriceArs;
  }

  if (patch.pricingModel === "per_unit") {
    normalizedPatch.adultPriceArs = undefined;
    normalizedPatch.childPriceArs = undefined;
    normalizedPatch.basePriceArs = patch.unitPriceArs ?? patch.basePriceArs;
  }

  const data = updatePayload(normalizedPatch);
  if (Object.keys(data).length === 0) return;

  if (patch.pricingModel === "per_person") {
    data.unitPriceArs = deleteField();
  }
  if (patch.pricingModel === "per_unit") {
    data.adultPriceArs = deleteField();
    data.childPriceArs = deleteField();
  }

  await updateDoc(doc(db, "unitTypes", id), data);
}
