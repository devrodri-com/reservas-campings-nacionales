import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Camping } from "@/types/camping";

type CampingDoc = Omit<Camping, "id">;

function isCampingDoc(v: unknown): v is CampingDoc {
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
    typeof o.activo === "boolean"
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
