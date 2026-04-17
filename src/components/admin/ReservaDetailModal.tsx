"use client";

import type { ReactNode } from "react";
import type { Reserva } from "@/types/reserva";
import type { Unit } from "@/types/unit";
import type { UnitType } from "@/types/unitType";
import Modal from "@/components/Modal";
import { Button, Card } from "@/components/ui";
import SelectDropdown, { type SelectOption } from "@/components/SelectDropdown";
import { enumerateNights, formatYmdToDmy } from "@/lib/dates";
import AdminReservationUnitChangePanel, {
  type UnitChangePreview,
} from "@/components/admin/AdminReservationUnitChangePanel";

export type ReservaDetailModalProps = {
  open: boolean;
  detailReserva: Reserva | null;
  canCreateOrCancel: boolean;
  campingInventoryMode?: "capacity" | "unit_based";
  profileRole?: string;
  busy: boolean;

  units: Unit[];
  unitTypeById: Map<string, UnitType>;

  detailReservaUnitRows: ReactNode;

  reassigningReservaId: string | null;
  reassignTargetUnitId: string;
  oldUnitNextStatus: "available" | "blocked" | "maintenance";
  reassignUnitOptions: SelectOption[];
  oldUnitNextStatusOptions: SelectOption[];

  unitChangePreview: UnitChangePreview | null;
  currentUnitChangeSummary: string;

  formatEstadoLabel: (estado: string) => string;
  formatOrigenLabel: (origen: string) => string;

  onClose: () => void;
  onStartReassign: (reservaId: string) => void;
  onCancelReassign: () => void;
  onConfirmReassign: () => void;
  onChangeReassignTargetUnitId: (value: string) => void;
  onChangeOldUnitNextStatus: (value: "available" | "blocked" | "maintenance") => void;
};

function unitChangeStatusLabel(s: NonNullable<Reserva["unitChangeAdjustmentStatus"]>): string {
  switch (s) {
    case "none":
      return "Sin ajuste pendiente";
    case "pending_charge":
      return "Cobro pendiente";
    case "pending_refund":
      return "Devolución pendiente";
    case "resolved":
      return "Ajuste resuelto";
    default:
      return s;
  }
}

export default function ReservaDetailModal({
  open,
  detailReserva,
  canCreateOrCancel,
  campingInventoryMode,
  profileRole,
  busy,
  units: _units,
  unitTypeById: _unitTypeById,
  detailReservaUnitRows,
  reassigningReservaId,
  reassignTargetUnitId,
  oldUnitNextStatus,
  reassignUnitOptions,
  oldUnitNextStatusOptions,
  unitChangePreview,
  currentUnitChangeSummary,
  formatEstadoLabel,
  formatOrigenLabel,
  onClose,
  onStartReassign,
  onCancelReassign,
  onConfirmReassign,
  onChangeReassignTargetUnitId,
  onChangeOldUnitNextStatus,
}: ReservaDetailModalProps) {
  void _units;
  void _unitTypeById;

  return (
    <Modal open={open} title="Detalle de reserva" onClose={onClose}>
      {detailReserva ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 800, color: "var(--color-accent)" }}>
              {detailReserva.titularNombre}
            </div>
            <div style={{ color: "var(--color-text-muted)" }}>{detailReserva.titularEmail}</div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div>
              <strong>Reserva ID:</strong> {detailReserva.id}
            </div>
            <div>
              <strong>Fechas:</strong> {formatYmdToDmy(detailReserva.checkInDate)} →{" "}
              {formatYmdToDmy(detailReserva.checkOutDate)}
            </div>
            <div>
              <strong>Noches:</strong>{" "}
              {enumerateNights(detailReserva.checkInDate, detailReserva.checkOutDate).length}
            </div>
            {campingInventoryMode !== "unit_based" ? (
              <div>
                <strong>Parcelas:</strong> {detailReserva.parcelas}
              </div>
            ) : null}
            {detailReservaUnitRows}
            {canCreateOrCancel && campingInventoryMode === "unit_based" && detailReserva.unitId ? (
              <div style={{ marginTop: 4 }}>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    onStartReassign(detailReserva.id);
                  }}
                >
                  Cambiar unidad
                </Button>
              </div>
            ) : null}
            <div>
              <strong>Personas:</strong> {detailReserva.adultos} adultos / {detailReserva.menores} menores
            </div>
            <div>
              <strong>Total:</strong> ${detailReserva.montoTotalArs.toLocaleString("es-AR")}
            </div>

            {detailReserva.unitChangeAtMs &&
            detailReserva.unitChangeAdjustmentStatus &&
            typeof detailReserva.unitChangeDeltaArs === "number" ? (
              <div
                style={{
                  marginTop: 6,
                  padding: 10,
                  borderRadius: 10,
                  border: "1px dashed var(--color-border)",
                  fontSize: 13,
                  color: "var(--color-text-muted)",
                  lineHeight: 1.45,
                }}
              >
                <strong style={{ color: "var(--color-text)" }}>Último cambio de unidad:</strong>{" "}
                {new Date(detailReserva.unitChangeAtMs).toLocaleString("es-AR")}
                {" · "}
                {unitChangeStatusLabel(detailReserva.unitChangeAdjustmentStatus)}
                {typeof detailReserva.unitChangePreviousMontoArs === "number" ? (
                  <>
                    {" · "}
                    Monto anterior: $
                    {detailReserva.unitChangePreviousMontoArs.toLocaleString("es-AR")}
                  </>
                ) : null}
                {" · "}
                Diferencia: ${detailReserva.unitChangeDeltaArs.toLocaleString("es-AR")}
              </div>
            ) : null}

            {/* PII: ocultar a viewer */}
            {profileRole === "viewer" ? (
              <>
                <div>
                  <strong>Teléfono:</strong> —
                </div>
                <div>
                  <strong>Edad:</strong> —
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <strong>Teléfono:</strong> {detailReserva.titularTelefono}
                  </div>
                  <Button
                    variant="ghost"
                    style={{ padding: "6px 10px" }}
                    onClick={() => navigator.clipboard.writeText(detailReserva.titularTelefono)}
                  >
                    Copiar
                  </Button>
                  <a href={`tel:${detailReserva.titularTelefono}`} style={{ textDecoration: "none" }}>
                    <Button variant="secondary" style={{ padding: "6px 10px" }}>
                      Llamar
                    </Button>
                  </a>
                </div>
                <div>
                  <strong>Edad:</strong> {detailReserva.titularEdad}
                </div>
              </>
            )}

            <div>
              <strong>Estado:</strong> {formatEstadoLabel(detailReserva.estado)}
            </div>
            <div>
              <strong>Origen:</strong> {formatOrigenLabel(detailReserva.createdByMode ?? "")}
            </div>
            <div>
              <strong>Creada:</strong> {new Date(detailReserva.createdAtMs).toLocaleString("es-AR")}
            </div>

            {detailReserva.expiresAtMs ? (
              <div>
                <strong>Vence:</strong> {new Date(detailReserva.expiresAtMs).toLocaleString("es-AR")}
              </div>
            ) : null}

            {detailReserva.paidAtMs ? (
              <div>
                <strong>Pagada:</strong> {new Date(detailReserva.paidAtMs).toLocaleString("es-AR")}
              </div>
            ) : null}

            {detailReserva.cancelMotivo ? (
              <div>
                <strong>Motivo cancelación:</strong> {detailReserva.cancelMotivo}
              </div>
            ) : null}

            {detailReserva.mpPreferenceId ? (
              <div>
                <strong>MP Preference:</strong> {detailReserva.mpPreferenceId}
              </div>
            ) : null}

            {detailReserva.mpPaymentId ? (
              <div>
                <strong>MP Payment:</strong> {detailReserva.mpPaymentId}
              </div>
            ) : null}

            {detailReserva.paymentStatus ? (
              <div>
                <strong>Payment status:</strong> {detailReserva.paymentStatus}
              </div>
            ) : null}
          </div>

          {reassigningReservaId === detailReserva.id ? (
            <div style={{ marginTop: 14 }}>
              <AdminReservationUnitChangePanel
                busy={busy}
                currentUnitSummary={currentUnitChangeSummary}
                reassignTargetUnitId={reassignTargetUnitId}
                onChangeReassignTargetUnitId={onChangeReassignTargetUnitId}
                reassignUnitOptions={reassignUnitOptions}
                oldUnitNextStatus={oldUnitNextStatus}
                onChangeOldUnitNextStatus={onChangeOldUnitNextStatus}
                oldUnitNextStatusOptions={oldUnitNextStatusOptions}
                preview={unitChangePreview}
                onConfirm={onConfirmReassign}
                onCancel={onCancelReassign}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
