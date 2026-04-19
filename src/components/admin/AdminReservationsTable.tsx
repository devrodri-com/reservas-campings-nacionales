"use client";

import type { CSSProperties } from "react";
import type { Reserva } from "@/types/reserva";
import { Button } from "@/components/ui";
import { enumerateNights, formatYmdToDmy } from "@/lib/dates";

export type AdminReservationTableRow = {
  reserva: Reserva;
  campingNombre: string;
  unitLabel: string;
  tipoUnidadLabel: string;
};

type BadgeTone = "green" | "yellow" | "red" | "gray" | "blue" | "refund_pending";

function SmallBadge(props: { text: string; tone: BadgeTone; compact?: boolean }) {
  const tones: Record<BadgeTone, { bg: string; border: string; color: string }> = {
    green: { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.35)", color: "rgb(22,101,52)" },
    yellow: { bg: "rgba(234,179,8,0.2)", border: "rgba(234,179,8,0.5)", color: "rgb(113,63,18)" },
    red: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.35)", color: "rgb(153,27,27)" },
    gray: {
      bg: "color-mix(in srgb, var(--color-text-muted) 22%, var(--color-surface))",
      border: "color-mix(in srgb, var(--color-text-muted) 45%, var(--color-border))",
      color: "var(--color-text)",
    },
    blue: {
      bg: "var(--admin-badge-blue-bg)",
      border: "var(--admin-badge-blue-border)",
      color: "var(--admin-badge-blue-fg)",
    },
    // Contraste reforzado para estado crítico de devolución pendiente en modo oscuro.
    refund_pending: {
      bg: "color-mix(in srgb, rgb(245, 158, 11) 26%, var(--color-surface))",
      border: "color-mix(in srgb, rgb(245, 158, 11) 52%, var(--color-border))",
      color: "color-mix(in srgb, rgb(120, 53, 15) 28%, var(--color-text))",
    },
  };
  const t = tones[props.tone];
  const compact = Boolean(props.compact);
  return (
    <span
      style={{
        display: "inline-block",
        padding: compact ? "2px 6px" : "3px 9px",
        borderRadius: 999,
        border: `1px solid ${t.border}`,
        background: t.bg,
        color: t.color,
        fontSize: compact ? 10 : 11,
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
  if (mode === "admin") return { text: "Manual", tone: "blue" };
  if (mode === "public") return { text: "Web", tone: "gray" };
  return { text: mode || "—", tone: "gray" };
}

function unitChangeSecondaryBadge(
  s: Reserva["unitChangeAdjustmentStatus"]
): { text: string; tone: BadgeTone } | null {
  if (s === "pending_charge") return { text: "Cobro pendiente", tone: "yellow" };
  if (s === "pending_refund") return { text: "Devolución pendiente", tone: "refund_pending" };
  return null;
}

/** Un solo contenedor de scroll horizontal (mismo patrón que `Table` en ui.tsx), sin padding lateral que recorte celdas. */
const tableScroller: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  overflowX: "auto",
  overflowY: "visible",
  WebkitOverflowScrolling: "touch",
  overscrollBehaviorX: "contain",
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius)",
  boxShadow: "var(--shadow-sm)",
};

const thBase: CSSProperties = {
  textAlign: "left",
  borderBottomWidth: 2,
  borderBottomStyle: "solid",
  borderBottomColor: "var(--color-border)",
  color: "var(--color-text-muted)",
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  background: "color-mix(in srgb, var(--color-accent) 7%, var(--color-surface))",
  verticalAlign: "bottom",
};

const tdBase: CSSProperties = {
  borderBottomWidth: 1,
  borderBottomStyle: "solid",
  borderBottomColor: "var(--color-border)",
  color: "var(--color-text)",
  verticalAlign: "top",
  lineHeight: 1.45,
};

const padAir = "14px 14px";
const padTight = "12px 8px";

const secondaryText: CSSProperties = {
  fontSize: 12,
  color: "var(--color-text-muted)",
  marginTop: 4,
};

type Props = {
  rows: AdminReservationTableRow[];
  busy: boolean;
  onOpenDetail: (r: Reserva) => void;
  /** Si es falso, no se muestra email del titular (roles viewer / viewer_global). */
  showTitularContact?: boolean;
};

export default function AdminReservationsTable({
  rows,
  busy,
  onOpenDetail,
  showTitularContact = true,
}: Props) {
  return (
    <div style={tableScroller}>
      <table
        style={{
          width: "100%",
          minWidth: 920,
          borderCollapse: "collapse",
          tableLayout: "auto",
        }}
      >
        <thead>
          <tr>
            <th style={{ ...thBase, padding: padAir, minWidth: 188 }}>Titular</th>
            <th style={{ ...thBase, padding: padAir, minWidth: 140 }}>Camping</th>
            <th style={{ ...thBase, padding: padAir, minWidth: 140 }}>Unidad</th>
            <th style={{ ...thBase, padding: padAir, minWidth: 150 }}>Fechas</th>
            <th style={{ ...thBase, padding: padTight, minWidth: 76 }}>Personas</th>
            <th style={{ ...thBase, padding: padTight, minWidth: 100 }}>Total</th>
            <th style={{ ...thBase, padding: padTight, minWidth: 96 }}>Estado</th>
            <th style={{ ...thBase, padding: padTight, minWidth: 84 }}>Origen</th>
            <th style={{ ...thBase, padding: padTight, minWidth: 104 }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={9}
                style={{
                  ...tdBase,
                  padding: 28,
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                  fontSize: 14,
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
                  <td style={{ ...tdBase, padding: padAir }}>
                    <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.35 }}>{r.titularNombre}</div>
                    {showTitularContact ? (
                      <div style={{ ...secondaryText, wordBreak: "break-word", lineHeight: 1.4 }}>
                        {r.titularEmail}
                      </div>
                    ) : null}
                  </td>
                  <td style={{ ...tdBase, padding: padAir }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text)", lineHeight: 1.35 }}>
                      {campingNombre}
                    </div>
                  </td>
                  <td style={{ ...tdBase, padding: padAir }}>
                    <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.35 }}>{unitLabel}</div>
                    {tipoUnidadLabel !== "—" ? (
                      <div style={{ ...secondaryText, lineHeight: 1.35 }}>{tipoUnidadLabel}</div>
                    ) : null}
                  </td>
                  <td style={{ ...tdBase, padding: padAir }}>
                    <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.4 }}>
                      {formatYmdToDmy(r.checkInDate)}
                      {"\u00A0→\u00A0"}
                      {formatYmdToDmy(r.checkOutDate)}
                    </div>
                    <div style={secondaryText}>{noches} noche(s)</div>
                  </td>
                  <td style={{ ...tdBase, padding: padTight }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>
                      {r.adultos} / {r.menores}
                    </span>
                  </td>
                  <td style={{ ...tdBase, padding: padTight }}>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        fontVariantNumeric: "tabular-nums",
                        color: "var(--color-text)",
                      }}
                    >
                      ${r.montoTotalArs.toLocaleString("es-AR")}
                    </span>
                  </td>
                  <td style={{ ...tdBase, padding: padTight }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                      <SmallBadge text={eb.text} tone={eb.tone} compact />
                      {adj ? <SmallBadge text={adj.text} tone={adj.tone} compact /> : null}
                    </div>
                  </td>
                  <td style={{ ...tdBase, padding: padTight }}>
                    <SmallBadge text={ob.text} tone={ob.tone} compact />
                  </td>
                  <td style={{ ...tdBase, padding: padTight, whiteSpace: "nowrap" }}>
                    <Button
                      variant="secondary"
                      disabled={busy}
                      style={{ padding: "6px 10px", fontSize: 12, fontWeight: 600 }}
                      onClick={() => onOpenDetail(r)}
                    >
                      Ver detalle
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
