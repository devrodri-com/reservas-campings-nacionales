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

function formatPaymentStatusEs(status: string): string {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "approved":
      return "Aprobado";
    case "rejected":
      return "Rechazado";
    case "cancelled":
      return "Anulado";
    default:
      return status;
  }
}

const metaRowStyle: CSSProperties = {
  fontSize: 13,
  color: "var(--color-text-muted)",
  lineHeight: 1.5,
};

const summaryHeroRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
};

const summaryDatesStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  fontSize: 15,
  color: "var(--color-text)",
  lineHeight: 1.45,
};

const summaryLabelStrong: CSSProperties = {
  fontWeight: 700,
  color: "var(--color-text)",
};

const reservaIdFootnoteStyle: CSSProperties = {
  marginTop: 10,
  paddingTop: 10,
  borderTop: "1px solid var(--color-border)",
  fontSize: 11,
  color: "var(--color-text-muted)",
  lineHeight: 1.4,
  wordBreak: "break-all",
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
            <div style={{ display: "grid", gap: 14 }}>
              <div style={summaryHeroRowStyle}>
                <div style={{ minWidth: 0, flex: "1 1 140px" }}>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600, letterSpacing: 0.02 }}>
                    Estado
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 17,
                      fontWeight: 800,
                      color: "var(--color-accent)",
                      lineHeight: 1.2,
                    }}
                  >
                    {formatEstadoLabel(detailReserva.estado)}
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 0, flex: "1 1 140px" }}>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600, letterSpacing: 0.02 }}>
                    Total
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 22,
                      fontWeight: 800,
                      color: "var(--color-text)",
                      lineHeight: 1.2,
                    }}
                  >
                    ${detailReserva.montoTotalArs.toLocaleString("es-AR")}
                  </div>
                </div>
              </div>

              {detailReservaUnitRows ? (
                <div
                  style={{
                    display: "grid",
                    gap: 8,
                    paddingTop: 4,
                    borderTop: "1px solid var(--color-border)",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--color-text)",
                    lineHeight: 1.45,
                  }}
                >
                  {detailReservaUnitRows}
                </div>
              ) : null}

              <div
                style={{
                  ...summaryDatesStyle,
                  paddingTop: 12,
                  borderTop: "1px solid var(--color-border)",
                }}
              >
                <div>
                  <span style={summaryLabelStrong}>Fechas</span>
                  <span style={{ color: "var(--color-text-muted)", fontWeight: 500 }}> · </span>
                  <span style={{ fontWeight: 700 }}>
                    {formatYmdToDmy(detailReserva.checkInDate)} → {formatYmdToDmy(detailReserva.checkOutDate)}
                  </span>
                </div>
                <div>
                  <span style={summaryLabelStrong}>Noches</span>
                  <span style={{ color: "var(--color-text-muted)", fontWeight: 500 }}> · </span>
                  <span style={{ fontWeight: 700 }}>
                    {enumerateNights(detailReserva.checkInDate, detailReserva.checkOutDate).length}
                  </span>
                </div>
                {campingInventoryMode !== "unit_based" ? (
                  <div>
                    <span style={summaryLabelStrong}>Parcelas</span>
                    <span style={{ color: "var(--color-text-muted)", fontWeight: 500 }}> · </span>
                    <span style={{ fontWeight: 700 }}>{detailReserva.parcelas}</span>
                  </div>
                ) : null}
              </div>

              <div style={reservaIdFootnoteStyle}>
                <span style={{ fontWeight: 600 }}>Referencia interna</span>
                <span style={{ color: "var(--color-text-muted)", fontWeight: 500 }}> · </span>
                {detailReserva.id}
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
                  <strong style={{ color: "var(--color-text)" }}>Pagada el:</strong>{" "}
                  {new Date(detailReserva.paidAtMs).toLocaleString("es-AR")}
                </div>
              ) : null}

              {detailReserva.paymentStatus ? (
                <div style={metaRowStyle}>
                  <strong style={{ color: "var(--color-text)" }}>Estado del pago (pasarela):</strong>{" "}
                  {formatPaymentStatusEs(detailReserva.paymentStatus)}
                </div>
              ) : null}

              {detailReserva.mpPreferenceId ? (
                <div style={metaRowStyle}>
                  <strong style={{ color: "var(--color-text)" }}>Preferencia Mercado Pago:</strong>{" "}
                  {detailReserva.mpPreferenceId}
                </div>
              ) : null}

              {detailReserva.mpPaymentId ? (
                <div style={metaRowStyle}>
                  <strong style={{ color: "var(--color-text)" }}>Pago Mercado Pago (ID):</strong>{" "}
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
