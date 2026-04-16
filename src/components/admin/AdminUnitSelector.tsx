"use client";

import { useEffect, useMemo, useState } from "react";
import type { Unit } from "@/types/unit";
import type { UnitType } from "@/types/unitType";

type AdminUnitSelectorProps = {
  units: Unit[];
  unitTypes: UnitType[];
  selectedUnitId: string;
  onSelectUnit: (unitId: string) => void;
  disabled?: boolean;
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
    setExpandedGroups((prev) => {
      const next: Record<string, boolean> = {};
      for (const group of groups) {
        next[group.typeName] = prev[group.typeName] ?? false;
      }
      return next;
    });
  }, [groups]);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontWeight: 700 }}>Unidad</div>
      {groups.length === 0 ? (
        <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
          No hay unidades disponibles para seleccionar.
        </div>
      ) : (
        groups.map((group) => {
          const expanded = expandedGroups[group.typeName] ?? false;
          return (
            <div
              key={group.typeName}
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                overflow: "hidden",
                background: "var(--color-surface)",
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
                  background: "transparent",
                  padding: "10px 12px",
                  cursor: "pointer",
                  fontWeight: 700,
                  color: "var(--color-text)",
                }}
              >
                {expanded ? "▼" : "▶"} {group.typeName} ({group.rows.length})
              </button>

              {expanded ? (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "var(--color-bg)" }}>
                        <th style={{ textAlign: "left", padding: "8px 12px" }}>Unidad</th>
                        <th style={{ textAlign: "left", padding: "8px 12px" }}>Capacidad</th>
                        <th style={{ textAlign: "left", padding: "8px 12px" }}>Cobro</th>
                        <th style={{ textAlign: "left", padding: "8px 12px" }}>Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row) => {
                        const selected = row.id === selectedUnitId;
                        return (
                          <tr
                            key={row.id}
                            onClick={() => {
                              if (!disabled) onSelectUnit(row.id);
                            }}
                            style={{
                              cursor: disabled ? "not-allowed" : "pointer",
                              background: selected ? "rgba(37,99,235,0.08)" : "transparent",
                              outline: selected ? "1px solid rgba(37,99,235,0.5)" : "none",
                            }}
                          >
                            <td style={{ padding: "8px 12px", borderTop: "1px solid var(--color-border)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span>{row.displayName}</span>
                                {selected ? (
                                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-accent)" }}>
                                    Seleccionada
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td style={{ padding: "8px 12px", borderTop: "1px solid var(--color-border)" }}>
                              {row.capacityMax} personas
                            </td>
                            <td style={{ padding: "8px 12px", borderTop: "1px solid var(--color-border)" }}>
                              {row.pricingLabel}
                            </td>
                            <td style={{ padding: "8px 12px", borderTop: "1px solid var(--color-border)" }}>
                              {row.priceLabel}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}
