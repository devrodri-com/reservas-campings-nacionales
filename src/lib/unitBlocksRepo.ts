import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UnitBlock, UnitBlockType } from "@/types/unitBlock";

type UnitBlockDoc = Omit<UnitBlock, "id">;

function isUnitBlockType(v: unknown): v is UnitBlockType {
  return v === "maintenance" || v === "manual_block";
}

function isUnitBlockDoc(v: unknown): v is UnitBlockDoc {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.campingId === "string" &&
    typeof o.unitId === "string" &&
    typeof o.fromDate === "string" &&
    typeof o.toDate === "string" &&
    isUnitBlockType(o.blockType) &&
    typeof o.createdByUid === "string" &&
    typeof o.createdAtMs === "number" &&
    (o.reason === undefined || typeof o.reason === "string")
  );
}

export async function fetchUnitBlocksByCamping(campingId: string): Promise<UnitBlock[]> {
  const snap = await getDocs(
    query(collection(db, "unitBlocks"), where("campingId", "==", campingId))
  );

  const list: UnitBlock[] = [];
  snap.docs.forEach((d) => {
    const data = d.data();
    if (isUnitBlockDoc(data)) list.push({ id: d.id, ...data });
  });

  return list;
}

export async function createUnitBlock(
  input: Omit<UnitBlock, "id" | "createdAtMs">
): Promise<UnitBlock> {
  const createdAtMs = Date.now();
  const docData: UnitBlockDoc = { ...input, createdAtMs };
  const ref = await addDoc(collection(db, "unitBlocks"), docData);
  return { id: ref.id, ...docData };
}

export async function deleteUnitBlock(id: string): Promise<void> {
  await deleteDoc(doc(db, "unitBlocks", id));
}
