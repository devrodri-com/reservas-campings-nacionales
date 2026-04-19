"use client";

import { useEffect, useMemo, useState } from "react";
import type { UnitAvailabilityResult } from "@/lib/adminUnitReassignSupport";
import type { Unit } from "@/types/unit";
import type { UnitType } from "@/types/unitType";

const AVAILABILITY_LABEL: Record<
  Extract<UnitAvailabilityResult, { available: false }>["code"],
  string
> = {
  inactive: "Inactiva",
  operational: "No disponible (estado)",
  blocked: "Bloqueada",
  reserved: "Reservada",
};

function labelForAvailability(a: UnitAvailabilityResult | undefined): string | null {
  if (!a || a.available) return null;
  return AVAILABILITY_LABEL[a.code];
}

function isUnitSelectable(
  unitId: string,
  availabilityByUnitId: Record<string, UnitAvailabilityResult> | undefined
): boolean {
  if (availabilityByUnitId === undefined) return true;
  const a = availabilityByUnitId[unitId];
  return a?.available === true;
}

type AdminUnitSelectorProps = {
  units: Unit[];
  unitTypes: UnitType[];
  selectedUnitId: string;
  onSelectUnit: (unitId: string) => void;
  disabled?: boolean;
  /** Si se pasa, las unidades no disponibles en el rango se muestran deshabilitadas (p. ej. alta manual). */
  availabilityByUnitId?: Record<string, UnitAvailabilityResult>;
};

type UnitSelectorRow = {
  id: string;
  displayName: string;
  typeName: string;
  capacityMax: number;
  pricingLabel: string;
  priceLabel: string;
};

type UnitSelectorGroup = {
  typeName: string;
  rows: UnitSelectorRow[];
};

function rowFromUnit(unit: Unit, unitType: UnitType | undefined): UnitSelectorRow {
  const typeName = unitType?.name ?? "Tipo";
  const capacityMax = unitType?.capacityMax ?? 0;
  if (!unitType) {
    return {
      id: unit.id,
      displayName: unit.displayName,
      typeName,
      capacityMax,
      pricingLabel: "—",
      priceLabel: "Precio no disponible",
    };
  }

  if (unitType.pricingModel === "per_unit") {
    const price = typeof unitType.unitPriceArs === "number" ? unitType.unitPriceArs : null;
    return {
      id: unit.id,
      displayName: unit.displayName,
      typeName,
      capacityMax,
      pricingLabel: "Por unidad",
      priceLabel: price === null ? "Precio no disponible" : `$${price.toLocaleString("es-AR")}/noche`,
    };
  }

  const adultPrice = typeof unitType.adultPriceArs === "number" ? unitType.adultPriceArs : null;
  const childPrice = typeof unitType.childPriceArs === "number" ? unitType.childPriceArs : null;
  return {
    id: unit.id,
    displayName: unit.displayName,
    typeName,
    capacityMax,
    pricingLabel: "Por persona",
    priceLabel:
      adultPrice === null || childPrice === null
        ? "Precio no disponible"
        : `Adulto $${adultPrice.toLocaleString("es-AR")} / Menor $${childPrice.toLocaleString("es-AR")}`,
  };
}

export default function AdminUnitSelector({
  units,
  unitTypes,
  selectedUnitId,
  onSelectUnit,
  disabled = false,
  availabilityByUnitId,
}: AdminUnitSelectorProps) {
  const unitTypesById = useMemo(() => {
    const map = new Map<string, UnitType>();
    unitTypes.forEach((t) => map.set(t.id, t));
    return map;
  }, [unitTypes]);

  const groups = useMemo<UnitSelectorGroup[]>(() => {
    const grouped = new Map<string, UnitSelectorRow[]>();
    units.forEach((unit) => {
      const row = rowFromUnit(unit, unitTypesById.get(unit.unitTypeId));
      const bucket = grouped.get(row.typeName);
      if (bucket) {
        bucket.push(row);
      } else {
        grouped.set(row.typeName, [row]);
      }
    });
    return Array.from(grouped.entries()).map(([typeName, rows]) => ({ typeName, rows }));
  }, [units, unitTypesById]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- acordeón alineado a grupos y expansión si hay selección */
    setExpandedGroups((prev) => {
      const next: Record<string, boolean> = {};
      for (const group of groups) {
        next[group.typeName] = prev[group.typeName] ?? false;
      }
      if (selectedUnitId) {
        const containing = groups.find((g) => g.rows.some((r) => r.id === selectedUnitId));
        if (containing) {
          next[containing.typeName] = true;
        }
      }
      return next;
    });
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [groups, selectedUnitId]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: 14, color: "var(--color-text)" }}>Elegí una unidad</div>
        <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4, lineHeight: 1.45 }}>
          Agrupadas por tipo. Tocá para expandir y elegir la unidad correspondiente.
          {availabilityByUnitId ? (
            <span>
              {" "}
              Las que no están libres para las fechas elegidas aparecen deshabilitadas.
            </span>
          ) : null}
        </div>
      </div>
      {groups.length === 0 ? (
        <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
          No hay unidades disponibles para seleccionar.
        </div>
      ) : (
        groups.map((group) => {
          const expanded = expandedGroups[group.typeName] ?? false;
          const hasSelectionHere = group.rows.some(
            (r) =>
              r.id === selectedUnitId &&
              isUnitSelectable(r.id, availabilityByUnitId)
          );
          return (
            <div
              key={group.typeName}
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                overflow: "hidden",
                background: "var(--color-surface)",
                boxShadow: expanded
                  ? "0 1px 0 color-mix(in srgb, var(--color-accent) 25%, transparent)"
                  : "none",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedGroups((prev) => ({
                    ...prev,
                    [group.typeName]: !expanded,
                  }))
                }
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  borderBottom: expanded ? "1px solid var(--color-border)" : "none",
                  background: expanded
                    ? "color-mix(in srgb, var(--color-accent) 8%, var(--color-surface))"
                    : "transparent",
                  padding: "12px 14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  color: "var(--color-text)",
                }}
              >
                <span style={{ fontWeight: 800, fontSize: 14 }}>
                  <span aria-hidden style={{ marginRight: 8, opacity: 0.75 }}>
                    {expanded ? "▼" : "▶"}
                  </span>
                  {group.typeName}
                  <span style={{ fontWeight: 600, color: "var(--color-text-muted)", marginLeft: 6 }}>
                    ({group.rows.length})
                  </span>
                </span>
                {hasSelectionHere ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "var(--color-accent)",
                      flexShrink: 0,
                    }}
                  >
                    Con selección
                  </span>
                ) : null}
              </button>

              {expanded ? (
                <div
                  role="listbox"
                  aria-label={`Unidades tipo ${group.typeName}`}
                  style={{ padding: "6px 0" }}
                >
                  {group.rows.map((row, idx) => {
                    const rowSelectable = isUnitSelectable(row.id, availabilityByUnitId);
                    const avail = availabilityByUnitId?.[row.id];
                    const blockedLabel = labelForAvailability(avail);
                    const selected = row.id === selectedUnitId && rowSelectable;
                    const rowDisabled = disabled || !rowSelectable;
                    return (
                      <button
                        key={row.id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        aria-disabled={rowDisabled}
                        disabled={rowDisabled}
                        onClick={() => {
                          if (!rowDisabled) onSelectUnit(row.id);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          border: "none",
                          borderTop:
                            idx === 0
                              ? "none"
                              : "1px solid color-mix(in srgb, var(--color-border) 85%, transparent)",
                          margin: 0,
                          padding: "12px 14px",
                          cursor: rowDisabled ? "not-allowed" : "pointer",
                          opacity: rowDisabled ? 0.72 : 1,
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1fr) auto",
                          gap: "10px 12px",
                          alignItems: "start",
                          background: selected
                            ? "color-mix(in srgb, var(--color-accent) 12%, var(--color-surface))"
                            : !rowSelectable
                              ? "color-mix(in srgb, var(--color-text-muted) 6%, var(--color-surface))"
                              : "var(--color-surface)",
                          boxShadow:
                            selected && rowSelectable
                              ? "inset 3px 0 0 var(--color-accent)"
                              : !rowSelectable
                                ? "inset 3px 0 0 color-mix(in srgb, var(--color-text-muted) 45%, transparent)"
                                : "none",
                          color: "var(--color-text)",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              alignItems: "center",
                              gap: 8,
                              fontWeight: 800,
                              fontSize: 14,
                              lineHeight: 1.3,
                            }}
                          >
                            <span>{row.displayName}</span>
                            {selected ? (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  letterSpacing: "0.06em",
                                  textTransform: "uppercase",
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                  border: "1px solid color-mix(in srgb, var(--color-accent) 45%, var(--color-border))",
                                  background: "color-mix(in srgb, var(--color-accent) 14%, var(--color-surface))",
                                  color: "var(--color-accent)",
                                }}
                              >
                                Seleccionada
                              </span>
                            ) : null}
                            {!rowSelectable && blockedLabel ? (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  letterSpacing: "0.05em",
                                  textTransform: "uppercase",
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                  border: "1px solid color-mix(in srgb, var(--color-text-muted) 40%, var(--color-border))",
                                  background: "color-mix(in srgb, var(--color-text-muted) 12%, var(--color-surface))",
                                  color: "var(--color-text-muted)",
                                }}
                              >
                                {blockedLabel}
                              </span>
                            ) : null}
                          </div>
                          <div
                            style={{
                              marginTop: 6,
                              fontSize: 12,
                              color: "var(--color-text-muted)",
                              lineHeight: 1.4,
                            }}
                          >
                            {rowSelectable ? (
                              <>
                                <span style={{ fontWeight: 600 }}>{row.pricingLabel}</span>
                                {" · "}
                                {row.priceLabel}
                              </>
                            ) : (
                              <span style={{ fontStyle: "italic" }}>No disponible para las fechas elegidas</span>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "var(--color-text-muted)",
                            textAlign: "right",
                            whiteSpace: "nowrap",
                            paddingTop: 2,
                          }}
                        >
                          {rowSelectable ? `Hasta ${row.capacityMax} pers.` : "—"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}
