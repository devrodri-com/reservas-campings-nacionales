"use client";

import { useEffect, useState } from "react";
import type { Camping } from "@/types/camping";
import { fetchCampings } from "@/lib/campingsRepo";
import CampingCard from "@/components/CampingCard";

export default function Home() {
  const [campings, setCampings] = useState<Camping[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchCampings();
        setCampings(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      <section style={{ display: "grid", gap: 10 }}>
        <h1 style={{ margin: 0, color: "var(--color-accent)" }}>Reservas de Campings</h1>
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
          Seleccioná un camping, elegí tus fechas y confirmá tu reserva. La asignación de parcela se realiza en
          recepción al momento del check-in.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        {loading ? <p>Cargando campings…</p> : null}
        {error ? <p style={{ color: "red" }}>{error}</p> : null}

        {!loading && !error && campings.length === 0 ? (
          <p>No hay campings disponibles.</p>
        ) : (
          <div
            style={{
              marginTop: 14,
              display: "grid",
              gap: 14,
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            {campings.map((c) => (
              <CampingCard key={c.id} camping={c} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
