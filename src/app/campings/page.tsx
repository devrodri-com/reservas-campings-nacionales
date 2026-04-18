"use client";

import { useEffect, useState } from "react";
import type { Camping } from "@/types/camping";
import { fetchCampings } from "@/lib/campingsRepo";
import CampingCard from "@/components/CampingCard";

export default function CampingsListPage() {
  const [campings, setCampings] = useState<Camping[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchCampings();
        setCampings(list.filter((c) => c.activo));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <main className="home-main" style={{ paddingTop: 16 }}>
      <h1 style={{ margin: "0 0 10px 0", fontSize: "clamp(20px, 3vw, 24px)", color: "var(--color-accent)" }}>
        Campings habilitados
      </h1>
      <p
        style={{
          margin: "0 0 24px 0",
          fontSize: 15,
          lineHeight: 1.55,
          color: "var(--color-text-muted)",
          maxWidth: "42em",
        }}
      >
        Catálogo de campings oficiales en áreas protegidas. Consultá la ficha de cada uno o iniciá tu reserva desde la
        opción correspondiente.
      </p>

      {loading ? <p style={{ color: "var(--color-text-muted)" }}>Cargando campings…</p> : null}

      {error ? (
        <p
          style={{
            color: "rgba(239,68,68,0.9)",
            padding: 12,
            borderRadius: 8,
            background: "rgba(239,68,68,0.1)",
          }}
        >
          {error}
        </p>
      ) : null}

      {!loading && !error && campings.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)" }}>No hay campings habilitados en este momento.</p>
      ) : null}

      {!loading && !error && campings.length > 0 ? (
        <div
          className={
            campings.length === 1 ? "campings-list-grid campings-list-grid--single" : "campings-list-grid"
          }
        >
          {campings.map((c) => (
            <CampingCard key={c.id} camping={c} />
          ))}
        </div>
      ) : null}
    </main>
  );
}
