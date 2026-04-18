"use client";

import { useMemo } from "react";

/** Umbral: más unidades que esto → grilla compacta; igual o menos → lista con más detalle. */
export const UNIT_SELECTION_MANY_UNITS_THRESHOLD = 12;

export type UnitSelectionItem = {
  unitId: string;
  label: string;
  available: boolean;
  selected: boolean;
  /** Línea secundaria (capacidad / tarifa o motivo de no disponible). */
  detailLine: string | null;
  /** Resumen de precio cuando aplica. */
  priceHint: string | null;
};

type UnitSelectionGridProps = {
  items: UnitSelectionItem[];
  variant: "compact-grid" | "detailed-list";
  onSelectUnit: (unitId: string) => void;
  disabled?: boolean;
};

export default function UnitSelectionGrid({
  items,
  variant,
  onSelectUnit,
  disabled = false,
}: UnitSelectionGridProps) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.label.localeCompare(b.label, "es", { numeric: true })),
    [items]
  );

  if (sorted.length === 0) return null;

  if (variant === "compact-grid") {
    return (
      <div className="unit-selection-wrap">
        <p className="unit-selection-wrap__title">Elegí tu unidad</p>
        <div
          className="unit-selection-grid"
          role="group"
          aria-label="Unidades disponibles, vista compacta"
        >
          {sorted.map((item) => (
            <button
              key={item.unitId}
              type="button"
              className={
                "unit-selection-grid__cell" +
                (item.selected ? " unit-selection-grid__cell--selected" : "") +
                (!item.available ? " unit-selection-grid__cell--disabled" : "")
              }
              disabled={disabled || !item.available}
              aria-pressed={item.selected}
              title={
                item.available
                  ? item.label
                  : `${item.label}: no disponible para estas fechas`
              }
              onClick={() => {
                if (item.available && !disabled) onSelectUnit(item.unitId);
              }}
            >
              <span className="unit-selection-grid__label">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="unit-selection-wrap">
      <p className="unit-selection-wrap__title">Elegí tu unidad</p>
      <ul className="unit-selection-list" aria-label="Unidades disponibles, vista detallada">
        {sorted.map((item) => (
          <li key={item.unitId}>
            <button
              type="button"
              className={
                "unit-selection-list__btn" +
                (item.selected ? " unit-selection-list__btn--selected" : "") +
                (!item.available ? " unit-selection-list__btn--disabled" : "")
              }
              disabled={disabled || !item.available}
              aria-pressed={item.selected}
              onClick={() => {
                if (item.available && !disabled) onSelectUnit(item.unitId);
              }}
            >
              <span className="unit-selection-list__main">
                <span className="unit-selection-list__name">{item.label}</span>
                {item.detailLine ? (
                  <span className="unit-selection-list__detail">{item.detailLine}</span>
                ) : null}
              </span>
              <span className="unit-selection-list__aside">
                {!item.available ? (
                  <span className="unit-selection-list__state">No disponible</span>
                ) : item.priceHint ? (
                  <span className="unit-selection-list__price">{item.priceHint}</span>
                ) : item.selected ? (
                  <span className="unit-selection-list__state unit-selection-list__state--ok">
                    Elegida
                  </span>
                ) : (
                  <span className="unit-selection-list__state unit-selection-list__state--ok">
                    Elegir
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
