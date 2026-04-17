import type { Camping } from "@/types/camping";
import type { RefundStatus } from "@/types/reserva";
import { isYmd, parseYmd, todayYmd } from "@/lib/dates";

export type CancellationRefundResult = {
  refundPercentApplied: number;
  refundDeltaArs: number;
  refundStatus: RefundStatus;
};

function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** Días calendario desde `fromYmd` (00:00) hasta `toYmd` (00:00), excluyendo hora del día. */
export function calendarDaysFromTo(fromYmd: string, toYmd: string): number {
  const a = parseYmd(fromYmd);
  const b = parseYmd(toYmd);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return NaN;
  const msPerDay = 86400000;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

/**
 * Calcula devolución por cancelación según política del camping y fecha original de check-in.
 * - Si no estaba pagada: sin devolución.
 * - Si política deshabilitada o datos incompletos: 100 % del monto si estaba pagada.
 * - Si política habilitada: compara días hasta `originalCheckInDate` (o fallback) vs umbral.
 */
export function computeCancellationRefund(input: {
  camping: Camping | null | undefined;
  wasPaid: boolean;
  montoTotalArs: number;
  originalCheckInDate?: string;
  fallbackCheckInDate: string;
  /** Inyectable para tests; por defecto hoy en zona local. */
  todayYmdValue?: string;
}): CancellationRefundResult {
  if (!input.wasPaid) {
    return { refundPercentApplied: 0, refundDeltaArs: 0, refundStatus: "none" };
  }

  const monto = Math.max(0, Math.round(input.montoTotalArs));
  const today = input.todayYmdValue ?? todayYmd();

  const effectiveOriginal =
    input.originalCheckInDate && isYmd(input.originalCheckInDate)
      ? input.originalCheckInDate
      : input.fallbackCheckInDate;

  const c = input.camping;
  const policyOn = Boolean(c?.cancellationPolicyEnabled);

  let percent = 100;

  if (policyOn && c) {
    const th = c.cancellationRefundDaysThreshold;
    const before = c.cancellationRefundPercentBeforeThreshold;
    const after = c.cancellationRefundPercentAfterThreshold;
    if (
      typeof th === "number" &&
      Number.isFinite(th) &&
      typeof before === "number" &&
      Number.isFinite(before) &&
      typeof after === "number" &&
      Number.isFinite(after)
    ) {
      const days = calendarDaysFromTo(today, effectiveOriginal);
      if (!Number.isFinite(days)) {
        percent = 100;
      } else {
        percent = days >= th ? before : after;
      }
    }
  }

  percent = clampPercent(percent);
  const delta = Math.round((monto * percent) / 100);
  const refundStatus: RefundStatus = delta > 0 ? "pending_refund" : "none";

  return {
    refundPercentApplied: percent,
    refundDeltaArs: delta,
    refundStatus,
  };
}
