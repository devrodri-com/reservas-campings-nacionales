"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { fetchUserProfile } from "@/lib/userProfile";
import type { Camping } from "@/types/camping";
import type { UserProfile } from "@/types/user";
import type { Reserva, ReservaEstado, CreatedByMode, RefundStatus } from "@/types/reserva";
import type { Unit } from "@/types/unit";
import type { UnitType } from "@/types/unitType";
import type { UnitBlock } from "@/types/unitBlock";
import { Button, Card } from "@/components/ui";
import { toCsv, downloadCsv } from "@/lib/csv";
import { enumerateNights } from "@/lib/dates";
import ReservaDetailModal from "@/components/admin/ReservaDetailModal";
import AdminReservationsFilters, {
  type AdminReservationsFilterValues,
} from "@/components/admin/AdminReservationsFilters";
import AdminReservationsTable, {
  type AdminReservationTableRow,
} from "@/components/admin/AdminReservationsTable";
import { useAdminReservaDetailModal } from "@/hooks/useAdminReservaDetailModal";
import { fetchUnitTypesByCamping } from "@/lib/unitTypesRepo";
import { fetchUnitsByCamping } from "@/lib/unitsRepo";
import { fetchUnitBlocksByCamping } from "@/lib/unitBlocksRepo";

type CampingDoc = Omit<Camping, "id">;

function isCampingDoc(v: unknown): v is CampingDoc {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.areaProtegida === "string" &&
    typeof o.nombre === "string" &&
    typeof o.ubicacionTexto === "string" &&
    typeof o.titular === "string" &&
    typeof o.capacidadParcelas === "number" &&
    typeof o.precioNocheArs === "number" &&
    typeof o.maxPersonasPorParcela === "number" &&
    typeof o.checkInHour === "number" &&
    typeof o.checkOutHour === "number" &&
    typeof o.activo === "boolean" &&
    (o.inventoryMode === undefined ||
      o.inventoryMode === "capacity" ||
      o.inventoryMode === "unit_based") &&
    (o.cancellationPolicyEnabled === undefined || typeof o.cancellationPolicyEnabled === "boolean") &&
    (o.cancellationRefundDaysThreshold === undefined ||
      typeof o.cancellationRefundDaysThreshold === "number") &&
    (o.cancellationRefundPercentBeforeThreshold === undefined ||
      typeof o.cancellationRefundPercentBeforeThreshold === "number") &&
    (o.cancellationRefundPercentAfterThreshold === undefined ||
      typeof o.cancellationRefundPercentAfterThreshold === "number")
  );
}

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

async function fetchReservasForCampingId(campingId: string): Promise<Reserva[]> {
  const resSnap = await getDocs(
    query(collection(db, "reservas"), where("campingId", "==", campingId))
  );
  const items: Reserva[] = [];
  resSnap.docs.forEach((d) => {
    const data = d.data();
    if (isReservaDoc(data)) items.push({ id: d.id, ...data });
  });
  items.sort((a, b) => b.createdAtMs - a.createdAtMs);
  return items;
}

async function fetchAllReservasDocs(): Promise<Reserva[]> {
  const resSnap = await getDocs(collection(db, "reservas"));
  const items: Reserva[] = [];
  resSnap.docs.forEach((d) => {
    const data = d.data();
    if (isReservaDoc(data)) items.push({ id: d.id, ...data });
  });
  items.sort((a, b) => b.createdAtMs - a.createdAtMs);
  return items;
}

function stayOverlapsRange(checkIn: string, checkOut: string, from: string, to: string): boolean {
  return checkIn <= to && checkOut >= from;
}

function estadoBadgeLabel(estado: string): string {
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

function origenModalLabel(origen: string): string {
  if (origen === "admin") return "Admin";
  if (origen === "public") return "Web";
  return origen || "-";
}

const EMPTY_FILTERS: AdminReservationsFilterValues = {
  campingId: "",
  dateFrom: "",
  dateTo: "",
  estado: "",
  origen: "",
};

export default function AdminReservasPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [campings, setCampings] = useState<Camping[]>([]);
  const [allReservas, setAllReservas] = useState<Reserva[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterValues, setFilterValues] = useState<AdminReservationsFilterValues>(EMPTY_FILTERS);
  const [unitsByCampingId, setUnitsByCampingId] = useState<Map<string, Unit[]>>(new Map());
  const [unitTypesByCampingId, setUnitTypesByCampingId] = useState<Map<string, UnitType[]>>(
    new Map()
  );

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailReserva, setDetailReserva] = useState<Reserva | null>(null);
  const [detailInventory, setDetailInventory] = useState<{
    units: Unit[];
    unitTypes: UnitType[];
    unitBlocks: UnitBlock[];
    reservasCamping: Reserva[];
    loading: boolean;
  }>({ units: [], unitTypes: [], unitBlocks: [], reservasCamping: [], loading: false });

  const [exportBusy, setExportBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/admin/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) {
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setProfileLoading(true);
      const p = await fetchUserProfile(user.uid);
      if (!cancelled) {
        setProfile(p);
        setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (profile?.role === "admin_camping" && profile.campingId) {
      setFilterValues((prev) => ({ ...prev, campingId: profile.campingId ?? "" }));
    }
  }, [profile]);

  const reloadAllReservas = useCallback(async () => {
    if (!profile || !profile.activo) return;
    if (profile.role === "admin_camping") {
      if (!profile.campingId) return;
      const list = await fetchReservasForCampingId(profile.campingId);
      setAllReservas(list);
      return;
    }
    const list = await fetchAllReservasDocs();
    setAllReservas(list);
  }, [profile]);

  useEffect(() => {
    if (!user || !profile || !profile.activo) return;

    let cancelled = false;
    (async () => {
      setDataLoading(true);
      setError(null);
      try {
        const campSnap = await getDocs(collection(db, "campings"));
        const list: Camping[] = [];
        campSnap.docs.forEach((d) => {
          const data = d.data();
          if (isCampingDoc(data)) list.push({ id: d.id, ...data });
        });
        list.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        if (cancelled) return;
        setCampings(list);

        if (profile.role === "admin_camping") {
          if (!profile.campingId) {
            setAllReservas([]);
            return;
          }
          const res = await fetchReservasForCampingId(profile.campingId);
          if (!cancelled) setAllReservas(res);
        } else {
          const res = await fetchAllReservasDocs();
          if (!cancelled) setAllReservas(res);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, profile]);

  useEffect(() => {
    if (!profile || !profile.activo || campings.length === 0) return;
    let cancelled = false;
    (async () => {
      const ub = new Map<string, Unit[]>();
      const ut = new Map<string, UnitType[]>();
      for (const c of campings) {
        if (c.inventoryMode !== "unit_based") continue;
        try {
          const [units, types] = await Promise.all([
            fetchUnitsByCamping(c.id),
            fetchUnitTypesByCamping(c.id),
          ]);
          ub.set(c.id, units);
          ut.set(c.id, types);
        } catch {
          /* skip camping on error */
        }
        if (cancelled) return;
      }
      if (!cancelled) {
        setUnitsByCampingId(ub);
        setUnitTypesByCampingId(ut);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, campings]);

  const campingsById = useMemo(() => {
    const m = new Map<string, Camping>();
    campings.forEach((c) => m.set(c.id, c));
    return m;
  }, [campings]);

  const effectiveCampingFilter = useMemo(() => {
    if (profile?.role === "admin_camping" && profile.campingId) return profile.campingId;
    return filterValues.campingId;
  }, [profile, filterValues.campingId]);

  const filteredReservas = useMemo(() => {
    let list = allReservas;

    if (effectiveCampingFilter.trim()) {
      list = list.filter((r) => r.campingId === effectiveCampingFilter);
    }

    if (filterValues.estado) {
      list = list.filter((r) => r.estado === filterValues.estado);
    }

    if (filterValues.origen) {
      list = list.filter((r) => (r.createdByMode ?? "") === filterValues.origen);
    }

    if (filterValues.dateFrom.trim() && filterValues.dateTo.trim()) {
      list = list.filter((r) =>
        stayOverlapsRange(r.checkInDate, r.checkOutDate, filterValues.dateFrom, filterValues.dateTo)
      );
    } else if (filterValues.dateFrom.trim()) {
      list = list.filter((r) => r.checkOutDate >= filterValues.dateFrom);
    } else if (filterValues.dateTo.trim()) {
      list = list.filter((r) => r.checkInDate <= filterValues.dateTo);
    }

    return list;
  }, [allReservas, effectiveCampingFilter, filterValues]);

  const tableRows: AdminReservationTableRow[] = useMemo(() => {
    return filteredReservas.map((r) => {
      const campingNombre = campingsById.get(r.campingId)?.nombre ?? r.campingId;
      const units = unitsByCampingId.get(r.campingId) ?? [];
      const types = unitTypesByCampingId.get(r.campingId) ?? [];
      const typeById = new Map(types.map((t) => [t.id, t]));
      const reservaUnit = r.unitId ? units.find((u) => u.id === r.unitId) : undefined;
      const reservaUnitType =
        (r.unitTypeId ? typeById.get(r.unitTypeId) : undefined) ??
        (reservaUnit ? typeById.get(reservaUnit.unitTypeId) : undefined);
      const unitLabel = reservaUnit?.displayName ?? (r.unitId ? r.unitId : "—");
      const tipoUnidadLabel = reservaUnitType?.name ?? "—";
      return { reserva: r, campingNombre, unitLabel, tipoUnidadLabel };
    });
  }, [filteredReservas, campingsById, unitsByCampingId, unitTypesByCampingId]);

  const detailCamping = useMemo(() => {
    if (!detailReserva) return null;
    return campingsById.get(detailReserva.campingId) ?? null;
  }, [detailReserva, campingsById]);

  const detailUnitTypeById = useMemo(() => {
    const m = new Map<string, UnitType>();
    detailInventory.unitTypes.forEach((t) => m.set(t.id, t));
    return m;
  }, [detailInventory.unitTypes]);

  useEffect(() => {
    if (!detailOpen || !detailReserva) {
      setDetailInventory({
        units: [],
        unitTypes: [],
        unitBlocks: [],
        reservasCamping: [],
        loading: false,
      });
      return;
    }
    const camp = campingsById.get(detailReserva.campingId);
    if (!camp) return;

    let cancelled = false;
    (async () => {
      setDetailInventory((s) => ({ ...s, loading: true }));
      try {
        const resCamp = await fetchReservasForCampingId(detailReserva.campingId);
        if (cancelled) return;
        if (camp.inventoryMode === "unit_based") {
          const [types, us, blocks] = await Promise.all([
            fetchUnitTypesByCamping(camp.id),
            fetchUnitsByCamping(camp.id),
            fetchUnitBlocksByCamping(camp.id),
          ]);
          if (cancelled) return;
          setDetailInventory({
            units: us,
            unitTypes: types,
            unitBlocks: blocks,
            reservasCamping: resCamp,
            loading: false,
          });
        } else {
          setDetailInventory({
            units: [],
            unitTypes: [],
            unitBlocks: [],
            reservasCamping: resCamp,
            loading: false,
          });
        }
      } catch {
        if (!cancelled) {
          setDetailInventory({
            units: [],
            unitTypes: [],
            unitBlocks: [],
            reservasCamping: [],
            loading: false,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [detailOpen, detailReserva, campingsById]);

  const onReservasCampingRefreshed = useCallback((list: Reserva[]) => {
    setDetailInventory((s) => ({ ...s, reservasCamping: list }));
  }, []);

  const onUnitsRefreshed = useCallback((units: Unit[]) => {
    setDetailInventory((s) => ({ ...s, units }));
  }, []);

  const {
    busy: detailBusy,
    reassigningReservaId,
    reassignTargetUnitId,
    oldUnitNextStatus,
    detailReservaUnitRows,
    reassignUnitOptions,
    oldUnitNextStatusOptions,
    currentUnitChangeSummary,
    unitChangePreview,
    setReassigningReservaId,
    setReassignTargetUnitId,
    setOldUnitNextStatus,
    resetReassignUi,
    handleReassignReserva,
  } = useAdminReservaDetailModal({
    user,
    profile,
    detailReserva,
    setDetailReserva,
    detailCamping,
    units: detailInventory.units,
    unitTypeById: detailUnitTypeById,
    unitBlocks: detailInventory.unitBlocks,
    reservasCamping: detailInventory.reservasCamping,
    fetchReservasForCamping: fetchReservasForCampingId,
    onReservasCampingRefreshed,
    onUnitsRefreshed,
    onReloadAllReservas: reloadAllReservas,
    setError,
  });

  const openDetail = (r: Reserva) => {
    setDetailReserva(r);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailReserva(null);
    resetReassignUi();
  };

  const canCreateOrCancel = profile ? profile.role !== "viewer" : false;

  const exportCsv = () => {
    setExportBusy(true);
    try {
      const header = [
        "reservaId",
        "createdAt",
        "camping",
        "titularNombre",
        "titularEmail",
        "titularTelefono",
        "edad",
        "checkInDate",
        "checkOutDate",
        "noches",
        "unidad",
        "tipoUnidad",
        "adultos",
        "menores",
        "montoTotalArs",
        "estado",
        "origen",
        "unitChangeAdjustmentStatus",
        "unitChangeDeltaArs",
      ];
      const rows: string[][] = [header];
      for (const row of tableRows) {
        const r = row.reserva;
        const noches = String(enumerateNights(r.checkInDate, r.checkOutDate).length);
        const origen = r.createdByMode === "admin" ? "walk-in" : r.createdByMode === "public" ? "web" : "";
        rows.push([
          r.id,
          new Date(r.createdAtMs).toISOString(),
          row.campingNombre,
          r.titularNombre,
          r.titularEmail,
          r.titularTelefono,
          String(r.titularEdad),
          r.checkInDate,
          r.checkOutDate,
          noches,
          row.unitLabel,
          row.tipoUnidadLabel,
          String(r.adultos),
          String(r.menores),
          String(r.montoTotalArs),
          r.estado,
          origen,
          r.unitChangeAdjustmentStatus ?? "",
          typeof r.unitChangeDeltaArs === "number" ? String(r.unitChangeDeltaArs) : "",
        ]);
      }
      const csv = toCsv(rows);
      const campingPart = effectiveCampingFilter || "todos";
      downloadCsv(`reservas-${campingPart}-${Date.now()}.csv`, csv);
    } finally {
      setExportBusy(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>Cargando…</main>
    );
  }
  if (!user) return null;

  if (!profile || !profile.activo) {
    return (
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
        <h1 style={{ color: "var(--color-accent)" }}>No autorizado</h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          No tenés permiso para acceder al panel o tu usuario está inactivo.
        </p>
        <Button
          variant="ghost"
          onClick={async () => {
            await signOut(auth);
            router.replace("/admin/login");
          }}
        >
          Cerrar sesión
        </Button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
      <h1>Reservas</h1>
      <p style={{ color: "var(--color-text-muted)" }}>Sesión: {user.email}</p>

      {error ? (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(239,68,68,0.4)",
            background: "rgba(239,68,68,0.08)",
          }}
        >
          {error}
        </div>
      ) : null}

      <AdminReservationsFilters
        profile={profile}
        campings={campings}
        values={filterValues}
        onChange={setFilterValues}
      />

      <div style={{ marginTop: 16 }}>
      <Card title={`Listado (${tableRows.length})`}>
        <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={exportCsv} disabled={exportBusy || dataLoading}>
            Exportar CSV
          </Button>
        </div>
        {dataLoading ? (
          <p style={{ color: "var(--color-text-muted)" }}>Cargando reservas…</p>
        ) : (
          <AdminReservationsTable
            rows={tableRows}
            busy={detailBusy}
            onOpenDetail={openDetail}
          />
        )}
      </Card>
      </div>

      <ReservaDetailModal
        open={detailOpen && !!detailReserva}
        detailReserva={detailReserva}
        canCreateOrCancel={canCreateOrCancel}
        campingInventoryMode={detailCamping?.inventoryMode}
        profileRole={profile.role}
        busy={detailBusy || detailInventory.loading}
        units={detailInventory.units}
        unitTypeById={detailUnitTypeById}
        detailReservaUnitRows={detailReservaUnitRows}
        reassigningReservaId={reassigningReservaId}
        reassignTargetUnitId={reassignTargetUnitId}
        oldUnitNextStatus={oldUnitNextStatus}
        reassignUnitOptions={reassignUnitOptions}
        oldUnitNextStatusOptions={oldUnitNextStatusOptions}
        unitChangePreview={unitChangePreview}
        currentUnitChangeSummary={currentUnitChangeSummary}
        formatEstadoLabel={estadoBadgeLabel}
        formatOrigenLabel={origenModalLabel}
        onClose={closeDetail}
        onStartReassign={(reservaId) => {
          setReassigningReservaId(reservaId);
          setReassignTargetUnitId("");
          setOldUnitNextStatus("available");
        }}
        onCancelReassign={resetReassignUi}
        onConfirmReassign={() => void handleReassignReserva()}
        onChangeReassignTargetUnitId={setReassignTargetUnitId}
        onChangeOldUnitNextStatus={setOldUnitNextStatus}
      />
    </main>
  );
}
