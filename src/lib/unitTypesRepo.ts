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
import type { UnitType, UnitTypeBookingMode } from "@/types/unitType";

type UnitTypeDoc = Omit<UnitType, "id">;

function isUnitTypeBookingMode(v: unknown): v is UnitTypeBookingMode {
  return v === "overnight_only" || v === "day_use_only" || v === "both";
}

function isUnitTypeDoc(v: unknown): v is UnitTypeDoc {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.campingId === "string" &&
    typeof o.code === "string" &&
    typeof o.name === "string" &&
    isUnitTypeBookingMode(o.bookingMode) &&
    typeof o.basePriceArs === "number" &&
    typeof o.capacityMax === "number" &&
    typeof o.active === "boolean" &&
    typeof o.createdAtMs === "number"
  );
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
    if (isUnitTypeDoc(data)) list.push({ id: d.id, ...data });
  });

  return list;
}

export async function createUnitType(
  input: Omit<UnitType, "id" | "createdAtMs">
): Promise<UnitType> {
  const createdAtMs = Date.now();
  const docData: UnitTypeDoc = { ...input, createdAtMs };
  const ref = await addDoc(collection(db, "unitTypes"), docData);
  return { id: ref.id, ...docData };
}

export async function updateUnitType(
  id: string,
  patch: Partial<Omit<UnitType, "id" | "campingId" | "createdAtMs">>
): Promise<void> {
  const data = updatePayload(patch);
  if (Object.keys(data).length === 0) return;
  await updateDoc(doc(db, "unitTypes", id), data);
}
