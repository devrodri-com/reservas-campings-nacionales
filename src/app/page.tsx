"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Camping } from "@/types/camping";
import { fetchCampings } from "@/lib/campingsRepo";
import CampingCard from "@/components/CampingCard";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import DevCredits from "@/components/DevCredits";
import { Button } from "@/components/ui";

const COMO_FUNCIONA = [
  "Elegí tu camping y fechas",
  "Completá tus datos y realizá el pago online",
  "Presentá tu reserva en el camping al llegar",
];

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
    <>
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      <section
        style={{
          display: "grid",
          gap: 14,
          marginBottom: 40,
          textAlign: "center",
          paddingTop: 10,
          paddingBottom: 10,
        }}
      >
        <h1 style={{ margin: 0, fontSize: "clamp(26px, 5vw, 40px)", lineHeight: 1.1, color: "var(--color-accent)" }}>
          Reservá tu estadía en campings de Parques Nacionales
        </h1>
        <p style={{ margin: 0, color: "var(--color-text-muted)", maxWidth: 720, justifySelf: "center", lineHeight: 1.5 }}>
          Un sistema centralizado para reservar campings en áreas protegidas de todo el país, con gestión local y pago
          seguro.
        </p>
        <div style={{ justifySelf: "center" }}>
          <Link href="/reservar" style={{ textDecoration: "none" }}>
            <Button variant="primary">Reservar ahora</Button>
          </Link>
        </div>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", color: "var(--color-accent)" }}>
          Cómo funciona
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          {COMO_FUNCIONA.map((texto, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                color: "var(--color-text-muted)",
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--color-primary)",
                  color: "var(--color-primary-contrast)",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i + 1}
              </span>
              <span>{texto}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", color: "var(--color-accent)" }}>
          Campings
        </h2>
        {loading ? <p style={{ color: "var(--color-text-muted)" }}>Cargando campings…</p> : null}
        {error ? <p style={{ color: "red" }}>{error}</p> : null}

        {!loading && !error && campings.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>No hay campings disponibles.</p>
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

      <FAQ />
    </main>

    <Footer />
    <DevCredits />
    </>
  );
}
