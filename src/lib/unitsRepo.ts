import {
  addDoc,
  collection,
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

function updatePayload(
  patch: Partial<Omit<Unit, "id" | "campingId" | "createdAtMs">>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined)
  ) as Record<string, unknown>;
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

export async function updateUnit(
  id: string,
  patch: Partial<Omit<Unit, "id" | "campingId" | "createdAtMs">>
): Promise<void> {
  const data = updatePayload(patch);
  if (Object.keys(data).length === 0) return;
  await updateDoc(doc(db, "units", id), data);
}
