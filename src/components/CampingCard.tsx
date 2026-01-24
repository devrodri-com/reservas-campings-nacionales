import Link from "next/link";
import type { Camping } from "@/types/camping";
import { Card, Button } from "@/components/ui";
import { formatArs } from "@/lib/money";

const DESCRIPCION_DEFAULT =
  "Camping organizado dentro del Parque Nacional, con parcelas delimitadas y servicios básicos.";

export default function CampingCard({ camping }: { camping: Camping }) {
  const descripcion = camping.descripcionCorta ?? DESCRIPCION_DEFAULT;
  const precio = formatArs(camping.precioNocheArs);

  return (
    <Card>
      <div style={{ display: "grid", gap: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--color-accent)" }}>
            {camping.nombre}
          </div>
          <p style={{ margin: "6px 0 0 0", fontSize: 14, color: "var(--color-text-muted)", lineHeight: 1.4 }}>
            {descripcion}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, color: "var(--color-text-muted)", fontSize: 14 }}>
          <span>👥 {camping.capacidadParcelas} parcelas</span>
          <span>💲 $ {precio} / noche</span>
          <span>📍 {camping.ubicacionTexto}</span>
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
              style={{ textDecoration: "none" }}
            >
              <Button variant="ghost">📷 Instagram</Button>
            </a>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
