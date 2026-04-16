"use client";

import type { ReactNode } from "react";
import { Button, Card } from "@/components/ui";
import type { Unit } from "@/types/unit";
import type { UnitType } from "@/types/unitType";
import type { UnitBlock } from "@/types/unitBlock";
import type { UnitAvailabilityRow } from "@/types/unitAvailability";
import { formatYmdToDmy } from "@/lib/dates";
import SelectDropdown from "@/components/SelectDropdown";
import type { SelectOption } from "@/components/SelectDropdown";

export type AdminUnitInventoryTableProps = {
  busy: boolean;
  units: Unit[];
  unitTypes: UnitType[];
  unitBlocks: UnitBlock[];
  unitAvailability: UnitAvailabilityRow[];
  fromDate: string;
  rangeEndDate: string;

  selectedUnitForBlock: Unit | null;
  blockFromDate: string;
  blockToDate: string;

  onSetUnitOperationalStatus: (unitId: string, status: "available" | "blocked" | "maintenance") => void;
  onSelectUnitForBlock: (unit: Unit | null) => void;
  onChangeBlockFromDate: (value: string) => void;
  onChangeBlockToDate: (value: string) => void;
  onCreateBlock: () => void;
  onDeleteBlock: (blockId: string) => void;

  getUnitStatusBadge: (status: string) => {
    text: string;
    tone: "green" | "yellow" | "red" | "gray";
  };
  getRangeAvailabilityBadge: (row: Pick<UnitAvailabilityRow, "reason" | "isAvailable">) => {
    text: string;
    tone: "green" | "yellow" | "red" | "gray";
  };

  BadgeComponent: (props: { text: string; tone: "green" | "yellow" | "red" | "gray" | "blue" }) => ReactNode;
  todayYmdValue: string;
};

export default function AdminUnitInventoryTable(props: AdminUnitInventoryTableProps) {
  const unitTypeById = new Map<string, UnitType>(props.unitTypes.map((t) => [t.id, t]));
  const Badge = props.BadgeComponent;
  const statusOptions: SelectOption[] = [
    { value: "available", label: "Disponible" },
    { value: "blocked", label: "Bloqueada" },
    { value: "maintenance", label: "Mantenimiento" },
  ];

  return (
    <>
      <div style={{ marginTop: 16 }}>
        <Card title="Inventario por unidad">
          {props.units.length === 0 ? (
            <p>No hay unidades cargadas para este camping.</p>
          ) : (
            <>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--color-text-muted)",
                  marginTop: 0,
                  marginBottom: 12,
                }}
              >
                Disponibles: {props.unitAvailability.filter((r) => r.isAvailable).length} · No disponibles:{" "}
                {props.unitAvailability.filter((r) => !r.isAvailable).length}
              </p>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "var(--color-bg)" }}>
                      <th style={{ textAlign: "left", padding: "8px 10px" }}>Unidad</th>
                      <th style={{ textAlign: "left", padding: "8px 10px" }}>Tipo</th>
                      <th style={{ textAlign: "left", padding: "8px 10px" }}>Capacidad</th>
                      <th style={{ textAlign: "left", padding: "8px 10px" }}>Estado</th>
                      <th style={{ textAlign: "left", padding: "8px 10px" }}>Rango</th>
                      <th style={{ textAlign: "left", padding: "8px 10px" }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.units.map((unit) => {
                      const ut = unitTypeById.get(unit.unitTypeId);
                      const availRow = props.unitAvailability.find((r) => r.unit.id === unit.id);
                      const unitBadge = props.getUnitStatusBadge(unit.operationalStatus);
                      const rangeBadge = availRow
                        ? props.getRangeAvailabilityBadge(availRow)
                        : { text: "—", tone: "gray" as const };

                      return (
                        <tr key={unit.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                          <td style={{ padding: "8px 10px", fontWeight: 700, whiteSpace: "nowrap" }}>
                            {unit.displayName}
                          </td>
                          <td style={{ padding: "8px 10px", color: "var(--color-text-muted)" }}>
                            {ut?.name ?? "Tipo desconocido"}
                          </td>
                          <td style={{ padding: "8px 10px" }}>{ut?.capacityMax ?? 0}</td>
                          <td style={{ padding: "8px 10px" }}>
                            <Badge text={unitBadge.text} tone={unitBadge.tone} />
                          </td>
                          <td style={{ padding: "8px 10px" }}>
                            <div style={{ display: "grid", gap: 6 }}>
                              <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                                {formatYmdToDmy(props.fromDate)} → {formatYmdToDmy(props.rangeEndDate)}
                              </div>
                              <div>
                                <Badge text={rangeBadge.text} tone={rangeBadge.tone} />
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "8px 10px", minWidth: 240 }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                              <div style={{ minWidth: 180 }}>
                                <SelectDropdown
                                  label="Estado"
                                  value={unit.operationalStatus}
                                  options={statusOptions}
                                  onChange={(v) =>
                                    props.onSetUnitOperationalStatus(
                                      unit.id,
                                      v === "available" || v === "blocked" || v === "maintenance"
                                        ? v
                                        : "available"
                                    )
                                  }
                                  disabled={props.busy}
                                  searchable={false}
                                />
                              </div>
                              <Button
                                variant="secondary"
                                style={{ padding: "6px 10px" }}
                                disabled={props.busy}
                                onClick={() => props.onSelectUnitForBlock(unit)}
                              >
                                Bloquear rango
                              </Button>
                            </div>

                            {props.unitBlocks.some((b) => b.unitId === unit.id) ? (
                              <div style={{ marginTop: 6, display: "grid", gap: 4 }}>
                                {props.unitBlocks
                                  .filter((b) => b.unitId === unit.id)
                                  .map((b) => (
                                    <div key={b.id} style={{ fontSize: 12 }}>
                                      {b.fromDate} → {b.toDate}
                                      <Button
                                        variant="ghost"
                                        disabled={props.busy}
                                        style={{ padding: "2px 6px", marginLeft: 6 }}
                                        onClick={() => props.onDeleteBlock(b.id)}
                                      >
                                        ✕
                                      </Button>
                                    </div>
                                  ))}
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      </div>

      {props.selectedUnitForBlock ? (
        <div style={{ marginTop: 16 }}>
          <Card title={`Bloquear ${props.selectedUnitForBlock.displayName}`}>
            <div style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 4 }}>
                Desde
                <input
                  type="date"
                  min={props.todayYmdValue}
                  value={props.blockFromDate}
                  onChange={(e) => props.onChangeBlockFromDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 4 }}>
                Hasta
                <input
                  type="date"
                  min={props.todayYmdValue}
                  value={props.blockToDate}
                  onChange={(e) => props.onChangeBlockToDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <Button onClick={props.onCreateBlock} disabled={props.busy}>
                Crear bloqueo
              </Button>

              <Button variant="ghost" onClick={() => props.onSelectUnitForBlock(null)}>
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
