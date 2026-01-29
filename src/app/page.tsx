"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Camping } from "@/types/camping";
import { fetchCampings } from "@/lib/campingsRepo";
import CampingCard from "@/components/CampingCard";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import DevCredits from "@/components/DevCredits";
import { Button, Card } from "@/components/ui";

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
      {/* Hero */}
      <section
        style={{
          position: "relative",
          width: "100%",
          height: "420px",
          marginBottom: 48,
        }}
        className="home-hero"
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
          }}
        >
          <Image
            src="/home/hero-apn.jpg"
            alt="Parques Nacionales de la Argentina"
            fill
            priority
            style={{
              objectFit: "cover",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.6))",
            zIndex: 2,
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 3,
            maxWidth: 1100,
            margin: "0 auto",
            padding: "24px 16px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            color: "white",
          }}
        >
          <h1
            style={{
              margin: "0 0 16px 0",
              fontSize: "clamp(28px, 5vw, 44px)",
              lineHeight: 1.1,
              fontWeight: 900,
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}
          >
            Parques Nacionales de la Argentina
          </h1>
          <p
            style={{
              margin: "0 0 12px 0",
              fontSize: "clamp(16px, 2.5vw, 20px)",
              lineHeight: 1.4,
              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
              maxWidth: 800,
            }}
          >
            Conservación, turismo sostenible y experiencias en la naturaleza protegida.
          </p>
          <p
            style={{
              margin: "0 0 24px 0",
              fontSize: "clamp(14px, 2vw, 16px)",
              lineHeight: 1.5,
              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
              maxWidth: 700,
              opacity: 0.95,
            }}
          >
            Reservá campings oficiales dentro de áreas protegidas, promoviendo el cuidado del patrimonio natural y
            cultural.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/reservar" style={{ textDecoration: "none" }}>
              <Button variant="primary">Reservar camping</Button>
            </Link>
            <Link href="#institucional" style={{ textDecoration: "none" }}>
              <Button variant="secondary">Conocer APN</Button>
            </Link>
          </div>
        </div>
      </section>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
        {/* Métricas */}
        <section
          style={{
            marginBottom: 48,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 16,
          }}
        >
          <Card>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--color-accent)", lineHeight: 1 }}>
                5M+
              </div>
              <div style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 4 }}>
                hectáreas protegidas
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--color-accent)", lineHeight: 1 }}>55</div>
              <div style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 4 }}>
                áreas protegidas
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--color-accent)", lineHeight: 1 }}>4</div>
              <div style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 4 }}>
                Patrimonio Mundial
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--color-accent)", lineHeight: 1 }}>
                {loading ? "..." : campings.length}
              </div>
              <div style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 4 }}>
                campings habilitados
              </div>
            </div>
          </Card>
        </section>

        {/* Bloque institucional */}
        <section id="institucional" style={{ marginBottom: 48 }}>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <h2 style={{ margin: "0 0 12px 0", fontSize: "clamp(20px, 3vw, 28px)", color: "var(--color-accent)" }}>
                Administración de Parques Nacionales
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: "var(--color-text)",
                  maxWidth: 900,
                }}
              >
                Organismo responsable de la gestión y conservación de las áreas protegidas de la República Argentina.
                Promovemos la preservación del patrimonio natural y cultural, el turismo sostenible, la educación
                ambiental y el uso responsable de los espacios naturales.
              </p>
            </div>
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 18,
                  lineHeight: 1.5,
                  color: "var(--color-text)",
                  fontStyle: "italic",
                }}
              >
                "Reservar un camping en Parques Nacionales es más que una estadía: es contribuir a la conservación y
                disfrutar de la naturaleza de manera responsable."
              </p>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: "clamp(20px, 3vw, 24px)", color: "var(--color-accent)" }}>
            Cómo funciona
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 20,
            }}
          >
            {COMO_FUNCIONA.map((texto, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: 16,
                  borderRadius: 12,
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "var(--color-primary)",
                    color: "var(--color-primary-contrast)",
                    fontSize: 14,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontSize: 15, lineHeight: 1.5, color: "var(--color-text)" }}>{texto}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Sección editorial */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: "clamp(20px, 3vw, 24px)", color: "var(--color-accent)" }}>
            Nuestros pilares
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            <Card>
              <div style={{ position: "relative", width: "100%", height: 160, marginBottom: 16 }}>
                <Image
                  src="/home/home-conservacion.jpg"
                  alt="Conservación"
                  fill
                  style={{
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              </div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 700, color: "var(--color-accent)" }}>
                Conservación
              </h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--color-text-muted)" }}>
                Protegemos biodiversidad y patrimonio natural y cultural.
              </p>
            </Card>
            <Card>
              <div style={{ position: "relative", width: "100%", height: 160, marginBottom: 16 }}>
                <Image
                  src="/home/home-turismo-responsable.jpg"
                  alt="Turismo responsable"
                  fill
                  style={{
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              </div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 700, color: "var(--color-accent)" }}>
                Turismo responsable
              </h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--color-text-muted)" }}>
                Visitá, acampá y recorré minimizando impacto.
              </p>
            </Card>
            <Card>
              <div style={{ position: "relative", width: "100%", height: 160, marginBottom: 16 }}>
                <Image
                  src="/home/home-experiencias.jpg"
                  alt="Experiencias"
                  fill
                  style={{
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              </div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 700, color: "var(--color-accent)" }}>
                Experiencias
              </h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--color-text-muted)" }}>
                Explorá áreas protegidas con servicios oficiales y planificación.
              </p>
            </Card>
          </div>
        </section>

        {/* Campings disponibles */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: "clamp(20px, 3vw, 24px)", color: "var(--color-accent)" }}>
            Campings disponibles
          </h2>
          {loading ? <p style={{ color: "var(--color-text-muted)" }}>Cargando campings…</p> : null}
          {error ? (
            <p style={{ color: "rgba(239,68,68,0.9)", padding: 12, borderRadius: 8, background: "rgba(239,68,68,0.1)" }}>
              {error}
            </p>
          ) : null}

          {!loading && !error && campings.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)" }}>No hay campings disponibles.</p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 20,
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
