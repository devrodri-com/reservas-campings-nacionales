"use client";

import { useMemo, type CSSProperties } from "react";
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
        units: [...list].sort((a, b) => a.displayName.localeCompare(b.displayName, "es")),
      }))
      .sort((a, b) => a.typeName.localeCompare(b.typeName, "es"));
  }, [props.units, unitTypeNameById]);

  if (props.units.length === 0) {
    return (
      <p style={{ margin: 0, color: "var(--color-text-muted)" }}>Todavía no hay unidades cargadas.</p>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {groups.map((group) => (
        <div
          key={group.typeName}
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            padding: "10px 12px 12px",
            background: "var(--color-surface)",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 10, color: "var(--color-accent)" }}>
            {group.typeName}{" "}
            <span style={{ fontWeight: 600, color: "var(--color-text-muted)" }}>({group.units.length})</span>
          </div>

          <ul
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
                      <input
                        value={props.editUnitDisplayName}
                        onChange={(e) => props.onEditUnitDisplayNameChange(e.target.value)}
                        style={props.inputStyle}
                        disabled={props.saving}
                      />
                    </label>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span style={{ fontWeight: 700 }}>Número / código</span>
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
                      <span style={{ fontWeight: 700 }}>Precio propio (opcional, ARS)</span>
                      <input
                        value={props.editUnitPriceOverride}
                        onChange={(e) => props.onEditUnitPriceOverrideChange(e.target.value)}
                        style={props.inputStyle}
                        disabled={props.saving}
                        placeholder="Vacío = usa precio del tipo"
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
                        n.º {u.number}
                        {" · "}
                        {props.operationalStatusLabel(u.operationalStatus)}
                        {u.sector ? ` · sector: ${u.sector}` : ""}
                        {u.priceOverrideArs !== undefined
                          ? ` · precio propio: $${u.priceOverrideArs.toLocaleString("es-AR")} ARS`
                          : ""}
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => props.onStartEditUnit(u)}
                      disabled={props.saving || props.editingUnitId !== ""}
                    >
                      Editar
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
