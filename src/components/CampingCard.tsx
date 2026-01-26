import React from "react";
import Link from "next/link";
import type { Camping } from "@/types/camping";
import { Card, Button } from "@/components/ui";
import { formatArs } from "@/lib/money";
import { UsersIcon, TagIcon, MapPinIcon, InstagramIcon } from "@/components/icons";

const DESCRIPCION_DEFAULT =
  "Camping organizado dentro del Parque Nacional, con parcelas delimitadas y servicios básicos.";

function IconRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-muted)" }}>
      <span style={{ color: "var(--color-accent)" }}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

export default function CampingCard({ camping }: { camping: Camping }) {
  const descripcion = camping.descripcionCorta ?? DESCRIPCION_DEFAULT;
  const imageUrl = (camping.coverImageUrl?.trim() || "") || "/campings/placeholder.jpg";

  return (
    <Card>
      <img
        src={imageUrl}
        alt={`Imagen de ${camping.nombre}`}
        style={{
          width: "100%",
          height: 160,
          objectFit: "cover",
          borderRadius: 8,
        }}
      />
      <div style={{ display: "grid", gap: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--color-accent)" }}>
            {camping.nombre}
          </div>
          <p style={{ margin: "6px 0 0 0", fontSize: 14, color: "var(--color-text-muted)", lineHeight: 1.4 }}>
            {descripcion}
          </p>
        </div>

        <div style={{ display: "grid", gap: 6, marginTop: 6, fontSize: 14 }}>
          <IconRow
            icon={<UsersIcon title="Capacidad" />}
            text={`${camping.capacidadParcelas} parcelas`}
          />
          <IconRow
            icon={<TagIcon title="Precio" />}
            text={`$${formatArs(camping.precioNocheArs)} / noche / parcela`}
          />
          <IconRow
            icon={<MapPinIcon title="Ubicación" />}
            text={camping.ubicacionTexto}
          />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
          <Link href={`/reservar?campingId=${encodeURIComponent(camping.id)}`} style={{ textDecoration: "none" }}>
            <Button variant="primary">Reservar</Button>
          </Link>
          <Link href={`/campings/${camping.id}`} style={{ textDecoration: "none" }}>
            <Button variant="ghost">Ver detalles</Button>
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
        </div>
      </div>
    </Card>
  );
}
