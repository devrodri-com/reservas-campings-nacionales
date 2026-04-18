"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui";
import type { Unit } from "@/types/unit";
import type { UnitType } from "@/types/unitType";

export type AdminCampingUnitsListProps = {
  units: Unit[];
  unitTypes: UnitType[];
  editingUnitId: string;
  saving: boolean;

  editUnitDisplayName: string;
  onEditUnitDisplayNameChange: (value: string) => void;
  editUnitNumber: string;
  onEditUnitNumberChange: (value: string) => void;
  editUnitSector: string;
  onEditUnitSectorChange: (value: string) => void;
  editUnitPriceOverride: string;
  onEditUnitPriceOverrideChange: (value: string) => void;

  onStartEditUnit: (unit: Unit) => void;
  onSaveEditUnit: () => void;
  onCancelEditUnit: () => void;

  operationalStatusLabel: (status: Unit["operationalStatus"]) => string;
  inputStyle: CSSProperties;
};

type UnitGroup = {
  typeName: string;
  units: Unit[];
};

function compareUnitsByNumberNatural(a: Unit, b: Unit): number {
  const byNum = a.number.localeCompare(b.number, "es", { numeric: true, sensitivity: "base" });
  if (byNum !== 0) return byNum;
  return a.displayName.localeCompare(b.displayName, "es", { numeric: true, sensitivity: "base" });
}

/** Grupos con más unidades que esto inician colapsados; el resto abiertos. */
const ADMIN_UNITS_GROUP_EXPAND_FEW_THRESHOLD = 12;

export default function AdminCampingUnitsList(props: AdminCampingUnitsListProps) {
  const unitTypeNameById = useMemo(() => {
    const m = new Map<string, string>();
    props.unitTypes.forEach((t) => m.set(t.id, t.name));
    return m;
  }, [props.unitTypes]);

  const groups = useMemo<UnitGroup[]>(() => {
    const map = new Map<string, Unit[]>();
    for (const u of props.units) {
      const typeName = unitTypeNameById.get(u.unitTypeId) ?? "Tipo desconocido";
      const bucket = map.get(typeName);
      if (bucket) bucket.push(u);
      else map.set(typeName, [u]);
    }
    return Array.from(map.entries())
      .map(([typeName, list]) => ({
        typeName,
        units: [...list].sort(compareUnitsByNumberNatural),
      }))
      .sort((a, b) => a.typeName.localeCompare(b.typeName, "es"));
  }, [props.units, unitTypeNameById]);

  /** Si existe clave, reemplaza el default (pocas = abierto, muchas = cerrado). */
  const [expandedOverrideByType, setExpandedOverrideByType] = useState<Record<string, boolean>>({});

  const handleStartEditUnit = (u: Unit) => {
    const typeName = unitTypeNameById.get(u.unitTypeId) ?? "Tipo desconocido";
    setExpandedOverrideByType((prev) =>
      prev[typeName] === true ? prev : { ...prev, [typeName]: true }
    );
    props.onStartEditUnit(u);
  };

  useEffect(() => {
    if (!props.editingUnitId) return;
    const el = document.getElementById(`admin-unit-edit-${props.editingUnitId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [props.editingUnitId]);

  if (props.units.length === 0) {
    return (
      <p style={{ margin: 0, color: "var(--color-text-muted)" }}>Todavía no hay unidades cargadas.</p>
    );
  }

  return (
    <div className="admin-units-groups-root">
      {groups.map((group) => {
        const defaultExpanded = group.units.length <= ADMIN_UNITS_GROUP_EXPAND_FEW_THRESHOLD;
        const expanded = expandedOverrideByType[group.typeName] ?? defaultExpanded;
        return (
        <div key={group.typeName} className="admin-units-group">
          <button
            type="button"
            className="admin-units-group__header"
            aria-expanded={expanded}
            onClick={() =>
              setExpandedOverrideByType((prev) => {
                const cur = prev[group.typeName] ?? defaultExpanded;
                return { ...prev, [group.typeName]: !cur };
              })
            }
          >
            <span className="admin-units-group__chevron" aria-hidden>
              {expanded ? "▼" : "▶"}
            </span>
            <span className="admin-units-group__title">{group.typeName}</span>
            <span className="admin-units-group__count">{group.units.length} unidades</span>
          </button>

          {expanded ? (
          <ul
            className="admin-units-group__list"
            style={{
              margin: 0,
              paddingLeft: 0,
              listStyle: "none",
              color: "var(--color-text)",
              display: "grid",
              gap: 10,
            }}
          >
            {group.units.map((u) => (
              <li
                key={u.id}
                id={props.editingUnitId === u.id ? `admin-unit-edit-${u.id}` : undefined}
                style={{
                  paddingBottom: 10,
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {props.editingUnitId === u.id ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
                      Tipo (no editable): <strong>{group.typeName}</strong>
                      {" · "}
                      Estado operativo:{" "}
                      <strong>{props.operationalStatusLabel(u.operationalStatus)}</strong>
                    </div>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span style={{ fontWeight: 700 }}>Nombre visible</span>
                      <p className="admin-field-hint">
                        Es el nombre que ve el huésped (legible). Ejemplos: Parcela 12, Sendero, Camarote A.
                      </p>
                      <input
                        value={props.editUnitDisplayName}
                        onChange={(e) => props.onEditUnitDisplayNameChange(e.target.value)}
                        style={props.inputStyle}
                        disabled={props.saving}
                      />
                    </label>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span style={{ fontWeight: 700 }}>Código interno</span>
                      <p className="admin-field-hint">
                        Identificador operativo único (no reemplaza al nombre visible). Ej.: P-12, CAB-01.
                      </p>
                      <input
                        value={props.editUnitNumber}
                        onChange={(e) => props.onEditUnitNumberChange(e.target.value)}
                        style={props.inputStyle}
                        disabled={props.saving}
                      />
                    </label>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span style={{ fontWeight: 700 }}>Sector</span>
                      <input
                        value={props.editUnitSector}
                        onChange={(e) => props.onEditUnitSectorChange(e.target.value)}
                        style={props.inputStyle}
                        disabled={props.saving}
                        placeholder="Opcional"
                      />
                    </label>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span style={{ fontWeight: 700 }}>Precio especial (opcional)</span>
                      <p className="admin-field-hint">
                        Solo usalo si esta unidad tiene un precio distinto al del tipo de unidad. Si lo dejás vacío, se
                        usa el precio del tipo.
                      </p>
                      <input
                        value={props.editUnitPriceOverride}
                        onChange={(e) => props.onEditUnitPriceOverrideChange(e.target.value)}
                        style={props.inputStyle}
                        disabled={props.saving}
                        placeholder="Vacío = precio del tipo"
                        inputMode="decimal"
                      />
                    </label>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Button variant="primary" onClick={props.onSaveEditUnit} disabled={props.saving}>
                        {props.saving ? "Guardando…" : "Guardar"}
                      </Button>
                      <Button variant="secondary" onClick={props.onCancelEditUnit} disabled={props.saving}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div style={{ flex: "1 1 220px", minWidth: 0, display: "grid", gap: 4 }}>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{u.displayName}</div>
                      <div style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.45 }}>
                        Código interno: {u.number}
                        {" · "}
                        {props.operationalStatusLabel(u.operationalStatus)}
                        {u.sector ? ` · sector: ${u.sector}` : ""}
                        {u.priceOverrideArs !== undefined
                          ? ` · precio especial: $${u.priceOverrideArs.toLocaleString("es-AR")}`
                          : ""}
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => handleStartEditUnit(u)}
                      disabled={props.saving}
                    >
                      Editar
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          ) : null}
        </div>
        );
      })}
    </div>
  );
}
