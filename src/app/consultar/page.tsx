"use client";

import { useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Reserva, ReservaEstado } from "@/types/reserva";
import { Card, Button } from "@/components/ui";
import { formatArs } from "@/lib/money";
import { formatYmdToDmy } from "@/lib/dates";

type ReservaDoc = Omit<Reserva, "id">;

function isReservaEstado(v: unknown): v is ReservaEstado {
  return v === "confirmada" || v === "cancelada";
}

function isReservaDoc(v: unknown): v is ReservaDoc {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;

  return (
    typeof o.campingId === "string" &&
    typeof o.checkInDate === "string" &&
    typeof o.checkOutDate === "string" &&
    typeof o.parcelas === "number" &&
    typeof o.adultos === "number" &&
    typeof o.menores === "number" &&
    typeof o.titularNombre === "string" &&
    typeof o.titularEmail === "string" &&
    typeof o.titularTelefono === "string" &&
    typeof o.titularEdad === "number" &&
    isReservaEstado(o.estado) &&
    typeof o.montoTotalArs === "number" &&
    typeof o.createdAtMs === "number" &&
    // Auditoría opcional
    (o.createdByUid === undefined || typeof o.createdByUid === "string") &&
    (o.createdByMode === undefined || o.createdByMode === "public" || o.createdByMode === "admin")
  );
}

export default function ConsultarReservaPage() {
  const [codigo, setCodigo] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reserva, setReserva] = useState<Reserva | null>(null);

  const onConsultar = async () => {
    const id = codigo.trim();
    setError(null);
    setReserva(null);

    if (!id) {
      setError("Ingresá el código de reserva.");
      return;
    }

    setLoading(true);
    try {
      const snap = await getDoc(doc(db, "reservas", id));
      if (!snap.exists()) {
        setError("Reserva no encontrada. Verificá el código.");
        return;
      }
      const data = snap.data();
      if (!isReservaDoc(data)) {
        setError("La reserva existe, pero no tiene el formato esperado.");
        return;
      }
      setReserva({ id: snap.id, ...data });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ margin: "0 0 12px 0", color: "var(--color-accent)" }}>
        Consultar reserva
      </h1>
      <p style={{ marginTop: 0, color: "var(--color-text-muted)" }}>
        Ingresá el código de tu reserva para ver su estado.
      </p>

      <Card>
        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700 }}>Código de reserva</span>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej: a1b2c3d4..."
              style={{
                width: "100%",
                padding: 10,
                border: "1px solid var(--color-border)",
                borderRadius: 10,
                background: "var(--color-surface)",
                color: "var(--color-text)",
              }}
              autoComplete="off"
            />
          </label>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="primary" onClick={onConsultar} disabled={loading}>
              {loading ? "Consultando..." : "Consultar"}
            </Button>

            <Link href="/reservar" style={{ textDecoration: "none" }}>
              <Button variant="secondary">Hacer una reserva</Button>
            </Link>
          </div>

          {error ? <p style={{ color: "red", margin: 0 }}>{error}</p> : null}
        </div>
      </Card>

      {reserva ? (
        <div style={{ marginTop: 16 }}>
          <Card title="Detalle de la reserva">
            <div style={{ display: "grid", gap: 8 }}>
              <p style={{ margin: 0 }}>
                <strong>Estado:</strong> {reserva.estado}
              </p>

              <p style={{ margin: 0 }}>
                <strong>Fechas:</strong>{" "}
                {formatYmdToDmy(reserva.checkInDate)} →{" "}
                {formatYmdToDmy(reserva.checkOutDate)}
              </p>

              <p style={{ margin: 0 }}>
                <strong>Parcelas:</strong> {reserva.parcelas}
              </p>

              <p style={{ margin: 0 }}>
                <strong>Personas:</strong> {reserva.adultos} adultos /{" "}
                {reserva.menores} menores
              </p>

              <p style={{ margin: 0 }}>
                <strong>Total:</strong> ${formatArs(reserva.montoTotalArs)}
              </p>

              <p style={{ margin: "8px 0 0 0", color: "var(--color-text-muted)" }}>
                La asignación de parcela se realiza en recepción al momento del check-in.
              </p>
            </div>
          </Card>
        </div>
      ) : null}
    </main>
  );
}
