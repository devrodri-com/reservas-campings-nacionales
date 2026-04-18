import type { Reserva } from "@/types/reserva";
import type { Unit } from "@/types/unit";
import type { UnitType } from "@/types/unitType";
import {
  enumerateNights,
  formatMsToArgentineDateTime,
  formatYmdToDmy,
} from "@/lib/dates";

/** Encabezados alineados con la exportación de `/admin/reservas`. */
export const ADMIN_RESERVA_CSV_HEADERS = [
  "Titular",
  "Correo electrónico",
  "Teléfono",
  "Edad",
  "Camping",
  "Unidad",
  "Tipo de unidad",
  "Ingreso",
  "Salida",
  "Noches",
  "Adultos",
  "Menores",
  "Total",
  "Estado",
  "Origen",
  "Ajuste cambio de unidad",
  "Diferencia ajuste (ARS)",
  "Creada el",
  "ID reserva",
] as const;

export function formatArsAmountForCsv(n: number): string {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/** Etiqueta de estado para CSV y UI (misma semántica que el panel). */
export function estadoBadgeLabel(estado: string): string {
  switch (estado) {
    case "pagada":
      return "Pagada";
    case "pendiente_pago":
      return "Pendiente";
    case "fallida":
      return "Fallida";
    case "cancelada":
      return "Cancelada";
    default:
      return estado;
  }
}

export function origenExportLabel(mode: Reserva["createdByMode"] | undefined): string {
  if (mode === "admin") return "Administración";
  if (mode === "public") return "Web";
  return "—";
}

export function unitChangeAdjustmentExportLabel(
  status: Reserva["unitChangeAdjustmentStatus"] | undefined
): string {
  if (status === undefined || status === "none") return "Sin ajuste";
  if (status === "pending_charge") return "Cobro pendiente";
  if (status === "pending_refund") return "Devolución pendiente";
  if (status === "resolved") return "Resuelto";
  return "—";
}

/**
 * Resuelve etiquetas de unidad / tipo para exportación, alineado con el listado de reservas admin.
 */
export function resolveReservaCsvRowLabels(
  r: Reserva,
  ctx: { units: Unit[]; unitTypes: UnitType[] }
): { unitLabel: string; tipoUnidadLabel: string } {
  const typeById = new Map(ctx.unitTypes.map((t) => [t.id, t]));
  const reservaUnit = r.unitId ? ctx.units.find((u) => u.id === r.unitId) : undefined;
  const reservaUnitType =
    (r.unitTypeId ? typeById.get(r.unitTypeId) : undefined) ??
    (reservaUnit ? typeById.get(reservaUnit.unitTypeId) : undefined);
  const unitLabel = reservaUnit?.displayName ?? (r.unitId ? r.unitId : "—");
  const tipoUnidadLabel = reservaUnitType?.name ?? "—";
  return { unitLabel, tipoUnidadLabel };
}

export function reservaToCsvRow(
  r: Reserva,
  campingNombre: string,
  labels: { unitLabel: string; tipoUnidadLabel: string }
): string[] {
  const noches = String(enumerateNights(r.checkInDate, r.checkOutDate).length);
  const delta =
    typeof r.unitChangeDeltaArs === "number" ? formatArsAmountForCsv(r.unitChangeDeltaArs) : "";
  return [
    r.titularNombre,
    r.titularEmail,
    r.titularTelefono,
    String(r.titularEdad),
    campingNombre,
    labels.unitLabel,
    labels.tipoUnidadLabel,
    formatYmdToDmy(r.checkInDate),
    formatYmdToDmy(r.checkOutDate),
    noches,
    String(r.adultos),
    String(r.menores),
    formatArsAmountForCsv(r.montoTotalArs),
    estadoBadgeLabel(r.estado),
    origenExportLabel(r.createdByMode),
    unitChangeAdjustmentExportLabel(r.unitChangeAdjustmentStatus),
    delta,
    formatMsToArgentineDateTime(r.createdAtMs),
    r.id,
  ];
}
