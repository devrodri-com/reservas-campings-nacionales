"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Camping } from "@/types/camping";
import { Card, Button } from "@/components/ui";
import {
  getCampingCapacityLabel,
  getCampingDisplayAddress,
  getCampingPriceLabel,
} from "@/lib/campingPresentation";
import { UsersIcon, TagIcon, MapPinIcon, InstagramIcon } from "@/components/icons";

const DESCRIPCION_DEFAULT =
  "Camping organizado dentro del Parque Nacional, con parcelas delimitadas y servicios básicos.";

function IconRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, color: "var(--color-text-muted)" }}>
      <span style={{ flex: "0 0 auto", color: "var(--color-accent)" }}>{icon}</span>
      <span
        style={{
          minWidth: 0,
          overflowWrap: "anywhere",
          wordBreak: "break-word",
        }}
      >
        {text}
      </span>
    </div>
  );
}

export default function CampingCard({ camping }: { camping: Camping }) {
  const descripcion = camping.descripcionCorta ?? DESCRIPCION_DEFAULT;
  const [imgSrc, setImgSrc] = useState<string>(
    (camping.coverImageUrl?.trim() || "") || `/campings/${camping.id}.jpg` || "/campings/placeholder.jpg"
  );

  const displayAddress = getCampingDisplayAddress(camping) ?? "Ubicación a confirmar";

  return (
    <Card>
      <img
        src={imgSrc}
        onError={() => setImgSrc("/campings/placeholder.jpg")}
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
          <p
            style={{
              margin: "6px 0 0 0",
              fontSize: 14,
              color: "var(--color-text-muted)",
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {descripcion}
          </p>
        </div>

        <div style={{ display: "grid", gap: 6, marginTop: 6, fontSize: 14 }}>
          <IconRow icon={<UsersIcon title="Capacidad" />} text={getCampingCapacityLabel(camping)} />
          <IconRow icon={<TagIcon title="Precio" />} text={getCampingPriceLabel(camping)} />
          <IconRow icon={<MapPinIcon title="Ubicación" />} text={displayAddress} />
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 12,
            marginTop: 10,
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href={`/reservar?campingId=${encodeURIComponent(camping.id)}`} style={{ textDecoration: "none" }}>
              <Button variant="primary">Reservar</Button>
            </Link>
            <Link href={`/campings/${camping.id}`} style={{ textDecoration: "none" }}>
              <Button variant="ghost">Ver detalles</Button>
            </Link>
          </div>
          {camping.igUrl ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
