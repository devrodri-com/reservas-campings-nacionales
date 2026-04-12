"use client";

import type { ReactNode } from "react";
import type { Unit } from "@/types/unit";
import type { UnitType } from "@/types/unitType";
import type { UnitBlock } from "@/types/unitBlock";
import type { UnitAvailabilityRow } from "@/types/unitAvailability";
import { Button, Card } from "@/components/ui";
import { formatYmdToDmy } from "@/lib/dates";

export type UnitInventoryCardProps = {
  campingInventoryMode?: "capacity" | "unit_based";
  busy: boolean;

  units: Unit[];
  unitTypes: UnitType[];
  unitTypeById: Map<string, UnitType>;
  unitBlocks: UnitBlock[];
  unitAvailability: UnitAvailabilityRow[];

  fromDate: string;
  rangeEndDate: string;

  selectedUnitForBlock: Unit | null;
  blockFromDate: string;
  blockToDate: string;

  onSetUnitOperationalStatus: (
    unitId: string,
    status: "available" | "blocked" | "maintenance"
  ) => void;

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

  BadgeComponent: (props: {
    text: string;
    tone: "green" | "yellow" | "red" | "gray" | "blue";
  }) => ReactNode;

  todayYmdValue: string;
};

export default function UnitInventoryCard({
  busy,
  units,
  unitTypeById,
  unitBlocks,
  unitAvailability,
  fromDate,
  rangeEndDate,
  selectedUnitForBlock,
  blockFromDate,
  blockToDate,
  onSetUnitOperationalStatus,
  onSelectUnitForBlock,
  onChangeBlockFromDate,
  onChangeBlockToDate,
  onCreateBlock,
  onDeleteBlock,
  getUnitStatusBadge,
  getRangeAvailabilityBadge,
  BadgeComponent: Badge,
  todayYmdValue,
}: UnitInventoryCardProps) {
  return (
    <>
      <div style={{ marginTop: 16 }}>
        <Card title="Inventario por unidad">
          {units.length === 0 ? (
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
                Disponibles: {unitAvailability.filter((r) => r.isAvailable).length} · No disponibles:{" "}
                {unitAvailability.filter((r) => !r.isAvailable).length}
              </p>
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                {units.map((unit) => {
                  const ub = getUnitStatusBadge(unit.operationalStatus);
                  const availRow = unitAvailability.find((r) => r.unit.id === unit.id);
                  const rangeB = availRow
                    ? getRangeAvailabilityBadge(availRow)
                    : { text: "—", tone: "gray" as const };
                  return (
                    <div
                      key={unit.id}
                      style={{
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                        padding: 12,
                        background: "var(--color-surface)",
                        display: "grid",
                        gap: 8,
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{unit.displayName}</div>
                      <div style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
                        {unitTypeById.get(unit.unitTypeId)?.name ?? "Tipo desconocido"}
                      </div>
                      <div>
                        <Badge text={ub.text} tone={ub.tone} />
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--color-text-muted)",
                            display: "block",
                            marginBottom: 4,
                          }}
                        >
                          Rango ({formatYmdToDmy(fromDate)} → {formatYmdToDmy(rangeEndDate)})
                        </span>
                        <Badge text={rangeB.text} tone={rangeB.tone} />
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Button
                          variant="ghost"
                          disabled={busy || unit.operationalStatus === "available"}
                          onClick={() => onSetUnitOperationalStatus(unit.id, "available")}
                          style={{ padding: "6px 10px" }}
                        >
                          Disponible
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={busy || unit.operationalStatus === "blocked"}
                          onClick={() => onSetUnitOperationalStatus(unit.id, "blocked")}
                          style={{ padding: "6px 10px" }}
                        >
                          Bloquear
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={busy || unit.operationalStatus === "maintenance"}
                          onClick={() => onSetUnitOperationalStatus(unit.id, "maintenance")}
                          style={{ padding: "6px 10px" }}
                        >
                          Mantenimiento
                        </Button>
                        <Button
                          variant="secondary"
                          style={{ padding: "6px 10px" }}
                          disabled={busy}
                          onClick={() => onSelectUnitForBlock(unit)}
                        >
                          Bloquear rango
                        </Button>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        {unitBlocks
                          .filter((b) => b.unitId === unit.id)
                          .map((b) => (
                            <div key={b.id} style={{ fontSize: 12 }}>
                              {b.fromDate} → {b.toDate}
                              <Button
                                variant="ghost"
                                disabled={busy}
                                style={{ padding: "2px 6px", marginLeft: 6 }}
                                onClick={() => onDeleteBlock(b.id)}
                              >
                                ✕
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>

      {selectedUnitForBlock ? (
        <div style={{ marginTop: 16 }}>
          <Card title={`Bloquear ${selectedUnitForBlock.displayName}`}>
            <div style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 4 }}>
                Desde
                <input
                  type="date"
                  min={todayYmdValue}
                  value={blockFromDate}
                  onChange={(e) => onChangeBlockFromDate(e.target.value)}
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
                  min={todayYmdValue}
                  value={blockToDate}
                  onChange={(e) => onChangeBlockToDate(e.target.value)}
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

              <Button onClick={onCreateBlock} disabled={busy}>
                Crear bloqueo
              </Button>

              <Button variant="ghost" onClick={() => onSelectUnitForBlock(null)}>
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
