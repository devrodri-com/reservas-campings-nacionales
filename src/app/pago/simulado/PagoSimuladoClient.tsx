"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Card, Button } from "@/components/ui";

export default function PagoSimuladoClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const reservaId = sp.get("reservaId") ?? "";

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ margin: "0 0 12px 0", color: "var(--color-accent)" }}>
        Pago simulado (demo)
      </h1>

      <Card>
        <p style={{ marginTop: 0, color: "var(--color-text-muted)" }}>
          Esta pantalla simula el checkout de Mercado Pago. En producción, el usuario pagará en Mercado Pago y volverá al sistema.
        </p>

        <p style={{ margin: 0 }}>
          <strong>Reserva:</strong> {reservaId || "(sin id)"}
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <Button
            variant="primary"
            onClick={() => router.push(`/reserva/confirmada/${encodeURIComponent(reservaId)}?paid=1`)}
            disabled={!reservaId}
          >
            Simular pago aprobado
          </Button>

          <Button
            variant="secondary"
            onClick={() => router.push(`/reserva/confirmada/${encodeURIComponent(reservaId)}?paid=0`)}
            disabled={!reservaId}
          >
            Volver sin pagar
          </Button>
        </div>
      </Card>
    </main>
  );
}
