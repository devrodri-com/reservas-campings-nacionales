import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Reserva, ReservaEstado, CreatedByMode, RefundStatus } from "@/types/reserva";

type ReservaDoc = Omit<Reserva, "id">;

function isReservaEstado(v: unknown): v is ReservaEstado {
  return (
    v === "pendiente_pago" ||
    v === "pagada" ||
    v === "fallida" ||
    v === "cancelada"
  );
}

function isCreatedByMode(v: unknown): v is CreatedByMode {
  return v === "public" || v === "admin";
}

function isRefundStatus(v: unknown): v is RefundStatus {
  return v === "none" || v === "pending_refund" || v === "resolved";
}

function isReservaDoc(v: unknown): v is ReservaDoc {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;

  return (
    typeof o.campingId === "string" &&
    typeof o.checkInDate === "string" &&
    typeof o.checkOutDate === "string" &&
    typeof o.parcelas === "number" &&
    typeof o.adultos === "number" &&
    typeof o.menores === "number" &&
    typeof o.titularNombre === "string" &&
    typeof o.titularEmail === "string" &&
    typeof o.titularTelefono === "string" &&
    typeof o.titularEdad === "number" &&
    isReservaEstado(o.estado) &&
    typeof o.montoTotalArs === "number" &&
    typeof o.createdAtMs === "number" &&
    (o.createdByUid === undefined || typeof o.createdByUid === "string") &&
    (o.createdByMode === undefined || isCreatedByMode(o.createdByMode)) &&
    (o.paymentProvider === undefined || o.paymentProvider === "mercadopago") &&
    (o.paymentStatus === undefined ||
      (o.paymentStatus === "pending" ||
        o.paymentStatus === "approved" ||
        o.paymentStatus === "rejected" ||
        o.paymentStatus === "cancelled")) &&
    (o.mpPreferenceId === undefined || typeof o.mpPreferenceId === "string") &&
    (o.mpPaymentId === undefined || typeof o.mpPaymentId === "string") &&
    (o.paidAtMs === undefined || typeof o.paidAtMs === "number") &&
    (o.expiresAtMs === undefined || typeof o.expiresAtMs === "number") &&
    (o.originalCheckInDate === undefined || typeof o.originalCheckInDate === "string") &&
    (o.refundPercentApplied === undefined || typeof o.refundPercentApplied === "number") &&
    (o.refundDeltaArs === undefined || typeof o.refundDeltaArs === "number") &&
    (o.refundStatus === undefined || isRefundStatus(o.refundStatus)) &&
    (o.cancelledAtMs === undefined || typeof o.cancelledAtMs === "number") &&
    (o.cancelledByUid === undefined || typeof o.cancelledByUid === "string")
  );
}

export async function fetchReservaById(id: string): Promise<Reserva | null> {
  const snap = await getDoc(doc(db, "reservas", id));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!isReservaDoc(data)) return null;
  return { id: snap.id, ...data };
}

export async function fetchReservasByCamping(campingId: string): Promise<Reserva[]> {
  const snap = await getDocs(
    query(collection(db, "reservas"), where("campingId", "==", campingId))
  );

  const out: Reserva[] = [];
  snap.docs.forEach((d) => {
    const data = d.data();
    if (isReservaDoc(data)) out.push({ id: d.id, ...data });
  });

  return out;
}

// Tipo público (sin PII)
export type ReservaPublic = {
  id: string;
  campingId: string;
  checkInDate: string;
  checkOutDate: string;
  parcelas: number;
  estado: ReservaEstado;
  expiresAtMs?: number;
  createdAtMs: number;
  /** Presente en reservas por unidad (inventario unit_based). */
  unitId?: string;
  unitTypeId?: string;
};

type ReservaPublicDoc = Omit<ReservaPublic, "id">;

function isReservaPublicDoc(v: unknown): v is ReservaPublicDoc {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;

  return (
    typeof o.campingId === "string" &&
    typeof o.checkInDate === "string" &&
    typeof o.checkOutDate === "string" &&
    typeof o.parcelas === "number" &&
    isReservaEstado(o.estado) &&
    typeof o.createdAtMs === "number" &&
    (o.expiresAtMs === undefined || typeof o.expiresAtMs === "number") &&
    (o.unitId === undefined || typeof o.unitId === "string") &&
    (o.unitTypeId === undefined || typeof o.unitTypeId === "string")
  );
}

export async function fetchReservasPublicByCamping(campingId: string): Promise<ReservaPublic[]> {
  const snap = await getDocs(
    query(collection(db, "reservas_public"), where("campingId", "==", campingId))
  );

  const out: ReservaPublic[] = [];
  snap.docs.forEach((d) => {
    const data = d.data();
    if (isReservaPublicDoc(data)) out.push({ id: d.id, ...data });
  });

  return out;
}
