"use client";

import type { Reserva } from "@/types/reserva";
import { Button, Table, Th, Td } from "@/components/ui";
import { enumerateNights, formatYmdToDmy } from "@/lib/dates";

export type AdminReservationTableRow = {
  reserva: Reserva;
  campingNombre: string;
  unitLabel: string;
  tipoUnidadLabel: string;
};

type BadgeTone = "green" | "yellow" | "red" | "gray" | "blue";

function SmallBadge(props: { text: string; tone: BadgeTone }) {
  const tones: Record<BadgeTone, { bg: string; border: string; color: string }> = {
    green: { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.35)", color: "rgb(22,101,52)" },
    yellow: { bg: "rgba(234,179,8,0.12)", border: "rgba(234,179,8,0.35)", color: "rgb(133,77,14)" },
    red: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.35)", color: "rgb(153,27,27)" },
    gray: { bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)", color: "rgb(51,65,85)" },
    blue: { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.35)", color: "rgb(30,64,175)" },
  };
  const t = tones[props.tone];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        border: `1px solid ${t.border}`,
        background: t.bg,
        color: t.color,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {props.text}
    </span>
  );
}

function estadoBadge(estado: string): { text: string; tone: BadgeTone } {
  switch (estado) {
    case "pagada":
      return { text: "Pagada", tone: "green" };
    case "pendiente_pago":
      return { text: "Pendiente", tone: "yellow" };
    case "fallida":
      return { text: "Fallida", tone: "red" };
    case "cancelada":
      return { text: "Cancelada", tone: "gray" };
    default:
      return { text: estado, tone: "gray" };
  }
}

function origenLabel(mode: string | undefined): { text: string; tone: BadgeTone } {
  if (mode === "admin") return { text: "Walk-in", tone: "blue" };
  if (mode === "public") return { text: "Web", tone: "gray" };
  return { text: mode || "—", tone: "gray" };
}

function unitChangeSecondaryBadge(
  s: Reserva["unitChangeAdjustmentStatus"]
): { text: string; tone: BadgeTone } | null {
  if (s === "pending_charge") return { text: "Cobro pendiente", tone: "yellow" };
  if (s === "pending_refund") return { text: "Devolución pendiente", tone: "yellow" };
  return null;
}

function shortReservaId(id: string): string {
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
}

type Props = {
  rows: AdminReservationTableRow[];
  busy: boolean;
  onOpenDetail: (r: Reserva) => void;
};

export default function AdminReservationsTable({ rows, busy, onOpenDetail }: Props) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Reserva</Th>
          <Th>Titular</Th>
          <Th>Camping</Th>
          <Th>Unidad</Th>
          <Th>Fechas</Th>
          <Th>Personas</Th>
          <Th>Total</Th>
          <Th>Estado</Th>
          <Th>Origen</Th>
          <Th>Acción</Th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={10}
              style={{
                padding: 16,
                textAlign: "center",
                color: "var(--color-text-muted)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              No hay reservas con los filtros actuales.
            </td>
          </tr>
        ) : (
          rows.map(({ reserva: r, campingNombre, unitLabel, tipoUnidadLabel }) => {
            const noches = enumerateNights(r.checkInDate, r.checkOutDate).length;
            const eb = estadoBadge(r.estado);
            const ob = origenLabel(r.createdByMode);
            const adj = unitChangeSecondaryBadge(r.unitChangeAdjustmentStatus);
            return (
              <tr key={r.id}>
                <Td>
                  <div style={{ fontWeight: 700 }}>{shortReservaId(r.id)}</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
                    {new Date(r.createdAtMs).toLocaleString("es-AR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </div>
                </Td>
                <Td>
                  <div style={{ fontWeight: 600 }}>{r.titularNombre}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{r.titularEmail}</div>
                </Td>
                <Td>{campingNombre}</Td>
                <Td>
                  <div>{unitLabel}</div>
                  {tipoUnidadLabel !== "—" ? (
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{tipoUnidadLabel}</div>
                  ) : null}
                </Td>
                <Td>
                  <div>
                    {formatYmdToDmy(r.checkInDate)} → {formatYmdToDmy(r.checkOutDate)}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{noches} noche(s)</div>
                </Td>
                <Td>
                  {r.adultos} / {r.menores}
                </Td>
                <Td>${r.montoTotalArs.toLocaleString("es-AR")}</Td>
                <Td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                    <SmallBadge text={eb.text} tone={eb.tone} />
                    {adj ? <SmallBadge text={adj.text} tone={adj.tone} /> : null}
                  </div>
                </Td>
                <Td>
                  <SmallBadge text={ob.text} tone={ob.tone} />
                </Td>
                <Td>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    style={{ padding: "6px 10px" }}
                    onClick={() => onOpenDetail(r)}
                  >
                    Ver detalle
                  </Button>
                </Td>
              </tr>
            );
          })
        )}
      </tbody>
    </Table>
  );
}
