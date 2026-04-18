"use client";

import type { CSSProperties } from "react";

export type SelectedUnitSummaryRow = {
  displayName: string;
  typeName: string;
  capacityMax: number;
  pricingKind: "per_unit" | "per_person" | "unknown";
  priceLinePrimary: string;
  priceLineSecondary: string | null;
};

type SelectedUnitSummaryProps = {
  row: SelectedUnitSummaryRow;
};

const stepKicker: CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--color-accent)",
};

const blockTitle: CSSProperties = {
  margin: 0,
  marginTop: 2,
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: "-0.02em",
  color: "var(--color-text)",
};

export default function SelectedUnitSummary({ row }: SelectedUnitSummaryProps) {
  const pricingLine =
    row.pricingKind === "per_unit" && row.priceLinePrimary
      ? `Por unidad · ${row.priceLinePrimary}`
      : row.pricingKind === "per_person" && row.priceLinePrimary && row.priceLineSecondary
        ? `Por persona · ${row.priceLinePrimary} · ${row.priceLineSecondary}`
        : row.priceLinePrimary || "Precio no disponible";

  return (
    <div className="selected-unit-summary">
      <div className="selected-unit-summary__header">
        <div style={{ minWidth: 0 }}>
          <p style={stepKicker}>Tu alojamiento</p>
          <h3 style={blockTitle}>{row.displayName}</h3>
        </div>
        <span className="selected-unit-summary__badge">Tu elección</span>
      </div>
      <div className="selected-unit-summary__body">
        <div style={{ fontSize: 14, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
          <strong style={{ color: "var(--color-text)" }}>{row.typeName}</strong>
          {" · "}
          capacidad hasta {row.capacityMax} personas
        </div>
        <div style={{ fontSize: 14, color: "var(--color-text)", lineHeight: 1.55, fontWeight: 600 }}>
          {pricingLine}
        </div>
      </div>
    </div>
  );
}
