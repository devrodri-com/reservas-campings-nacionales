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
import type { Unit, UnitOperationalStatus } from "@/types/unit";

type UnitDoc = Omit<Unit, "id">;

function isUnitOperationalStatus(v: unknown): v is UnitOperationalStatus {
  return v === "available" || v === "blocked" || v === "maintenance";
}

function isUnitDoc(v: unknown): v is UnitDoc {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.campingId === "string" &&
    typeof o.unitTypeId === "string" &&
    typeof o.number === "string" &&
    typeof o.displayName === "string" &&
    typeof o.active === "boolean" &&
    isUnitOperationalStatus(o.operationalStatus) &&
    typeof o.createdAtMs === "number" &&
    (o.sector === undefined || typeof o.sector === "string") &&
    (o.mapLabel === undefined || typeof o.mapLabel === "string") &&
    (o.mapX === undefined || typeof o.mapX === "number") &&
    (o.mapY === undefined || typeof o.mapY === "number") &&
    (o.polygonPoints === undefined || typeof o.polygonPoints === "string")
  );
}

type UnitWithoutKeys = Omit<Unit, "id" | "campingId" | "createdAtMs">;

/** Incluye `null` en sector y priceOverrideArs para borrar el campo en Firestore. */
export type UnitUpdatePatch = Partial<
  Omit<UnitWithoutKeys, "sector" | "priceOverrideArs">
> & {
  sector?: string | null;
  priceOverrideArs?: number | null;
};

const OPTIONAL_FIELDS_CLEARABLE_WITH_NULL = new Set<string>(["sector", "priceOverrideArs"]);

function updatePayload(patch: UnitUpdatePatch): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    if (v === null && OPTIONAL_FIELDS_CLEARABLE_WITH_NULL.has(key)) {
      out[key] = deleteField();
      continue;
    }
    out[key] = v;
  }
  return out;
}

export async function fetchUnitsByCamping(campingId: string): Promise<Unit[]> {
  const snap = await getDocs(
    query(
      collection(db, "units"),
      where("campingId", "==", campingId),
      orderBy("displayName")
    )
  );

  const list: Unit[] = [];
  snap.docs.forEach((d) => {
    const data = d.data();
    if (isUnitDoc(data)) list.push({ id: d.id, ...data });
  });

  return list;
}

export async function createUnit(input: Omit<Unit, "id" | "createdAtMs">): Promise<Unit> {
  const createdAtMs = Date.now();
  const docData: UnitDoc = { ...input, createdAtMs };
  const ref = await addDoc(collection(db, "units"), docData);
  return { id: ref.id, ...docData };
}

export async function updateUnit(id: string, patch: UnitUpdatePatch): Promise<void> {
  const data = updatePayload(patch);
  if (Object.keys(data).length === 0) return;
  await updateDoc(doc(db, "units", id), data);
}
