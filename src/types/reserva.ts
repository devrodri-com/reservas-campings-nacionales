export type ReservaEstado = "pendiente_pago" | "pagada" | "fallida" | "cancelada";
export type CreatedByMode = "public" | "admin";

export type BookingKind = "overnight" | "day_use";
export type CheckInStatus = "pending" | "checked_in" | "checked_out";
export type AssignedBy = "user" | "operator" | "system";

/** Ajuste económico tras cambio de unidad (admin); pagos/reembolsos fuera de alcance por ahora. */
export type UnitChangeAdjustmentStatus =
  | "none"
  | "pending_charge"
  | "pending_refund"
  | "resolved";

/** Estado de devolución por cancelación; integración de pagos fuera de alcance. */
export type RefundStatus = "none" | "pending_refund" | "resolved";

export type Reserva = {
  id: string;
  campingId: string;

  checkInDate: string;  // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD

  parcelas: number;
  adultos: number;
  menores: number;

  titularNombre: string;
  titularEmail: string;
  titularTelefono: string;
  titularEdad: number;

  estado: ReservaEstado;
  montoTotalArs: number;

  createdAtMs: number; // para ordenar sin depender de Timestamp en el cliente
  cancelMotivo?: string;
  createdByUid?: string;
  createdByMode?: CreatedByMode;

  paymentProvider?: "mercadopago";
  paymentStatus?: "pending" | "approved" | "rejected" | "cancelled";
  mpPreferenceId?: string;
  mpPaymentId?: string;
  paidAtMs?: number;
  /** Hold: hasta cuándo bloquea cupo si pendiente_pago. */
  expiresAtMs?: number;

  unitId?: string;
  unitTypeId?: string;
  bookingKind?: BookingKind;
  checkInStatus?: CheckInStatus;
  assignedBy?: AssignedBy;
  reassignedFromUnitId?: string;
  notes?: string;

  /** Trazabilidad mínima del último cambio de unidad con impacto en monto. */
  unitChangePreviousUnitId?: string;
  unitChangePreviousMontoArs?: number;
  unitChangeDeltaArs?: number;
  unitChangeAdjustmentStatus?: UnitChangeAdjustmentStatus;
  unitChangeAtMs?: number;
  unitChangeByUid?: string;

  /** Trazabilidad y ajuste económico por cancelación. */
  cancelledAtMs?: number;
  cancelledByUid?: string;
  refundDeltaArs?: number;
  refundStatus?: RefundStatus;
};
