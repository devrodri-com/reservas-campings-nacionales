"use client";

import type { SelectOption } from "@/components/SelectDropdown";
import SelectDropdown from "@/components/SelectDropdown";
import { Button, Card } from "@/components/ui";

export type UnitChangePreview = {
  currentTotalArs: number;
  newTotalArs: number;
  deltaArs: number;
  newUnitSummary: string;
  priceCalculable: boolean;
};

type Props = {
  busy: boolean;
  currentUnitSummary: string;
  reassignTargetUnitId: string;
  onChangeReassignTargetUnitId: (value: string) => void;
  reassignUnitOptions: SelectOption[];
  oldUnitNextStatus: "available" | "blocked" | "maintenance";
  onChangeOldUnitNextStatus: (value: "available" | "blocked" | "maintenance") => void;
  oldUnitNextStatusOptions: SelectOption[];
  preview: UnitChangePreview | null;
  onConfirm: () => void;
  onCancel: () => void;
};

function formatMoney(n: number): string {
  return `$${n.toLocaleString("es-AR")}`;
}

export default function AdminReservationUnitChangePanel({
  busy,
  currentUnitSummary,
  reassignTargetUnitId,
  onChangeReassignTargetUnitId,
  reassignUnitOptions,
  oldUnitNextStatus,
  onChangeOldUnitNextStatus,
  oldUnitNextStatusOptions,
  preview,
  onConfirm,
  onCancel,
}: Props) {
  const canConfirm =
    Boolean(reassignTargetUnitId.trim()) && preview !== null && preview.priceCalculable;

  const adjustmentLabel = (() => {
    if (!preview?.priceCalculable) return null;
    const d = preview.deltaArs;
    if (d > 0) return `Pendiente de cobro: ${formatMoney(d)}`;
    if (d < 0) return `Pendiente de devolución: ${formatMoney(Math.abs(d))}`;
    return "Sin diferencia";
  })();

  return (
    <Card title="Cambiar unidad">
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ fontSize: 14, color: "var(--color-text-muted)", lineHeight: 1.45 }}>
          <strong style={{ color: "var(--color-text)" }}>Unidad actual:</strong> {currentUnitSummary}
        </div>

        <SelectDropdown
          label="Nueva unidad"
          value={reassignTargetUnitId}
          options={reassignUnitOptions}
          onChange={onChangeReassignTargetUnitId}
          placeholder={
            reassignUnitOptions.length ? "Seleccionar…" : "No hay otras unidades libres en ese rango"
          }
          disabled={busy}
        />

        <div
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            padding: 12,
            background: "var(--color-bg)",
            display: "grid",
            gap: 8,
            fontSize: 14,
          }}
        >
          <div style={{ fontWeight: 800, color: "var(--color-accent)" }}>Vista previa</div>
          {!reassignTargetUnitId.trim() ? (
            <span style={{ color: "var(--color-text-muted)" }}>
              Elegí una unidad para ver totales y diferencia.
            </span>
          ) : preview && preview.priceCalculable ? (
            <>
              <div>
                <strong>Total actual:</strong> {formatMoney(preview.currentTotalArs)}
              </div>
              <div>
                <strong>Total nuevo:</strong> {formatMoney(preview.newTotalArs)}{" "}
                <span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
                  ({preview.newUnitSummary})
                </span>
              </div>
              <div>
                <strong>Diferencia:</strong> {formatMoney(preview.deltaArs)}
              </div>
              {adjustmentLabel ? (
                <div style={{ fontWeight: 700, color: "var(--color-accent)" }}>{adjustmentLabel}</div>
              ) : null}
            </>
          ) : (
            <span style={{ color: "var(--color-text-muted)" }}>
              No se pudo calcular el precio para la unidad elegida. Revisá el tipo de unidad y las
              tarifas.
            </span>
          )}
        </div>

        <SelectDropdown
          label="Estado de la unidad anterior"
          value={oldUnitNextStatus}
          options={oldUnitNextStatusOptions}
          onChange={(v) => {
            if (v === "available" || v === "blocked" || v === "maintenance") {
              onChangeOldUnitNextStatus(v);
            }
          }}
          disabled={busy}
        />

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="secondary" disabled={busy || !canConfirm} onClick={() => onConfirm()}>
            Confirmar cambio
          </Button>
          <Button variant="ghost" disabled={busy} onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    </Card>
  );
}
