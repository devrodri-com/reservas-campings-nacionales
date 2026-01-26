"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Camping } from "@/types/camping";
import { fetchCampingById } from "@/lib/campingsRepo";
import { formatArs } from "@/lib/money";
import { Button, Card } from "@/components/ui";
import { InstagramIcon, ExternalLinkIcon } from "@/components/icons";

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

  if (loading) return <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}><p>Cargando…</p></main>;
  if (error) return <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}><p style={{ color: "red" }}>{error}</p></main>;
  if (!camping) return <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}><p>Camping no encontrado.</p></main>;

  const imageUrl = (camping.coverImageUrl?.trim() || "") || "/campings/placeholder.jpg";

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      <img
        src={imageUrl}
        alt={`Imagen de ${camping.nombre}`}
        style={{
          width: "100%",
          maxHeight: 400,
          objectFit: "cover",
          borderRadius: 12,
          marginBottom: 24,
        }}
      />

      <Card>
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <h1 style={{ margin: "0 0 4px 0", fontSize: 28, fontWeight: 800, color: "var(--color-accent)" }}>
              {camping.nombre}
            </h1>
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 16 }}>
              {camping.areaProtegida} · {camping.ubicacionTexto}
            </p>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ color: "var(--color-text-muted)" }}>
              <strong style={{ color: "var(--color-text)" }}>{camping.capacidadParcelas}</strong> parcelas
            </span>
            <span style={{ color: "var(--color-text-muted)" }}>
              <strong style={{ color: "var(--color-text)" }}>${formatArs(camping.precioNocheArs)}</strong> / noche / parcela
            </span>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <Link href={`/reservar?campingId=${encodeURIComponent(camping.id)}`} style={{ textDecoration: "none" }}>
              <Button variant="primary">Reservar este camping</Button>
            </Link>
            {camping.igUrl ? (
              <a
                href={camping.igUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                aria-label="Instagram"
                style={{ textDecoration: "none" }}
              >
                <Button
                  variant="ghost"
                  style={{
                    width: 40,
                    height: 40,
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <InstagramIcon title="Instagram" />
                </Button>
              </a>
            ) : null}
            {camping.webUrl ? (
              <a
                href={camping.webUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Sitio oficial"
                aria-label="Sitio oficial"
                style={{ textDecoration: "none" }}
              >
                <Button
                  variant="ghost"
                  style={{
                    width: 40,
                    height: 40,
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ExternalLinkIcon title="Sitio oficial" />
                </Button>
              </a>
            ) : null}
          </div>
        </div>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 16,
          marginTop: 24,
        }}
      >
        <Card>
          <div style={{ display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--color-accent)" }}>
              Información
            </h2>
            {camping.descripcionCorta ? (
              <p style={{ margin: 0, color: "var(--color-text)", lineHeight: 1.6 }}>
                {camping.descripcionCorta}
              </p>
            ) : (
              <p style={{ margin: 0, color: "var(--color-text-muted)", fontStyle: "italic" }}>
                (Placeholder) Descripción del camping pendiente de carga.
              </p>
            )}
            <p style={{ margin: "8px 0 0 0", fontSize: 14, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
              <strong>Nota:</strong> La asignación de parcela se realiza en recepción al momento del check-in.
            </p>
          </div>
        </Card>

        <Card>
          <div style={{ display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--color-accent)" }}>
              Servicios
            </h2>
            <p style={{ margin: 0, color: "var(--color-text-muted)", lineHeight: 1.6 }}>
              (Placeholder) Información sobre servicios y amenities del camping pendiente de carga.
            </p>
          </div>
        </Card>

        <Card>
          <div style={{ display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--color-accent)" }}>
              Ubicación
            </h2>
            <p style={{ margin: 0, color: "var(--color-text-muted)", lineHeight: 1.6 }}>
              {camping.ubicacionTexto}
            </p>
            {camping.direccion ? (
              <p style={{ margin: 0, color: "var(--color-text)" }}>
                {camping.direccion}
              </p>
            ) : (
              <p style={{ margin: 0, color: "var(--color-text-muted)", fontStyle: "italic" }}>
                (Placeholder) Dirección pendiente de carga.
              </p>
            )}
            {camping.mapsUrl ? (
              <a
                href={camping.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: 8, display: "inline-block" }}
              >
                <Button variant="secondary">Abrir en Google Maps</Button>
              </a>
            ) : (
              <p style={{ marginTop: 8, fontSize: 14, color: "var(--color-text-muted)", fontStyle: "italic" }}>
                (Placeholder) Mapa se incorporará próximamente.
              </p>
            )}
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 32, textAlign: "center" }}>
        <Link href={`/reservar?campingId=${encodeURIComponent(camping.id)}`} style={{ textDecoration: "none" }}>
          <Button variant="primary" style={{ fontSize: 16, padding: "12px 24px" }}>
            Reservar este camping
          </Button>
        </Link>
      </div>
    </main>
  );
}
