"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, type DocumentData } from "firebase/firestore";
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

export default function Home() {
  const [campings, setCampings] = useState<Camping[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [debug, setDebug] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const snap = await getDocs(collection(db, "campings"));

        const rawCount = snap.docs.length;
        const items: Camping[] = [];
        const rejected: string[] = [];

        snap.docs.forEach((doc) => {
          const data: DocumentData = doc.data();
          if (isCampingDoc(data)) {
            items.push({ id: doc.id, ...(data as CampingDoc) });
          } else {
            rejected.push(doc.id);
          }
        });

        setCampings(items);
        setDebug(
          `Docs totales: ${rawCount} | Aceptados: ${items.length} | Rechazados: ${rejected.length}` +
            (rejected.length ? ` | Rechazados: ${rejected.join(", ")}` : "")
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Campings</h1>

      {debug ? <p style={{ opacity: 0.7 }}>{debug}</p> : null}

      {loading ? (
        <p>Cargando…</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : campings.length === 0 ? (
        <p>No hay campings válidos cargados.</p>
      ) : (
        <ul>
          {campings.map((c) => (
            <li key={c.id}>
              <strong>{c.nombre}</strong> - {c.areaProtegida} - Parcelas:{" "}
              {c.capacidadParcelas}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
