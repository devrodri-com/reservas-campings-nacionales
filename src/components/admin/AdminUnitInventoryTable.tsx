"use client";

import { Fragment, useMemo, type ReactNode } from "react";
import { Button, Card } from "@/components/ui";
import type { Unit } from "@/types/unit";
import type { UnitType } from "@/types/unitType";
import type { UnitBlock } from "@/types/unitBlock";
import type { UnitAvailabilityRow } from "@/types/unitAvailability";
import { formatYmdToDmy } from "@/lib/dates";
import SelectDropdown from "@/components/SelectDropdown";
import type { SelectOption } from "@/components/SelectDropdown";
import DateRangePicker from "@/components/DateRangePicker";

/** Orden operativo: número de unidad si es entero; si no, orden natural sobre el nombre visible. */
function compareUnitsForInventoryTable(a: Unit, b: Unit): number {
  const rawA = a.number?.trim() ?? "";
  const rawB = b.number?.trim() ?? "";
  const numA = /^\d+$/.test(rawA) ? parseInt(rawA, 10) : null;
  const numB = /^\d+$/.test(rawB) ? parseInt(rawB, 10) : null;

  if (numA !== null && numB !== null && numA !== numB) {
    return numA - numB;
  }
  if (numA !== null && numB === null) return -1;
  if (numA === null && numB !== null) return 1;

  return a.displayName.localeCompare(b.displayName, "es", { numeric: true, sensitivity: "base" });
}

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
};

export default function AdminUnitInventoryTable(props: AdminUnitInventoryTableProps) {
  const unitTypeById = new Map<string, UnitType>(props.unitTypes.map((t) => [t.id, t]));
  const Badge = props.BadgeComponent;
  const { availCount, notAvailCount, blockedRangeCount } = useMemo(() => {
    const avail = props.unitAvailability.filter((r) => r.isAvailable).length;
    const notAvail = props.unitAvailability.filter((r) => !r.isAvailable).length;
    const blockedRange = props.unitAvailability.filter(
      (r) => !r.isAvailable && r.reason === "Bloqueo por rango"
    ).length;
    return { availCount: avail, notAvailCount: notAvail, blockedRangeCount: blockedRange };
  }, [props.unitAvailability]);
  const statusOptions: SelectOption[] = [
    { value: "available", label: "Disponible" },
    { value: "blocked", label: "Bloqueada" },
    { value: "maintenance", label: "Mantenimiento" },
  ];

  const unitsSorted = useMemo(
    () => [...props.units].sort(compareUnitsForInventoryTable),
    [props.units]
  );
  const selectedUnitForBlockId = props.selectedUnitForBlock?.id ?? "";

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
                  fontSize: 13,
                  color: "var(--color-text-muted)",
                  marginTop: 0,
                  marginBottom: 10,
                  lineHeight: 1.45,
                }}
              >
                <strong style={{ color: "var(--color-text)" }}>En el rango:</strong> {availCount} disponibles ·{" "}
                {notAvailCount} no disponibles · {blockedRangeCount} bloqueadas (bloqueo en rango)
              </p>

              <details className="admin-inventory-details">
                <summary className="admin-inventory-details__summary">
                  <span className="admin-inventory-details__summary-chevron" aria-hidden>
                    ▸
                  </span>
                  <span className="admin-inventory-details__summary-text">
                    <span className="admin-inventory-details__summary-title">
                      Ver inventario detallado
                    </span>
                    <span className="admin-inventory-details__summary-hint">
                      Estados, disponibilidad y bloqueo por rango
                    </span>
                  </span>
                </summary>
                <div className="admin-inventory-details__body">
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
                    {unitsSorted.map((unit) => {
                      const ut = unitTypeById.get(unit.unitTypeId);
                      const availRow = props.unitAvailability.find((r) => r.unit.id === unit.id);
                      const unitBadge = props.getUnitStatusBadge(unit.operationalStatus);
                      const rangeBadge = availRow
                        ? props.getRangeAvailabilityBadge(availRow)
                        : { text: "—", tone: "gray" as const };

                      const isInlineBlocking = selectedUnitForBlockId === unit.id;

                      return (
                        <Fragment key={unit.id}>
                          <tr style={{ borderTop: "1px solid var(--color-border)" }}>
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
                                  Consulta: {formatYmdToDmy(props.fromDate)} → {formatYmdToDmy(props.rangeEndDate)}
                                </div>
                                <div>
                                  <Badge text={rangeBadge.text} tone={rangeBadge.tone} />
                                  {availRow?.detailHint ? (
                                    <div
                                      style={{
                                        marginTop: 6,
                                        fontSize: 11,
                                        color: "var(--color-text-muted)",
                                        lineHeight: 1.35,
                                      }}
                                    >
                                      {availRow.detailHint}
                                    </div>
                                  ) : null}
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
                                      <div
                                        key={b.id}
                                        style={{
                                          fontSize: 12,
                                          color: "var(--color-text-muted)",
                                          border: "1px solid var(--color-border)",
                                          borderRadius: 8,
                                          padding: "6px 8px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          gap: 8,
                                        }}
                                      >
                                        <span>
                                          <strong style={{ color: "var(--color-text)" }}>Bloqueo:</strong>{" "}
                                          {formatYmdToDmy(b.fromDate)} → {formatYmdToDmy(b.toDate)}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          disabled={props.busy}
                                          style={{ padding: "2px 8px", flexShrink: 0 }}
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

                          {isInlineBlocking ? (
                            <tr style={{ background: "color-mix(in srgb, var(--color-border) 6%, var(--color-surface))" }}>
                              <td colSpan={6} style={{ padding: "10px 10px 12px 10px" }}>
                                <div
                                  style={{
                                    border: "1px solid var(--color-border)",
                                    borderRadius: 10,
                                    background: "var(--color-surface)",
                                    padding: 12,
                                    boxShadow: "var(--shadow-sm)",
                                    display: "grid",
                                    gap: 12,
                                  }}
                                >
                                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
                                    <div style={{ fontWeight: 800, color: "var(--color-accent)" }}>
                                      Bloquear {unit.displayName}
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                                      Rango consultado: {formatYmdToDmy(props.fromDate)} → {formatYmdToDmy(props.rangeEndDate)}
                                    </div>
                                  </div>

                                  <div style={{ minWidth: 0, maxWidth: "min(100%, 420px)" }}>
                                    <DateRangePicker
                                      label="Período a bloquear"
                                      checkInDate={props.blockFromDate}
                                      checkOutDate={props.blockToDate}
                                      onChange={({ checkInDate, checkOutDate }) => {
                                        props.onChangeBlockFromDate(checkInDate);
                                        props.onChangeBlockToDate(checkOutDate);
                                      }}
                                      disabled={props.busy}
                                      disablePast
                                      size="compact"
                                    />
                                  </div>

                                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                                    <Button onClick={props.onCreateBlock} disabled={props.busy}>
                                      Crear bloqueo
                                    </Button>
                                    <Button variant="ghost" onClick={() => props.onSelectUnitForBlock(null)} disabled={props.busy}>
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </details>
            </>
          )}
        </Card>
      </div>

      {/* El formulario de bloqueo se renderiza inline dentro de la tabla. */}
    </>
  );
}
