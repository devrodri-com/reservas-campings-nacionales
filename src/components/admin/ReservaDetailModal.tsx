"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Reserva } from "@/types/reserva";
import type { UserRole } from "@/types/user";
import { isReservationViewerRole } from "@/lib/adminReservationRoleUi";
import type { Unit } from "@/types/unit";
import type { UnitType } from "@/types/unitType";
import Modal from "@/components/Modal";
import { Button, Card } from "@/components/ui";
import type { SelectOption } from "@/components/SelectDropdown";
import { enumerateNights, formatYmdToDmy } from "@/lib/dates";
import AdminReservationUnitChangePanel, {
  type UnitChangePreview,
} from "@/components/admin/AdminReservationUnitChangePanel";

export type ReservaDetailModalProps = {
  open: boolean;
  detailReserva: Reserva | null;
  canCreateOrCancel: boolean;
  campingInventoryMode?: "capacity" | "unit_based";
  profileRole?: UserRole;
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
  onCancelReserva?: (reserva: Reserva) => void;
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

const metaRowStyle: CSSProperties = {
  fontSize: 13,
  color: "var(--color-text-muted)",
  lineHeight: 1.5,
};

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
  onCancelReserva,
}: ReservaDetailModalProps) {
  void _units;
  void _unitTypeById;

  const hideGuestPii = profileRole ? isReservationViewerRole(profileRole) : false;

  return (
    <Modal open={open} title="Detalle de reserva" onClose={onClose}>
      {detailReserva ? (
        <div style={{ display: "grid", gap: 18 }}>
          {/* BLOQUE 1 — resumen principal */}
          <Card title="Resumen">
            <div style={{ display: "grid", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>
                    Reserva ID
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--color-text)",
                      wordBreak: "break-all",
                      marginTop: 2,
                    }}
                  >
                    {detailReserva.id}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>Estado</div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 16,
                      fontWeight: 800,
                      color: "var(--color-accent)",
                    }}
                  >
                    {formatEstadoLabel(detailReserva.estado)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 8,
                  paddingTop: 4,
                  borderTop: "1px solid var(--color-border)",
                }}
              >
                {detailReservaUnitRows}
              </div>

              <div style={{ display: "grid", gap: 6, fontSize: 14, color: "var(--color-text)" }}>
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
              </div>

              <div
                style={{
                  marginTop: 4,
                  paddingTop: 12,
                  borderTop: "1px solid var(--color-border)",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)" }}>Total</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)" }}>
                  ${detailReserva.montoTotalArs.toLocaleString("es-AR")}
                </span>
              </div>
            </div>
          </Card>

          {/* BLOQUE 2 — acciones */}
          {canCreateOrCancel &&
          ((campingInventoryMode === "unit_based" && detailReserva.unitId) ||
            (detailReserva.estado !== "cancelada" && onCancelReserva)) ? (
            <Card title="Acciones">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                {canCreateOrCancel && campingInventoryMode === "unit_based" && detailReserva.unitId ? (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => {
                      onStartReassign(detailReserva.id);
                    }}
                  >
                    Cambiar unidad
                  </Button>
                ) : null}
                {canCreateOrCancel && detailReserva.estado !== "cancelada" && onCancelReserva ? (
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() => {
                      onCancelReserva(detailReserva);
                    }}
                  >
                    Cancelar reserva
                  </Button>
                ) : null}
              </div>
            </Card>
          ) : null}

          {reassigningReservaId === detailReserva.id ? (
            <div>
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

          {/* BLOQUE 3 — estado económico */}
          {detailReserva.unitChangeAtMs &&
          detailReserva.unitChangeAdjustmentStatus &&
          typeof detailReserva.unitChangeDeltaArs === "number" ? (
            <Card title="Estado económico">
              <div
                style={{
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
                    Monto anterior: ${detailReserva.unitChangePreviousMontoArs.toLocaleString("es-AR")}
                  </>
                ) : null}
                {" · "}
                Diferencia: ${detailReserva.unitChangeDeltaArs.toLocaleString("es-AR")}
              </div>
              {detailReserva.estado === "cancelada" ? (
                <div style={{ marginTop: 12, fontSize: 14, color: "var(--color-text)" }}>
                  <strong>Devolución:</strong>{" "}
                  {detailReserva.refundStatus === "pending_refund"
                    ? `Pendiente: $${(detailReserva.refundDeltaArs ?? 0).toLocaleString("es-AR")}${
                        typeof detailReserva.refundPercentApplied === "number"
                          ? ` (${detailReserva.refundPercentApplied}%)`
                          : ""
                      }`
                    : `Sin devolución pendiente${
                        typeof detailReserva.refundPercentApplied === "number"
                          ? ` (${detailReserva.refundPercentApplied}%)`
                          : ""
                      }`}
                </div>
              ) : null}
            </Card>
          ) : detailReserva.estado === "cancelada" ? (
            <Card title="Estado económico">
              <div style={{ fontSize: 14, color: "var(--color-text)" }}>
                <strong>Devolución:</strong>{" "}
                {detailReserva.refundStatus === "pending_refund"
                  ? `Pendiente: $${(detailReserva.refundDeltaArs ?? 0).toLocaleString("es-AR")}${
                      typeof detailReserva.refundPercentApplied === "number"
                        ? ` (${detailReserva.refundPercentApplied}%)`
                        : ""
                    }`
                  : `Sin devolución pendiente${
                      typeof detailReserva.refundPercentApplied === "number"
                        ? ` (${detailReserva.refundPercentApplied}%)`
                        : ""
                    }`}
              </div>
            </Card>
          ) : null}

          {/* BLOQUE 4 — datos del huésped */}
          <Card title="Huésped">
            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 800, color: "var(--color-accent)", fontSize: 16 }}>
                  {detailReserva.titularNombre}
                </div>
                {!hideGuestPii ? (
                  <div style={{ color: "var(--color-text-muted)", marginTop: 4, fontSize: 14 }}>
                    {detailReserva.titularEmail}
                  </div>
                ) : null}
              </div>

              {/* PII: ocultar a viewer / viewer_global */}
              {hideGuestPii ? (
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

              <div style={{ paddingTop: 6, borderTop: "1px solid var(--color-border)" }}>
                <strong>Personas:</strong> {detailReserva.adultos} adultos / {detailReserva.menores} menores
              </div>
            </div>
          </Card>

          {/* BLOQUE 5 — metadata */}
          <Card title="Registro y pagos">
            <div style={{ display: "grid", gap: 8 }}>
              <div style={metaRowStyle}>
                <strong style={{ color: "var(--color-text)" }}>Origen:</strong>{" "}
                {formatOrigenLabel(detailReserva.createdByMode ?? "")}
              </div>
              <div style={metaRowStyle}>
                <strong style={{ color: "var(--color-text)" }}>Creada:</strong>{" "}
                {new Date(detailReserva.createdAtMs).toLocaleString("es-AR")}
              </div>

              {detailReserva.expiresAtMs ? (
                <div style={metaRowStyle}>
                  <strong style={{ color: "var(--color-text)" }}>Vence:</strong>{" "}
                  {new Date(detailReserva.expiresAtMs).toLocaleString("es-AR")}
                </div>
              ) : null}

              {detailReserva.paidAtMs ? (
                <div style={metaRowStyle}>
                  <strong style={{ color: "var(--color-text)" }}>Pagada:</strong>{" "}
                  {new Date(detailReserva.paidAtMs).toLocaleString("es-AR")}
                </div>
              ) : null}

              {detailReserva.paymentStatus ? (
                <div style={metaRowStyle}>
                  <strong style={{ color: "var(--color-text)" }}>Payment status:</strong>{" "}
                  {detailReserva.paymentStatus}
                </div>
              ) : null}

              {detailReserva.mpPreferenceId ? (
                <div style={metaRowStyle}>
                  <strong style={{ color: "var(--color-text)" }}>MP Preference:</strong>{" "}
                  {detailReserva.mpPreferenceId}
                </div>
              ) : null}

              {detailReserva.mpPaymentId ? (
                <div style={metaRowStyle}>
                  <strong style={{ color: "var(--color-text)" }}>MP Payment:</strong>{" "}
                  {detailReserva.mpPaymentId}
                </div>
              ) : null}

              {detailReserva.cancelMotivo ? (
                <div style={{ ...metaRowStyle, marginTop: 4 }}>
                  <strong style={{ color: "var(--color-text)" }}>Motivo cancelación:</strong>{" "}
                  {detailReserva.cancelMotivo}
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      ) : null}
    </Modal>
  );
}
