"use client";

import { useMemo, useState, useCallback } from "react";
import type { User } from "firebase/auth";
import { doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/types/user";
import type { Reserva, UnitChangeAdjustmentStatus } from "@/types/reserva";
import type { Camping } from "@/types/camping";
import type { Unit } from "@/types/unit";
import type { UnitType } from "@/types/unitType";
import type { UnitBlock } from "@/types/unitBlock";
import type { SelectOption } from "@/components/SelectDropdown";
import type { UnitChangePreview } from "@/components/admin/AdminReservationUnitChangePanel";
import { fetchUnitsByCamping } from "@/lib/unitsRepo";
import {
  unitAvailableForReservaRange,
  computeReservaUnitBasedMontoTotalArs,
  formatWalkInUnitOptionLabel,
} from "@/lib/adminUnitReassignSupport";

const OLD_UNIT_NEXT_STATUS_OPTIONS: SelectOption[] = [
  { value: "available", label: "Disponible" },
  { value: "blocked", label: "Bloqueada" },
  { value: "maintenance", label: "Mantenimiento" },
];

export type UseAdminReservaDetailModalArgs = {
  user: User | null;
  profile: UserProfile | null;
  detailReserva: Reserva | null;
  setDetailReserva: (r: Reserva | null) => void;
  detailCamping: Camping | null;
  units: Unit[];
  unitTypeById: Map<string, UnitType>;
  unitBlocks: UnitBlock[];
  reservasCamping: Reserva[];
  fetchReservasForCamping: (campingId: string) => Promise<Reserva[]>;
  onReservasCampingRefreshed: (list: Reserva[]) => void;
  onUnitsRefreshed: (units: Unit[]) => void;
  onReloadAllReservas: () => Promise<void>;
  setError: (msg: string | null) => void;
};

export function useAdminReservaDetailModal({
  user,
  profile,
  detailReserva,
  setDetailReserva,
  detailCamping,
  units,
  unitTypeById,
  unitBlocks,
  reservasCamping,
  fetchReservasForCamping,
  onReservasCampingRefreshed,
  onUnitsRefreshed,
  onReloadAllReservas,
  setError,
}: UseAdminReservaDetailModalArgs) {
  const [reassigningReservaId, setReassigningReservaId] = useState<string | null>(null);
  const [reassignTargetUnitId, setReassignTargetUnitId] = useState("");
  const [oldUnitNextStatus, setOldUnitNextStatus] = useState<"available" | "blocked" | "maintenance">(
    "available"
  );
  const [busy, setBusy] = useState(false);

  const detailReservaUnitRows = useMemo(() => {
    if (!detailReserva || (!detailReserva.unitId && !detailReserva.unitTypeId)) return null;
    const reservaUnit = detailReserva.unitId
      ? units.find((u) => u.id === detailReserva.unitId)
      : undefined;
    const reservaUnitType =
      (detailReserva.unitTypeId ? unitTypeById.get(detailReserva.unitTypeId) : undefined) ??
      (reservaUnit ? unitTypeById.get(reservaUnit.unitTypeId) : undefined);
    return (
      <>
        <div>
          <strong>Unidad:</strong> {reservaUnit?.displayName ?? detailReserva.unitId ?? "—"}
        </div>
        <div>
          <strong>Tipo de unidad:</strong> {reservaUnitType?.name ?? "—"}
        </div>
      </>
    );
  }, [detailReserva, units, unitTypeById]);

  const reassignUnitOptions: SelectOption[] = useMemo(() => {
    if (!detailReserva?.unitId || !detailCamping || detailCamping.inventoryMode !== "unit_based")
      return [];
    const current = units.find((u) => u.id === detailReserva.unitId);
    if (!current) return [];

    const { checkInDate, checkOutDate } = detailReserva;
    const headcount = detailReserva.adultos + detailReserva.menores;
    const maxPerParcela = detailCamping.maxPersonasPorParcela;

    return units
      .filter((u) => {
        if (u.campingId !== detailCamping.id || u.id === current.id) return false;
        const cap = unitTypeById.get(u.unitTypeId)?.capacityMax ?? maxPerParcela;
        if (cap < headcount) return false;
        return unitAvailableForReservaRange(
          u,
          reservasCamping,
          unitBlocks,
          checkInDate,
          checkOutDate,
          detailReserva.id
        );
      })
      .map((unit) => ({
        value: unit.id,
        label: formatWalkInUnitOptionLabel(unit, unitTypeById.get(unit.unitTypeId)),
      }));
  }, [detailReserva, detailCamping, units, reservasCamping, unitBlocks, unitTypeById]);

  const currentUnitChangeSummary = useMemo(() => {
    if (!detailReserva?.unitId) return "—";
    const u = units.find((x) => x.id === detailReserva.unitId);
    const t =
      (u ? unitTypeById.get(u.unitTypeId) : undefined) ??
      (detailReserva.unitTypeId ? unitTypeById.get(detailReserva.unitTypeId) : undefined);
    return `${u?.displayName ?? detailReserva.unitId} (${t?.name ?? "Tipo"})`;
  }, [detailReserva, units, unitTypeById]);

  const unitChangePreview: UnitChangePreview | null = useMemo(() => {
    if (!detailReserva?.unitId || !detailCamping || detailCamping.inventoryMode !== "unit_based")
      return null;
    if (!reassignTargetUnitId.trim()) return null;
    const newUnit = units.find((u) => u.id === reassignTargetUnitId);
    if (!newUnit) return null;

    const newUt = unitTypeById.get(newUnit.unitTypeId);
    const newTotal = computeReservaUnitBasedMontoTotalArs(detailReserva, newUnit, unitTypeById);
    const priceCalculable = newTotal !== null;
    const currentTotalArs = detailReserva.montoTotalArs;
    const newTotalArs = newTotal ?? 0;
    const deltaArs = priceCalculable && newTotal !== null ? newTotal - currentTotalArs : 0;

    return {
      currentTotalArs,
      newTotalArs,
      deltaArs,
      newUnitSummary: `${newUnit.displayName} (${newUt?.name ?? "Tipo"})`,
      priceCalculable,
    };
  }, [detailReserva, detailCamping, reassignTargetUnitId, units, unitTypeById]);

  const resetReassignUi = useCallback(() => {
    setReassigningReservaId(null);
    setReassignTargetUnitId("");
    setOldUnitNextStatus("available");
  }, []);

  const handleReassignReserva = async () => {
    if (profile?.role === "viewer" || profile?.role === "viewer_global") return;
    if (!detailReserva || !detailCamping) return;

    setError(null);

    if (!reassignTargetUnitId.trim()) {
      setError("Debés seleccionar una unidad de destino.");
      return;
    }

    const oldUnit = detailReserva.unitId
      ? units.find((u) => u.id === detailReserva.unitId)
      : undefined;
    const newUnit = units.find((u) => u.id === reassignTargetUnitId);

    if (!oldUnit || !newUnit) {
      setError("No se pudo reasignar la reserva.");
      return;
    }
    const headcount = detailReserva.adultos + detailReserva.menores;
    const newCap =
      unitTypeById.get(newUnit.unitTypeId)?.capacityMax ?? detailCamping.maxPersonasPorParcela;
    if (newCap < headcount) {
      setError("La unidad elegida no admite la cantidad de personas de esta reserva.");
      return;
    }

    if (
      !unitAvailableForReservaRange(
        newUnit,
        reservasCamping,
        unitBlocks,
        detailReserva.checkInDate,
        detailReserva.checkOutDate,
        detailReserva.id
      )
    ) {
      setError("La unidad de destino ya no está disponible en ese rango.");
      return;
    }

    const newMontoTotal = computeReservaUnitBasedMontoTotalArs(
      detailReserva,
      newUnit,
      unitTypeById
    );
    if (newMontoTotal === null) {
      setError("No se pudo calcular el precio para la unidad elegida.");
      return;
    }

    const previousMonto = detailReserva.montoTotalArs;
    const delta = newMontoTotal - previousMonto;
    const unitChangeAdjustmentStatus: UnitChangeAdjustmentStatus =
      delta > 0 ? "pending_charge" : delta < 0 ? "pending_refund" : "none";

    setBusy(true);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "reservas", detailReserva.id), {
        unitId: newUnit.id,
        unitTypeId: newUnit.unitTypeId,
        reassignedFromUnitId: oldUnit.id,
        montoTotalArs: newMontoTotal,
        unitChangePreviousUnitId: oldUnit.id,
        unitChangePreviousMontoArs: previousMonto,
        unitChangeDeltaArs: delta,
        unitChangeAdjustmentStatus,
        unitChangeAtMs: Date.now(),
        ...(user?.uid ? { unitChangeByUid: user.uid } : {}),
      });
      batch.update(doc(db, "units", oldUnit.id), {
        operationalStatus: oldUnitNextStatus,
      });
      batch.update(doc(db, "reservas_public", detailReserva.id), {
        unitId: newUnit.id,
        unitTypeId: newUnit.unitTypeId,
      });
      await batch.commit();

      const [items, refreshedUnits] = await Promise.all([
        fetchReservasForCamping(detailCamping.id),
        fetchUnitsByCamping(detailCamping.id),
      ]);
      onReservasCampingRefreshed(items);
      onUnitsRefreshed(refreshedUnits);
      await onReloadAllReservas();

      const updated = items.find((r) => r.id === detailReserva.id);
      if (updated) setDetailReserva(updated);

      resetReassignUi();
    } catch {
      setError("No se pudo reasignar la reserva.");
    } finally {
      setBusy(false);
    }
  };

  return {
    busy,
    reassigningReservaId,
    reassignTargetUnitId,
    oldUnitNextStatus,
    detailReservaUnitRows,
    reassignUnitOptions,
    oldUnitNextStatusOptions: OLD_UNIT_NEXT_STATUS_OPTIONS,
    currentUnitChangeSummary,
    unitChangePreview,
    setReassigningReservaId,
    setReassignTargetUnitId,
    setOldUnitNextStatus,
    resetReassignUi,
    handleReassignReserva,
  };
}
