"use client";

import type { CSSProperties } from "react";

export type CampingEditorTab = "data" | "unitTypes" | "units";

type TabDef = { id: CampingEditorTab; label: string; hint: string };

type Props = {
  active: CampingEditorTab;
  onChange: (tab: CampingEditorTab) => void;
  inventoryUnitBased: boolean;
};

const nav: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginBottom: 12,
  padding: 6,
  borderRadius: 10,
  border: "1px solid var(--color-border)",
  background: "color-mix(in srgb, var(--color-border) 10%, var(--color-surface))",
};

const tabBtn = (active: boolean): CSSProperties => ({
  flex: "1 1 118px",
  minWidth: 0,
  textAlign: "left",
  cursor: "pointer",
  borderRadius: 8,
  border: active ? "1px solid var(--color-accent)" : "1px solid transparent",
  background: active
    ? "color-mix(in srgb, var(--color-accent) 14%, var(--color-surface))"
    : "transparent",
  color: "var(--color-text)",
  font: "inherit",
  padding: "7px 10px",
  display: "grid",
  gap: 1,
  transition: "border-color 0.12s ease, background 0.12s ease",
});

const tabLabel: CSSProperties = {
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: "-0.01em",
};

const tabHint: CSSProperties = {
  fontSize: 11,
  color: "var(--color-text-muted)",
  lineHeight: 1.3,
};

export default function AdminCampingSectionNav({ active, onChange, inventoryUnitBased }: Props) {
  const tabs: TabDef[] = inventoryUnitBased
    ? [
        { id: "data", label: "Datos", hint: "Ficha pública, mapas y políticas" },
        { id: "unitTypes", label: "Tipos de unidad", hint: "Categorías base del inventario" },
        { id: "units", label: "Unidades", hint: "Parcelas, cabañas y carga en lote" },
      ]
    : [{ id: "data", label: "Datos", hint: "Ficha pública, mapas y políticas" }];

  return (
    <nav aria-label="Secciones del camping" style={nav}>
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            aria-current={isActive ? "true" : undefined}
            onClick={() => onChange(t.id)}
            style={tabBtn(isActive)}
          >
            <span style={tabLabel}>{t.label}</span>
            <span style={tabHint}>{t.hint}</span>
          </button>
        );
      })}
    </nav>
  );
}
