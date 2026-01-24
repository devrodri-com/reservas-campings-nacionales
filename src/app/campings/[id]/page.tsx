"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Camping } from "@/types/camping";
import { fetchCampingById } from "@/lib/campingsRepo";
import { formatArs } from "@/lib/money";
import { Button, Card } from "@/components/ui";

const linkButtonStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--color-border)",
  fontWeight: 600,
  background: "transparent",
  color: "var(--color-text)",
  textDecoration: "none",
  display: "inline-block",
  cursor: "pointer",
};

export default function CampingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [camping, setCamping] = useState<Camping | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const c = await fetchCampingById(id);
        setCamping(c);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}><p>Cargando…</p></main>;
  if (error) return <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}><p style={{ color: "red" }}>{error}</p></main>;
  if (!camping) return <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}><p>Camping no encontrado.</p></main>;

  const imageUrl = (camping.coverImageUrl?.trim() || "") || "/campings/placeholder.jpg";

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <img
        src={imageUrl}
        alt={`Imagen de ${camping.nombre}`}
        style={{
          width: "100%",
          maxHeight: 320,
          objectFit: "cover",
          borderRadius: 12,
          marginBottom: 16,
        }}
      />
      <Card>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <h1 style={{ margin: "0 0 4px 0", fontSize: 22, color: "var(--color-accent)" }}>
              {camping.nombre}
            </h1>
            <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
              {camping.areaProtegida} · {camping.ubicacionTexto}
            </p>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span style={{ color: "var(--color-text-muted)" }}>
              <strong style={{ color: "var(--color-text)" }}>{camping.capacidadParcelas}</strong> parcelas
            </span>
            <span style={{ color: "var(--color-text-muted)" }}>
              <strong style={{ color: "var(--color-text)" }}>${formatArs(camping.precioNocheArs)}</strong> / noche / parcela
            </span>
          </div>

          {camping.descripcionCorta ? (
            <p style={{ margin: 0, color: "var(--color-text)" }}>{camping.descripcionCorta}</p>
          ) : (
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontStyle: "italic" }}>
              Sin descripción.
            </p>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
            <Link href={`/reservar?campingId=${encodeURIComponent(camping.id)}`} style={{ textDecoration: "none" }}>
              <Button variant="primary">Reservar</Button>
            </Link>
            {camping.igUrl ? (
              <a
                href={camping.igUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={linkButtonStyle}
              >
                Instagram
              </a>
            ) : null}
            {camping.webUrl ? (
              <a
                href={camping.webUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={linkButtonStyle}
              >
                Sitio oficial
              </a>
            ) : null}
          </div>
        </div>
      </Card>
    </main>
  );
}
