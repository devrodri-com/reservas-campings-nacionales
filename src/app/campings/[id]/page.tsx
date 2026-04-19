"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Camping } from "@/types/camping";
import { fetchCampingById } from "@/lib/campingsRepo";
import {
  getCampingContextLocation,
  getCampingDisplayAddress,
  getCampingMapsUrl,
  getCampingPriceLabel,
} from "@/lib/campingPresentation";
import { Button, Card } from "@/components/ui";
import { InstagramIcon, ExternalLinkIcon } from "@/components/icons";

export default function CampingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [camping, setCamping] = useState<Camping | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState<string>("/campings/placeholder.jpg");

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

  useEffect(() => {
    if (!camping) {
      setImgSrc("/campings/placeholder.jpg");
      return;
    }
    const next =
      (camping.coverImageUrl?.trim() || "") ||
      `/campings/${camping.id}.jpg`;
    setImgSrc(next);
  }, [camping]);

  if (loading) return <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}><p>Cargando…</p></main>;
  if (error) return <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}><p style={{ color: "red" }}>{error}</p></main>;
  if (!camping) return <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}><p>Camping no encontrado.</p></main>;

  const contextLocation = getCampingContextLocation(camping);
  const displayAddress = getCampingDisplayAddress(camping);
  const mapsUrl = getCampingMapsUrl(camping);
  const hasMapsEmbed = Boolean(camping.mapsEmbedUrl?.trim());
  const hasLocationSection = Boolean(
    contextLocation || displayAddress || hasMapsEmbed || mapsUrl,
  );

  const serviciosLines = (() => {
    const raw = camping.serviciosTexto?.trim() ?? "";
    if (!raw) return [];
    return raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  })();
  const hasServiciosSection = serviciosLines.length > 0;

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      <img
        src={imgSrc}
        onError={() => setImgSrc("/campings/placeholder.jpg")}
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
              {camping.areaProtegida}
              {contextLocation ? ` · ${contextLocation}` : ""}
            </p>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ color: "var(--color-text-muted)" }}>
              <strong style={{ color: "var(--color-text)" }}>{getCampingPriceLabel(camping)}</strong>
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
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginTop: 24,
        }}
      >
        <Card>
          <div style={{ display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--color-accent)" }}>
              Información
            </h2>
            {camping.descripcionCorta?.trim() ? (
              <p style={{ margin: 0, color: "var(--color-text)", lineHeight: 1.6 }}>
                {camping.descripcionCorta.trim()}
              </p>
            ) : null}
            <p style={{ margin: camping.descripcionCorta?.trim() ? "8px 0 0 0" : 0, fontSize: 14, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
              {camping.inventoryMode === "unit_based" ? (
                <>
                  <strong>Nota:</strong> Este camping trabaja con disponibilidad por unidad real. Al reservar, el sistema te muestra las opciones disponibles para las fechas seleccionadas.
                </>
              ) : (
                <>
                  <strong>Nota:</strong> La disponibilidad de este camping se gestiona según capacidad para las fechas seleccionadas.
                </>
              )}
            </p>
          </div>
        </Card>

        {hasServiciosSection ? (
          <Card>
            <div style={{ display: "grid", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--color-accent)" }}>
                Servicios
              </h2>
              {serviciosLines.length > 1 ? (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 20,
                    color: "var(--color-text)",
                    lineHeight: 1.6,
                  }}
                >
                  {serviciosLines.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, color: "var(--color-text)", lineHeight: 1.6 }}>
                  {serviciosLines[0]}
                </p>
              )}
            </div>
          </Card>
        ) : null}

        {hasLocationSection ? (
          <Card>
            <div style={{ display: "grid", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--color-accent)" }}>
                Ubicación
              </h2>
              {contextLocation ? (
                <p style={{ margin: 0, color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                  {contextLocation}
                </p>
              ) : null}
              {displayAddress ? (
                <p style={{ margin: 0, color: "var(--color-text)", lineHeight: 1.6, fontWeight: 600 }}>
                  {displayAddress}
                </p>
              ) : null}
              {hasMapsEmbed ? (
                <div style={{ marginTop: displayAddress || contextLocation ? 4 : 0 }}>
                  <iframe
                    src={camping.mapsEmbedUrl}
                    width="100%"
                    height="360"
                    style={{ border: 0, borderRadius: 12 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                    title={`Mapa de ${camping.nombre}`}
                  />
                </div>
              ) : null}
              {mapsUrl && !hasMapsEmbed ? (
                <p style={{ margin: 0 }}>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--color-accent)", fontWeight: 600 }}
                  >
                    Ver en mapa
                  </a>
                </p>
              ) : null}
            </div>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
