import Link from "next/link";
import type { Camping } from "@/types/camping";
import { Card, Button } from "@/components/ui";
import { formatArs } from "@/lib/money";

export default function CampingCard({ camping }: { camping: Camping }) {
  return (
    <Card>
      <div style={{ display: "grid", gap: 8 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--color-accent)" }}>
            {camping.nombre}
          </div>
          <div style={{ color: "var(--color-text-muted)" }}>
            {camping.areaProtegida} · {camping.ubicacionTexto}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span style={{ color: "var(--color-text-muted)" }}>
            <strong style={{ color: "var(--color-text)" }}>{camping.capacidadParcelas}</strong>{" "}
            parcelas
          </span>
          <span style={{ color: "var(--color-text-muted)" }}>
            <strong style={{ color: "var(--color-text)" }}>${formatArs(camping.precioNocheArs)}</strong>{" "}
            / noche / parcela
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Link href={`/reservar?campingId=${encodeURIComponent(camping.id)}`} style={{ textDecoration: "none" }}>
            <Button variant="primary">Reservar</Button>
          </Link>
          <Link href={`/campings/${camping.id}`} style={{ textDecoration: "none" }}>
            <Button variant="ghost">Ver detalles</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
