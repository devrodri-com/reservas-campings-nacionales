import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Camping } from "@/types/camping";

type CampingDoc = Omit<Camping, "id">;

export function isCampingDoc(v: unknown): v is CampingDoc {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.areaProtegida === "string" &&
    typeof o.nombre === "string" &&
    typeof o.ubicacionTexto === "string" &&
    typeof o.titular === "string" &&
    typeof o.capacidadParcelas === "number" &&
    typeof o.precioNocheArs === "number" &&
    typeof o.maxPersonasPorParcela === "number" &&
    typeof o.checkInHour === "number" &&
    typeof o.checkOutHour === "number" &&
    typeof o.activo === "boolean" &&
    (o.descripcionCorta === undefined || typeof o.descripcionCorta === "string") &&
    (o.igUrl === undefined || typeof o.igUrl === "string") &&
    (o.webUrl === undefined || typeof o.webUrl === "string") &&
    (o.paymentsProvider === undefined || o.paymentsProvider === "mercadopago") &&
    (o.mpEnabled === undefined || typeof o.mpEnabled === "boolean") &&
    (o.mpAccountLabel === undefined || typeof o.mpAccountLabel === "string")
  );
}

export async function fetchCampings(): Promise<Camping[]> {
  const snap = await getDocs(collection(db, "campings"));

  const list: Camping[] = [];
  snap.docs.forEach((d) => {
    const data = d.data();
    if (isCampingDoc(data)) list.push({ id: d.id, ...data });
  });

  list.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return list;
}

export async function fetchCampingById(id: string): Promise<Camping | null> {
  const snap = await getDoc(doc(db, "campings", id));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!isCampingDoc(data)) return null;
  return { id: snap.id, ...data };
}
