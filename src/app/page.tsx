"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Camping } from "@/types/camping";
import { fetchCampings } from "@/lib/campingsRepo";
import CampingCard from "@/components/CampingCard";
import FAQ from "@/components/FAQ";
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
          marginBottom: 64,
          overflow: "hidden",
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
              objectPosition: "center bottom",
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
            <span className="hero-secondary-cta">
              <Link href="#institucional" style={{ textDecoration: "none" }}>
                <Button
                  variant="ghost"
                  style={{
                    border: "1px solid rgba(255,255,255,0.75)",
                    background: "rgba(0,0,0,0.35)",
                    color: "white",
                  }}
                >
                  Conocer APN
                </Button>
              </Link>
            </span>
          </div>
        </div>
      </section>

      <main className="home-main">
        {/* Métricas */}
        <section className="home-section">
          <div className="home-stats">
            <div className="home-stat-card">
              <div className="home-stat-value">5M+</div>
              <div className="home-stat-label">hectáreas protegidas</div>
            </div>
            <div className="home-stat-card">
              <div className="home-stat-value">55</div>
              <div className="home-stat-label">áreas protegidas</div>
            </div>
            <div className="home-stat-card">
              <div className="home-stat-value">4</div>
              <div className="home-stat-label">Patrimonio Mundial</div>
            </div>
            <div className="home-stat-card">
              {/* TODO: volver a dinámico cuando estén cargados los 17 campings en Firestore */}
              <div className="home-stat-value">17</div>
              <div className="home-stat-label">campings habilitados</div>
            </div>
          </div>
        </section>

        {/* Bloque institucional */}
        <section id="institucional" className="home-section">
          <div style={{ display: "grid", gap: 20 }}>
            <div>
              <h2 style={{ margin: "0 0 10px 0", fontSize: "clamp(20px, 3vw, 26px)", color: "var(--color-accent)", fontWeight: 700 }}>
                Administración de Parques Nacionales
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "var(--color-text)",
                  maxWidth: 720,
                }}
              >
                Organismo responsable de la gestión y conservación de las áreas protegidas de la República Argentina.
                Promovemos la preservación del patrimonio natural y cultural, el turismo sostenible, la educación
                ambiental y el uso responsable de los espacios naturales.
              </p>
            </div>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                maxWidth: 720,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  lineHeight: 1.5,
                  color: "var(--color-text-muted)",
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
        <section className="home-section">
          <h2 style={{ margin: "0 0 16px 0", fontSize: "clamp(18px, 2.5vw, 22px)", color: "var(--color-accent)", fontWeight: 700 }}>
            Cómo funciona
          </h2>
          <div
            className="home-como-funciona"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {COMO_FUNCIONA.map((texto, i) => (
              <div key={i} className="home-step">
                <span className="home-step-num">{i + 1}</span>
                <span className="home-step-text">{texto}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Sección editorial */}
        <section className="home-section">
          <h2 style={{ margin: "0 0 16px 0", fontSize: "clamp(18px, 2.5vw, 22px)", color: "var(--color-accent)", fontWeight: 700 }}>
            Nuestros pilares
          </h2>
          <div className="home-editorial">
            <div className="home-editorial-item">
              <div className="home-editorial-img">
                <Image
                  src="/home/home-conservacion.jpg"
                  alt="Conservación"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <h3>Conservación</h3>
              <p>Protegemos biodiversidad y patrimonio natural y cultural.</p>
            </div>
            <div className="home-editorial-item">
              <div className="home-editorial-img">
                <Image
                  src="/home/home-turismo-responsable.jpg"
                  alt="Turismo responsable"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <h3>Turismo responsable</h3>
              <p>Visitá, acampá y recorré minimizando impacto.</p>
            </div>
            <div className="home-editorial-item">
              <div className="home-editorial-img">
                <Image
                  src="/home/home-experiencias.jpg"
                  alt="Experiencias"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <h3>Experiencias</h3>
              <p>Explorá áreas protegidas con servicios oficiales y planificación.</p>
            </div>
          </div>
        </section>

        {/* Campings disponibles */}
        <section className="home-section">
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
    </>
  );
}
