"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { fetchUserProfile } from "@/lib/userProfile";
import type { Camping } from "@/types/camping";
import type { UserProfile } from "@/types/user";
import type { Reserva, ReservaEstado, CreatedByMode } from "@/types/reserva";
import { buildAvailabilityForRange } from "@/lib/availability";
import { addDaysYmd, todayYmd, enumerateNights, formatYmdToDmy } from "@/lib/dates";
import { toCsv, downloadCsv } from "@/lib/csv";
import { Button, Card, Table, Th, Td } from "@/components/ui";
import PhoneFieldSimple, { composePhone } from "@/components/PhoneFieldSimple";
import SelectDropdown from "@/components/SelectDropdown";
import type { SelectOption } from "@/components/SelectDropdown";
import DateRangePicker from "@/components/DateRangePicker";
import ReservaDetailModal from "@/components/admin/ReservaDetailModal";
import { SunIcon, MoonIcon } from "@/components/icons";
import { fetchUnitTypesByCamping } from "@/lib/unitTypesRepo";
import { fetchUnitsByCamping, updateUnit } from "@/lib/unitsRepo";
import {
  fetchUnitBlocksByCamping,
  createUnitBlock,
  deleteUnitBlock,
} from "@/lib/unitBlocksRepo";
import type { UnitType } from "@/types/unitType";
import type { Unit } from "@/types/unit";
import type { UnitBlock } from "@/types/unitBlock";

const DEFAULT_CAMPING_ID = "talampaya-campamento-agreste";

type UnitAvailabilityRow = {
  unit: Unit;
  isAvailable: boolean;
  reason: string;
};

function rangeAvailabilityBadge(row: Pick<UnitAvailabilityRow, "reason" | "isAvailable">): {
  text: string;
  tone: "green" | "yellow" | "red" | "gray";
} {
  if (row.isAvailable) {
    return { text: "Disponible en el rango", tone: "green" };
  }
  switch (row.reason) {
    case "Reservada":
      return { text: "Reservada en el rango", tone: "red" };
    case "Bloqueo por rango":
      return { text: "Bloqueada en el rango", tone: "yellow" };
    case "Estado operativo":
      return { text: "No disponible por estado", tone: "gray" };
    default:
      return { text: row.reason, tone: "gray" };
  }
}

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
      o.inventoryMode === "unit_based")
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
    (o.expiresAtMs === undefined || typeof o.expiresAtMs === "number")
  );
}

function unitAvailableForReservaRange(
  unit: Unit,
  reservas: Reserva[],
  unitBlocks: UnitBlock[],
  checkInDate: string,
  checkOutDate: string,
  ignoreReservaId?: string
): boolean {
  if (!unit.active) return false;
  if (unit.operationalStatus !== "available") return false;

  const blockedInRange = unitBlocks.some(
    (b) => b.unitId === unit.id && b.fromDate < checkOutDate && b.toDate > checkInDate
  );
  if (blockedInRange) return false;

  const nowMs = Date.now();
  const otherReservaBlocks = reservas.some(
    (r) =>
      r.id !== ignoreReservaId &&
      r.unitId === unit.id &&
      (r.estado === "pagada" ||
        (r.estado === "pendiente_pago" &&
          typeof r.expiresAtMs === "number" &&
          r.expiresAtMs > nowMs)) &&
      r.checkInDate < checkOutDate &&
      r.checkOutDate > checkInDate
  );
  if (otherReservaBlocks) return false;

  return true;
}

const OLD_UNIT_NEXT_STATUS_OPTIONS: SelectOption[] = [
  { value: "available", label: "Disponible" },
  { value: "blocked", label: "Bloqueada" },
  { value: "maintenance", label: "Mantenimiento" },
];

export default function AdminHomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [camping, setCamping] = useState<Camping | null>(null);
  const [campings, setCampings] = useState<Camping[]>([]);
  const [selectedCampingId, setSelectedCampingId] = useState<string>(DEFAULT_CAMPING_ID);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toDate, setToDate] = useState<string>(addDaysYmd(todayYmd(), 7));
  const [showWalkIn, setShowWalkIn] = useState(false);

  // Walk-in form state
  const [walkInCheckIn, setWalkInCheckIn] = useState<string>(addDaysYmd(todayYmd(), 1));
  const [walkInCheckOut, setWalkInCheckOut] = useState<string>(addDaysYmd(todayYmd(), 2));
  const [walkInParcelas, setWalkInParcelas] = useState<number>(1);
  const [walkInUnitId, setWalkInUnitId] = useState<string>("");
  const [walkInAdultos, setWalkInAdultos] = useState<number>(2);
  const [walkInMenores, setWalkInMenores] = useState<number>(0);
  const [walkInNombre, setWalkInNombre] = useState("");
  const [walkInEmail, setWalkInEmail] = useState("");
  const [walkInTelefonoPais, setWalkInTelefonoPais] = useState<string>("ar");
  const [walkInTelefonoNumero, setWalkInTelefonoNumero] = useState<string>("");
  const [walkInTelefonoDialManual, setWalkInTelefonoDialManual] = useState<string>("+");
  const [walkInEdad, setWalkInEdad] = useState<number>(30);

  const [fromDate, setFromDate] = useState<string>(todayYmd());
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailReserva, setDetailReserva] = useState<Reserva | null>(null);
  const [reassigningReservaId, setReassigningReservaId] = useState<string | null>(null);
  const [reassignTargetUnitId, setReassignTargetUnitId] = useState<string>("");
  const [oldUnitNextStatus, setOldUnitNextStatus] = useState<"available" | "blocked" | "maintenance">(
    "available"
  );
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitBlocks, setUnitBlocks] = useState<UnitBlock[]>([]);
  const [selectedUnitForBlock, setSelectedUnitForBlock] = useState<Unit | null>(null);
  const [blockFromDate, setBlockFromDate] = useState<string>(todayYmd());
  const [blockToDate, setBlockToDate] = useState<string>(addDaysYmd(todayYmd(), 1));

  const loadReservasForCamping = async (campingId: string): Promise<Reserva[]> => {
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
  };

  const expireStalePendings = async (reservas: Reserva[]): Promise<boolean> => {
    const now = Date.now();
    const vencidas = reservas.filter(
      (r) =>
        r.estado === "pendiente_pago" &&
        typeof r.expiresAtMs === "number" &&
        r.expiresAtMs < now
    );
    if (vencidas.length === 0) return false;

    const batch = writeBatch(db);
    for (const r of vencidas) {
      batch.update(doc(db, "reservas", r.id), { estado: "fallida" });
      batch.set(doc(db, "reservas_public", r.id), { estado: "fallida" }, { merge: true });
    }
    await batch.commit();
    return true;
  };

  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      if (stored === "dark") document.documentElement.setAttribute("data-theme", "dark");
      return;
    }
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    if (prefersDark) {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

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
      setSelectedCampingId(profile.campingId);
    }
  }, [profile]);

  useEffect(() => {
    if (!user || !profile || !profile.activo) return;

    const load = async () => {
      setError(null);

      try {
        // A) Cargar lista de campings
        const campSnap = await getDocs(collection(db, "campings"));

        const list: Camping[] = [];
        campSnap.docs.forEach((d) => {
          const data = d.data();
          if (isCampingDoc(data)) list.push({ id: d.id, ...data });
        });

        // ordenar por nombre
        list.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

        setCampings(list);

        // Si el camping seleccionado no existe, caer al primero
        const exists = list.some((c) => c.id === selectedCampingId);
        const effectiveCampingId = exists ? selectedCampingId : (list[0]?.id ?? DEFAULT_CAMPING_ID);

        if (effectiveCampingId !== selectedCampingId) {
          setSelectedCampingId(effectiveCampingId);
        }

        // B) Cargar camping seleccionado
        const selected = list.find((c) => c.id === effectiveCampingId) ?? null;
        if (!selected) {
          setError("No hay campings válidos cargados en Firestore.");
          setCamping(null);
          setReservas([]);
          setUnitTypes([]);
          setUnits([]);
          setUnitBlocks([]);
          return;
        }

        setCamping(selected);

        if (selected.inventoryMode === "unit_based") {
          const [types, us, blocks] = await Promise.all([
            fetchUnitTypesByCamping(selected.id),
            fetchUnitsByCamping(selected.id),
            fetchUnitBlocksByCamping(selected.id),
          ]);
          setUnitTypes(types);
          setUnits(us);
          setUnitBlocks(blocks);
        } else {
          setUnitTypes([]);
          setUnits([]);
          setUnitBlocks([]);
        }

        // C) Cargar reservas del camping seleccionado y expirar pendientes vencidas
        const items = await loadReservasForCamping(selected.id);
        const didExpire = await expireStalePendings(items);
        setReservas(didExpire ? await loadReservasForCamping(selected.id) : items);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, selectedCampingId]);

  const campingOptions: SelectOption[] = useMemo(
    () =>
      campings.map((c) => ({
        value: c.id,
        label: `${c.nombre} (${c.areaProtegida})`,
        description: c.ubicacionTexto,
      })),
    [campings]
  );

  const unitTypeById = useMemo(() => {
    const map = new Map<string, UnitType>();
    unitTypes.forEach((t) => map.set(t.id, t));
    return map;
  }, [unitTypes]);

  const unitOptions: SelectOption[] = useMemo(() => {
    return units
      .filter((u) => u.active)
      .map((u) => ({
        value: u.id,
        label: `${u.displayName} (${unitTypeById.get(u.unitTypeId)?.name ?? ""})`,
      }));
  }, [units, unitTypeById]);

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
    if (!detailReserva?.unitId || !camping || camping.inventoryMode !== "unit_based") return [];
    const current = units.find((u) => u.id === detailReserva.unitId);
    if (!current) return [];

    const { checkInDate, checkOutDate } = detailReserva;
    return units
      .filter(
        (u) =>
          u.campingId === camping.id &&
          u.unitTypeId === current.unitTypeId &&
          u.id !== current.id &&
          unitAvailableForReservaRange(
            u,
            reservas,
            unitBlocks,
            checkInDate,
            checkOutDate,
            detailReserva.id
          )
      )
      .map((unit) => ({
        value: unit.id,
        label: `${unit.displayName} (${unitTypeById.get(unit.unitTypeId)?.name ?? "Tipo"})`,
      }));
  }, [detailReserva, camping, units, reservas, unitBlocks, unitTypeById]);

  const reservasQueBloquean = useMemo(
    () =>
      reservas.filter(
        (r) =>
          r.estado === "pagada" ||
          (r.estado === "pendiente_pago" &&
            typeof r.expiresAtMs === "number" &&
            r.expiresAtMs > Date.now())
      ),
    [reservas]
  );

  const rangeEndDate = useMemo(() => toDate || fromDate, [toDate, fromDate]);

  const unitAvailability = useMemo((): UnitAvailabilityRow[] => {
    if (!camping || camping.inventoryMode !== "unit_based") return [];
    if (!fromDate || !rangeEndDate) return [];

    const nowMs = Date.now();

    return units.map((unit) => {
      if (unit.operationalStatus !== "available") {
        return { unit, isAvailable: false, reason: "Estado operativo" };
      }

      const blockedByRange = unitBlocks.some(
        (b) =>
          b.unitId === unit.id && b.fromDate < rangeEndDate && b.toDate > fromDate
      );
      if (blockedByRange) {
        return { unit, isAvailable: false, reason: "Bloqueo por rango" };
      }

      const hasReserva = reservas.some(
        (r) =>
          r.campingId === camping.id &&
          r.unitId === unit.id &&
          (r.estado === "pagada" ||
            (r.estado === "pendiente_pago" &&
              typeof r.expiresAtMs === "number" &&
              r.expiresAtMs > nowMs)) &&
          r.checkInDate < rangeEndDate &&
          r.checkOutDate > fromDate
      );
      if (hasReserva) {
        return { unit, isAvailable: false, reason: "Reservada" };
      }

      return { unit, isAvailable: true, reason: "Disponible" };
    });
  }, [camping, units, unitBlocks, reservas, fromDate, rangeEndDate]);

  const days = useMemo(() => {
    const n = enumerateNights(fromDate, rangeEndDate).length;
    return Math.max(1, n);
  }, [fromDate, rangeEndDate]);

  const reservasEnRango = useMemo(() => {
    // Solapa si: checkIn < rangeEnd && checkOut > fromDate
    if (!rangeEndDate || !fromDate) return [];
    return reservas.filter((r) => r.checkInDate < rangeEndDate && r.checkOutDate > fromDate);
  }, [reservas, fromDate, rangeEndDate]);

  const availability = useMemo(() => {
    if (!camping) return [];
    return buildAvailabilityForRange({
      fromDate,
      days,
      capacidadParcelas: camping.capacidadParcelas,
      reservas: reservasQueBloquean,
    });
  }, [camping, reservasQueBloquean, fromDate, days]);

  // Walk-in options
  const walkInMaxPersonas = useMemo(() => {
    const maxPer = camping?.maxPersonasPorParcela ?? 6;
    return walkInParcelas * maxPer;
  }, [camping, walkInParcelas]);

  const parcelasOptions: SelectOption[] = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;
        return { value: String(n), label: `${n} parcela${n > 1 ? "s" : ""}` };
      }),
    []
  );

  const adultosOptions: SelectOption[] = useMemo(
    () => Array.from({ length: walkInMaxPersonas + 1 }, (_, i) => ({ value: String(i), label: String(i) })),
    [walkInMaxPersonas]
  );

  const menoresOptions: SelectOption[] = useMemo(
    () => Array.from({ length: walkInMaxPersonas + 1 }, (_, i) => ({ value: String(i), label: String(i) })),
    [walkInMaxPersonas]
  );

  const edadOptions: SelectOption[] = useMemo(
    () =>
      Array.from({ length: 82 }, (_, i) => {
        const age = 18 + i;
        return { value: String(age), label: String(age) };
      }),
    []
  );

  // UI Helpers
  function Badge(props: { text: string; tone: "green" | "yellow" | "red" | "gray" | "blue" }) {
    const tones: Record<typeof props.tone, { bg: string; border: string; color: string }> = {
      green: { bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.35)", color: "var(--color-text)" },
      yellow: { bg: "rgba(234,179,8,0.15)", border: "rgba(234,179,8,0.35)", color: "var(--color-text)" },
      red: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.35)", color: "var(--color-text)" },
      gray: { bg: "rgba(148,163,184,0.15)", border: "rgba(148,163,184,0.35)", color: "var(--color-text)" },
      blue: { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.35)", color: "var(--color-text)" },
    };

    const t = tones[props.tone];

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "4px 10px",
          borderRadius: 999,
          border: `1px solid ${t.border}`,
          background: t.bg,
          color: t.color,
          fontSize: 12,
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {props.text}
      </span>
    );
  }

  function estadoBadge(estado: string): { text: string; tone: "green" | "yellow" | "red" | "gray" } {
    switch (estado) {
      case "pagada":
        return { text: "Pagada", tone: "green" };
      case "pendiente_pago":
        return { text: "Pendiente", tone: "yellow" };
      case "fallida":
        return { text: "Fallida", tone: "red" };
      case "cancelada":
        return { text: "Cancelada", tone: "gray" };
      default:
        return { text: estado, tone: "gray" };
    }
  }

  function unitStatusBadge(status: string): { text: string; tone: "green" | "yellow" | "red" | "gray" } {
    switch (status) {
      case "available":
        return { text: "Disponible", tone: "green" };
      case "blocked":
        return { text: "Bloqueada", tone: "yellow" };
      case "maintenance":
        return { text: "Mantenimiento", tone: "red" };
      default:
        return { text: status, tone: "gray" };
    }
  }

  function origenBadge(origen: string): { text: string; tone: "blue" | "gray" } {
    if (origen === "admin") return { text: "Admin", tone: "blue" };
    if (origen === "public") return { text: "Web", tone: "gray" };
    return { text: origen || "-", tone: "gray" };
  }

  const openDetail = (r: Reserva) => {
    setDetailReserva(r);
    setDetailOpen(true);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    setDetailReserva(null);
    setReassigningReservaId(null);
    setReassignTargetUnitId("");
    setOldUnitNextStatus("available");
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      window.localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      window.localStorage.setItem("theme", "light");
    }
  };

  const setUnitOperationalStatus = async (
    unitId: string,
    status: "available" | "blocked" | "maintenance"
  ) => {
    setBusy(true);
    setError(null);
    try {
      await updateUnit(unitId, { operationalStatus: status });
      if (camping?.inventoryMode === "unit_based") {
        const refreshedUnits = await fetchUnitsByCamping(camping.id);
        setUnits(refreshedUnits);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateBlock = async () => {
    if (!camping || !selectedUnitForBlock) return;

    setBusy(true);
    setError(null);

    try {
      await createUnitBlock({
        campingId: camping.id,
        unitId: selectedUnitForBlock.id,
        fromDate: blockFromDate,
        toDate: blockToDate,
        blockType: "manual_block",
        createdByUid: user?.uid ?? "admin",
      });

      const refreshed = await fetchUnitBlocksByCamping(camping.id);
      setUnitBlocks(refreshed);

      setSelectedUnitForBlock(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!camping) return;

    setBusy(true);
    setError(null);

    try {
      await deleteUnitBlock(blockId);
      const refreshed = await fetchUnitBlocksByCamping(camping.id);
      setUnitBlocks(refreshed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setBusy(false);
    }
  };

  // KPIs
  const nowMs = Date.now();

  const kpis = useMemo(() => {
    const total = reservasEnRango.length;
    const pagadas = reservasEnRango.filter((r) => r.estado === "pagada").length;
    const pendientes = reservasEnRango.filter(
      (r) => r.estado === "pendiente_pago" && typeof r.expiresAtMs === "number" && r.expiresAtMs > nowMs
    ).length;
    const canceladas = reservasEnRango.filter((r) => r.estado === "cancelada").length;
    const fallidas = reservasEnRango.filter((r) => r.estado === "fallida").length;

    // "Hoy" dentro del rango visible: usar fromDate (primer día mostrado)
    const firstDay = availability[0];
    const ocupadasHoy = firstDay ? firstDay.ocupadas : 0;
    const disponiblesHoy = firstDay ? firstDay.disponibles : 0;

    return { total, pagadas, pendientes, canceladas, fallidas, ocupadasHoy, disponiblesHoy };
  }, [reservasEnRango, availability, nowMs]);

  const createDemoReserva = async () => {
    if (!camping) return;
    setBusy(true);
    setError(null);

    try {
      const checkInDate = addDaysYmd(fromDate, 1);
      const checkOutDate = addDaysYmd(fromDate, 3);
      if (!checkInDate || !checkOutDate) {
        setError("Fecha inválida. Por favor seleccioná una fecha válida.");
        setBusy(false);
        return;
      }
      const parcelas = 1;
      const adultos = 2;
      const menores = 1;

      const montoTotalArs = camping.precioNocheArs * 2; // 2 noches demo

      const doc: ReservaDoc = {
        campingId: camping.id,
        checkInDate,
        checkOutDate,
        parcelas,
        adultos,
        menores,
        titularNombre: "Reserva Demo",
        titularEmail: "demo@demo.com",
        titularTelefono: "000000000",
        titularEdad: 30,
        estado: "pagada",
        montoTotalArs,
        createdAtMs: Date.now(),
        createdByUid: user?.uid ?? undefined,
        createdByMode: "admin",
        paymentProvider: "mercadopago",
        paymentStatus: "approved",
        paidAtMs: Date.now(),
      };

      await addDoc(collection(db, "reservas"), doc);

      // recargar reservas
      const items = await loadReservasForCamping(camping.id);
      setReservas(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setBusy(false);
    }
  };

  const cancelReserva = async (reservaId: string) => {
    const motivo = window.prompt("Motivo de cancelación (opcional):") ?? "";

    setBusy(true);
    setError(null);

    try {
      await updateDoc(doc(db, "reservas", reservaId), {
        estado: "cancelada",
        cancelMotivo: motivo.trim(),
      });
      await setDoc(doc(db, "reservas_public", reservaId), { estado: "cancelada" }, { merge: true });

      if (camping) {
        const items = await loadReservasForCamping(camping.id);
        setReservas(items);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setBusy(false);
    }
  };

  const markAsPaid = async (reservaId: string) => {
    setBusy(true);
    setError(null);
    try {
      await updateDoc(doc(db, "reservas", reservaId), {
        estado: "pagada",
        paymentStatus: "approved",
        paidAtMs: Date.now(),
        expiresAtMs: deleteField(),
      });
      await setDoc(
        doc(db, "reservas_public", reservaId),
        { estado: "pagada", paidAtMs: Date.now(), expiresAtMs: deleteField() },
        { merge: true }
      );
      if (camping) {
        const items = await loadReservasForCamping(camping.id);
        setReservas(items);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setBusy(false);
    }
  };

  const expireReserva = async (reservaId: string) => {
    setBusy(true);
    setError(null);
    try {
      await updateDoc(doc(db, "reservas", reservaId), {
        estado: "fallida",
        paymentStatus: "cancelled",
      });
      await setDoc(doc(db, "reservas_public", reservaId), { estado: "fallida" }, { merge: true });
      if (camping) {
        const items = await loadReservasForCamping(camping.id);
        setReservas(items);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setBusy(false);
    }
  };

  const handleReassignReserva = async () => {
    if (profile?.role === "viewer") return;
    if (!detailReserva || !camping) return;

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
    if (newUnit.unitTypeId !== oldUnit.unitTypeId) {
      setError("No se pudo reasignar la reserva.");
      return;
    }

    if (
      !unitAvailableForReservaRange(
        newUnit,
        reservas,
        unitBlocks,
        detailReserva.checkInDate,
        detailReserva.checkOutDate,
        detailReserva.id
      )
    ) {
      setError("La unidad de destino ya no está disponible en ese rango.");
      return;
    }

    setBusy(true);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "reservas", detailReserva.id), {
        unitId: newUnit.id,
        unitTypeId: newUnit.unitTypeId,
        reassignedFromUnitId: oldUnit.id,
      });
      batch.update(doc(db, "units", oldUnit.id), {
        operationalStatus: oldUnitNextStatus,
      });
      await batch.commit();

      const [items, refreshedUnits] = await Promise.all([
        loadReservasForCamping(camping.id),
        fetchUnitsByCamping(camping.id),
      ]);
      setReservas(items);
      setUnits(refreshedUnits);

      const updated = items.find((r) => r.id === detailReserva.id);
      if (updated) setDetailReserva(updated);

      setReassigningReservaId(null);
      setReassignTargetUnitId("");
      setOldUnitNextStatus("available");
    } catch {
      setError("No se pudo reasignar la reserva.");
    } finally {
      setBusy(false);
    }
  };

  const createWalkInReserva = async () => {
    if (!camping || !user) return;

    setBusy(true);
    setError(null);

    try {
      // Validaciones
      const noches = enumerateNights(walkInCheckIn, walkInCheckOut).length;
      if (noches < 1) {
        setError("La estadía mínima es 1 noche.");
        setBusy(false);
        return;
      }

      const isUnitBased = camping.inventoryMode === "unit_based";

      if (isUnitBased) {
        if (!walkInUnitId) {
          setError("Debés seleccionar una unidad.");
          setBusy(false);
          return;
        }
        const su = units.find((u) => u.id === walkInUnitId);
        if (!su) {
          setError("Unidad no válida.");
          setBusy(false);
          return;
        }
        const ut = unitTypeById.get(su.unitTypeId);
        const maxPorUnidad = ut?.capacityMax ?? camping.maxPersonasPorParcela;
        const totalPersonasUb = walkInAdultos + walkInMenores;
        if (totalPersonasUb <= 0) {
          setError("Debe haber al menos 1 persona.");
          setBusy(false);
          return;
        }
        if (totalPersonasUb > maxPorUnidad) {
          setError(`Excede el máximo de la unidad: ${maxPorUnidad} persona(s).`);
          setBusy(false);
          return;
        }
      } else {
        const totalPersonas = walkInAdultos + walkInMenores;
        if (totalPersonas <= 0) {
          setError("Debe haber al menos 1 persona.");
          setBusy(false);
          return;
        }

        if (totalPersonas > walkInParcelas * camping.maxPersonasPorParcela) {
          setError(`Excede el máximo: ${camping.maxPersonasPorParcela} personas por parcela.`);
          setBusy(false);
          return;
        }
      }

      if (!walkInNombre.trim() || !walkInEmail.trim() || !composePhone({ countryCode: walkInTelefonoPais, number: walkInTelefonoNumero, manualDialCode: walkInTelefonoDialManual }).trim()) {
        setError("Nombre, email y teléfono son obligatorios.");
        setBusy(false);
        return;
      }

      if (walkInEdad < 18) {
        setError("El titular debe ser mayor de edad.");
        setBusy(false);
        return;
      }

      const all = await loadReservasForCamping(camping.id);
      const bloquean = all.filter(
        (r) =>
          r.estado === "pagada" ||
          (r.estado === "pendiente_pago" &&
            typeof r.expiresAtMs === "number" &&
            r.expiresAtMs > Date.now())
      );

      const parcelasNeeded = isUnitBased ? 1 : walkInParcelas;

      if (isUnitBased) {
        const suWalkIn = units.find((u) => u.id === walkInUnitId);
        if (!suWalkIn) {
          setError("Unidad no válida.");
          setBusy(false);
          return;
        }
        if (suWalkIn.operationalStatus !== "available") {
          setError("La unidad seleccionada no está disponible por estado operativo.");
          setBusy(false);
          return;
        }
        if (
          unitBlocks.some(
            (b) =>
              b.unitId === suWalkIn.id &&
              b.fromDate < walkInCheckOut &&
              b.toDate > walkInCheckIn
          )
        ) {
          setError("La unidad seleccionada tiene un bloqueo en el rango elegido.");
          setBusy(false);
          return;
        }
        if (
          bloquean.some(
            (r) =>
              r.unitId === suWalkIn.id &&
              r.checkInDate < walkInCheckOut &&
              r.checkOutDate > walkInCheckIn
          )
        ) {
          setError("La unidad seleccionada ya está reservada en ese rango.");
          setBusy(false);
          return;
        }
      } else {
        const availability = buildAvailabilityForRange({
          fromDate: walkInCheckIn,
          days: noches,
          capacidadParcelas: camping.capacidadParcelas,
          reservas: bloquean,
        });
        const noDisponible = availability.find((d) => d.disponibles < parcelasNeeded);
        if (noDisponible) {
          setError(
            `No hay disponibilidad suficiente para ${walkInParcelas} parcela(s) el día ${noDisponible.date}.`
          );
          setBusy(false);
          return;
        }
      }

      // Crear reserva
      const selectedWalkInUnit = isUnitBased ? units.find((u) => u.id === walkInUnitId) : undefined;
      const walkInUnitType = selectedWalkInUnit ? unitTypeById.get(selectedWalkInUnit.unitTypeId) : undefined;
      const pricePerNight =
        isUnitBased && walkInUnitType ? walkInUnitType.basePriceArs : camping.precioNocheArs;
      const montoTotalArs = noches * parcelasNeeded * pricePerNight;

      const docReserva: ReservaDoc = {
        campingId: camping.id,
        checkInDate: walkInCheckIn,
        checkOutDate: walkInCheckOut,
        parcelas: isUnitBased ? 1 : walkInParcelas,
        adultos: walkInAdultos,
        menores: walkInMenores,
        titularNombre: walkInNombre.trim(),
        titularEmail: walkInEmail.trim(),
        titularTelefono: composePhone({
          countryCode: walkInTelefonoPais,
          number: walkInTelefonoNumero,
          manualDialCode: walkInTelefonoDialManual,
        }),
        titularEdad: walkInEdad,
        estado: "pagada",
        montoTotalArs,
        createdAtMs: Date.now(),
        createdByUid: user.uid,
        createdByMode: "admin",
        paymentProvider: "mercadopago",
        paymentStatus: "approved",
        paidAtMs: Date.now(),
        ...(isUnitBased && walkInUnitId
          ? {
              unitId: walkInUnitId,
              unitTypeId: selectedWalkInUnit?.unitTypeId,
              assignedBy: "operator" as const,
            }
          : {}),
      };

      await addDoc(collection(db, "reservas"), docReserva);

      // Recargar reservas
      const items = await loadReservasForCamping(camping.id);
      setReservas(items);

      // Limpiar formulario y ocultar
      setWalkInCheckIn(addDaysYmd(todayYmd(), 1));
      setWalkInCheckOut(addDaysYmd(todayYmd(), 2));
      setWalkInParcelas(1);
      setWalkInUnitId("");
      setWalkInAdultos(2);
      setWalkInMenores(0);
      setWalkInNombre("");
      setWalkInEmail("");
      setWalkInTelefonoPais("ar");
      setWalkInTelefonoNumero("");
      setWalkInTelefonoDialManual("+");
      setWalkInEdad(30);
      setShowWalkIn(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    if (!camping) return;

    const header = [
      "id",
      "estado",
      "origen",
      "camping",
      "checkIn",
      "checkOut",
      "parcelas",
      "adultos",
      "menores",
      "titularNombre",
      "titularEmail",
      "titularTelefono",
      "totalArs",
      "parque",
      "ubicacion",
      "noches",
      "totalPersonas",
      "createdAt",
      "cancelMotivo",
    ];

    const rows: string[][] = [header];

    for (const r of reservasEnRango) {
      rows.push([
        r.id,
        r.estado,
        r.createdByMode ?? "",
        camping.nombre,
        formatYmdToDmy(r.checkInDate),
        formatYmdToDmy(r.checkOutDate),
        String(r.parcelas),
        String(r.adultos),
        String(r.menores),
        r.titularNombre,
        r.titularEmail,
        r.titularTelefono,
        String(r.montoTotalArs),
        camping.areaProtegida,
        camping.ubicacionTexto,
        String(enumerateNights(r.checkInDate, r.checkOutDate).length),
        String(r.adultos + r.menores),
        new Date(r.createdAtMs).toLocaleString("es-AR"),
        r.cancelMotivo ?? "",
      ]);
    }

    const csv = toCsv(rows);

    const safeCamping = camping.nombre
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");

    const filename = `reservas-${safeCamping}-${fromDate}-a-${rangeEndDate}.csv`;

    downloadCsv(filename, csv);
  };

  const exportCsvGlobal = async () => {
    if (!campings.length) return;

    setBusy(true);
    setError(null);

    try {
      const all: Reserva[] = [];
      for (const c of campings) {
        const items = await loadReservasForCamping(c.id);
        all.push(...items);
      }

      const inRange = all.filter((r) => r.checkInDate < rangeEndDate && r.checkOutDate > fromDate);

      const campingById = new Map<string, Camping>();
      campings.forEach((c) => campingById.set(c.id, c));

      const header = [
        "campingId",
        "camping",
        "parque",
        "ubicacion",
        "id",
        "estado",
        "origen",
        "checkIn",
        "checkOut",
        "noches",
        "parcelas",
        "adultos",
        "menores",
        "totalPersonas",
        "titularNombre",
        "titularEmail",
        "titularTelefono",
        "totalArs",
        "createdAt",
        "cancelMotivo",
      ];

      const rows: string[][] = [header];

      for (const r of inRange) {
        const c = campingById.get(r.campingId);

        rows.push([
          r.campingId,
          c?.nombre ?? "",
          c?.areaProtegida ?? "",
          c?.ubicacionTexto ?? "",
          r.id,
          r.estado,
          r.createdByMode ?? "",
          formatYmdToDmy(r.checkInDate),
          formatYmdToDmy(r.checkOutDate),
          String(enumerateNights(r.checkInDate, r.checkOutDate).length),
          String(r.parcelas),
          String(r.adultos),
          String(r.menores),
          String(r.adultos + r.menores),
          r.titularNombre,
          r.titularEmail,
          r.titularTelefono,
          String(r.montoTotalArs),
          new Date(r.createdAtMs).toLocaleString("es-AR"),
          r.cancelMotivo ?? "",
        ]);
      }

      const csv = toCsv(rows);
      const filename = `reservas-global-${fromDate}-a-${rangeEndDate}.csv`;
      downloadCsv(filename, csv);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setBusy(false);
    }
  };

  if (loading || profileLoading) return <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>Cargando…</main>;
  if (!user) return null;
  if (!profile || !profile.activo) {
    return (
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
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

  const canCreateOrCancel = profile.role !== "viewer";
  const showCampingSelector = profile.role !== "admin_camping";
  const canExportGlobal = profile.role === "viewer" || profile.role === "admin_global";

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      <h1>Panel Admin</h1>
      <p>Sesión: {user.email}</p>

      <div className="admin-actions">
        <Button
          variant="ghost"
          onClick={async () => {
            await signOut(auth);
            router.replace("/admin/login");
          }}
        >
          Cerrar sesión
        </Button>

        {canCreateOrCancel ? (
          <>
            <Button
              variant="primary"
              onClick={createDemoReserva}
              disabled={busy || !camping}
            >
              {busy ? "Creando..." : "Demo"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowWalkIn(!showWalkIn)}
              disabled={busy || !camping}
            >
              {showWalkIn ? "Ocultar walk-in" : "Walk-in"}
            </Button>
          </>
        ) : null}
        <Button variant="secondary" onClick={exportCsv} disabled={!camping}>
          Exportar CSV
        </Button>
        {canExportGlobal ? (
          <Button
            variant="secondary"
            onClick={exportCsvGlobal}
            disabled={busy || campings.length === 0}
          >
            CSV global
          </Button>
        ) : null}
        {profile.role === "admin_global" ? (
          <Button variant="secondary" onClick={() => router.push("/admin/campings")}>
            Campings
          </Button>
        ) : null}
        <Button
          variant="ghost"
          onClick={toggleTheme}
          title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
          aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
          style={{ width: 40, height: 40, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        >
          {theme === "dark" ? <SunIcon title="Modo claro" /> : <MoonIcon title="Modo oscuro" />}
        </Button>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", rowGap: 10 }}>
        {showCampingSelector ? (
          <div style={{ minWidth: 0, flex: "1 1 280px" }}>
            <SelectDropdown
              label="Camping"
              value={selectedCampingId}
              options={campingOptions}
              onChange={setSelectedCampingId}
              placeholder="Seleccionar camping…"
              disabled={busy || campings.length === 0}
              searchable
            />
          </div>
        ) : null}

        <div style={{ minWidth: 0, flex: "1 1 320px" }}>
          <DateRangePicker
            label="Rango"
            checkInDate={fromDate}
            checkOutDate={toDate}
            onChange={({ checkInDate, checkOutDate }) => {
              setFromDate(checkInDate);
              setToDate(checkOutDate);
            }}
            disabled={busy}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant="ghost"
            onClick={() => setToDate(addDaysYmd(fromDate, 7))}
            disabled={busy}
            style={{ padding: "6px 12px" }}
          >
            7 días
          </Button>
          <Button
            variant="ghost"
            onClick={() => setToDate(addDaysYmd(fromDate, 14))}
            disabled={busy}
            style={{ padding: "6px 12px" }}
          >
            14 días
          </Button>
          <Button
            variant="ghost"
            onClick={() => setToDate(addDaysYmd(fromDate, 30))}
            disabled={busy}
            style={{ padding: "6px 12px" }}
          >
            30 días
          </Button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          marginTop: 12,
        }}
      >
        <Card title="Reservas (rango)">
          <div style={{ fontSize: 28, fontWeight: 900 }}>{kpis.total}</div>
        </Card>
        <Card title="Pagadas">
          <div style={{ fontSize: 28, fontWeight: 900 }}>{kpis.pagadas}</div>
        </Card>
        <Card title="Pendientes (hold)">
          <div style={{ fontSize: 28, fontWeight: 900 }}>{kpis.pendientes}</div>
        </Card>
        <Card title="Canceladas / Fallidas">
          <div style={{ fontSize: 28, fontWeight: 900 }}>{kpis.canceladas + kpis.fallidas}</div>
        </Card>
        <Card title="Ocupación (primer día)">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
            <span style={{ fontSize: 24, fontWeight: 900 }}>{kpis.ocupadasHoy}</span>
            <span style={{ color: "var(--color-text-muted)" }}>/ {kpis.ocupadasHoy + kpis.disponiblesHoy}</span>
          </div>
        </Card>
      </div>

      <hr style={{ margin: "24px 0" }} />

      {error ? (
        <div
          style={{
            border: "1px solid rgba(239,68,68,0.5)",
            background: "rgba(239,68,68,0.08)",
            color: "var(--color-text)",
            padding: 12,
            borderRadius: 12,
            marginTop: 12,
          }}
        >
          <strong style={{ display: "block", marginBottom: 6 }}>Revisá estos datos</strong>
          <span style={{ color: "var(--color-text-muted)" }}>{error}</span>
        </div>
      ) : null}

      {showWalkIn && camping && canCreateOrCancel ? (
        <div style={{ marginTop: 16 }}>
          <Card title="Crear reserva manual (walk-in)">
            <div style={{ display: "grid", gap: 12 }}>
              <div className="reservar-grid-top">
                <div style={{ minWidth: 0 }}>
                  <DateRangePicker
                    label="Fechas"
                    checkInDate={walkInCheckIn}
                    checkOutDate={walkInCheckOut}
                    onChange={({ checkInDate, checkOutDate }) => {
                      setWalkInCheckIn(checkInDate);
                      setWalkInCheckOut(checkOutDate);
                    }}
                    disabled={busy}
                  />
                </div>

                {camping.inventoryMode === "unit_based" ? (
                  <SelectDropdown
                    label="Unidad"
                    value={walkInUnitId}
                    options={unitOptions}
                    onChange={setWalkInUnitId}
                    disabled={busy}
                  />
                ) : (
                  <>
                    <SelectDropdown
                      label="Parcelas"
                      value={String(walkInParcelas)}
                      options={parcelasOptions}
                      onChange={(v) => setWalkInParcelas(Number(v))}
                      disabled={busy}
                    />
                    <SelectDropdown
                      label="Adultos"
                      value={String(walkInAdultos)}
                      options={adultosOptions}
                      onChange={(v) => setWalkInAdultos(Number(v))}
                      disabled={busy}
                    />
                    <SelectDropdown
                      label="Menores"
                      value={String(walkInMenores)}
                      options={menoresOptions}
                      onChange={(v) => setWalkInMenores(Number(v))}
                      disabled={busy}
                    />
                  </>
                )}
              </div>

              <hr />

              <h2 style={{ margin: "12px 0 0 0", color: "var(--color-accent)" }}>Datos de contacto</h2>

              <div className="reservar-grid-60-40">
                <label>
                  Nombre y apellido
                  <input
                    value={walkInNombre}
                    onChange={(e) => setWalkInNombre(e.target.value)}
                    style={{
                      width: "100%",
                      padding: 10,
                      border: "1px solid var(--color-border)",
                      borderRadius: 10,
                      background: "var(--color-surface)",
                      color: "var(--color-text)",
                      boxSizing: "border-box",
                    }}
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    value={walkInEmail}
                    onChange={(e) => setWalkInEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: 10,
                      border: "1px solid var(--color-border)",
                      borderRadius: 10,
                      background: "var(--color-surface)",
                      color: "var(--color-text)",
                      boxSizing: "border-box",
                    }}
                  />
                </label>
              </div>

              <PhoneFieldSimple
                label="Teléfono"
                countryCode={walkInTelefonoPais}
                onCountryCodeChange={setWalkInTelefonoPais}
                number={walkInTelefonoNumero}
                onNumberChange={setWalkInTelefonoNumero}
                manualDialCode={walkInTelefonoDialManual}
                onManualDialCodeChange={setWalkInTelefonoDialManual}
                placeholder="11 1234 5678"
                required
                layout="compact"
                disabled={busy}
              />

              <div style={{ maxWidth: 220 }}>
                <SelectDropdown
                  label="Edad del titular"
                  value={String(walkInEdad)}
                  options={edadOptions}
                  onChange={(v) => setWalkInEdad(Number(v))}
                  disabled={busy}
                />
              </div>

              <Button variant="primary" onClick={createWalkInReserva} disabled={busy}>
                {busy ? "Creando..." : "Crear reserva walk-in"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      <div style={{ marginTop: 16 }}>
        <Card title="Camping">
          {camping ? (
            <>
              <p>
                <strong>{camping.nombre}</strong> - {camping.areaProtegida} - Capacidad:{" "}
                {camping.capacidadParcelas} parcelas
              </p>
              <p
                style={{
                  marginTop: 8,
                  marginBottom: 0,
                  fontSize: 13,
                  color: "var(--color-text-muted)",
                }}
              >
                {camping.inventoryMode === "unit_based" ? (
                  <>
                    Modo inventario: por unidad · Tipos: {unitTypes.length} · Unidades: {units.length}
                  </>
                ) : (
                  <>Modo inventario: por capacidad</>
                )}
              </p>
            </>
          ) : (
            <p>Cargando camping…</p>
          )}
        </Card>
      </div>

      {camping?.inventoryMode === "unit_based" ? (
        <>
          <div style={{ marginTop: 16 }}>
            <Card title="Inventario por unidad">
              {units.length === 0 ? (
                <p>No hay unidades cargadas para este camping.</p>
              ) : (
                <>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--color-text-muted)",
                      marginTop: 0,
                      marginBottom: 12,
                    }}
                  >
                    Disponibles: {unitAvailability.filter((r) => r.isAvailable).length} · No disponibles:{" "}
                    {unitAvailability.filter((r) => !r.isAvailable).length}
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gap: 12,
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    }}
                  >
                    {units.map((unit) => {
                      const ub = unitStatusBadge(unit.operationalStatus);
                      const availRow = unitAvailability.find((r) => r.unit.id === unit.id);
                      const rangeB = availRow
                        ? rangeAvailabilityBadge(availRow)
                        : { text: "—", tone: "gray" as const };
                      return (
                        <div
                          key={unit.id}
                          style={{
                            border: "1px solid var(--color-border)",
                            borderRadius: 12,
                            padding: 12,
                            background: "var(--color-surface)",
                            display: "grid",
                            gap: 8,
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>{unit.displayName}</div>
                          <div style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
                            {unitTypeById.get(unit.unitTypeId)?.name ?? "Tipo desconocido"}
                          </div>
                          <div>
                            <Badge text={ub.text} tone={ub.tone} />
                          </div>
                          <div>
                            <span style={{ fontSize: 12, color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
                              Rango ({formatYmdToDmy(fromDate)} → {formatYmdToDmy(rangeEndDate)})
                            </span>
                            <Badge text={rangeB.text} tone={rangeB.tone} />
                          </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Button
                            variant="ghost"
                            disabled={busy || unit.operationalStatus === "available"}
                            onClick={() => setUnitOperationalStatus(unit.id, "available")}
                            style={{ padding: "6px 10px" }}
                          >
                            Disponible
                          </Button>
                          <Button
                            variant="ghost"
                            disabled={busy || unit.operationalStatus === "blocked"}
                            onClick={() => setUnitOperationalStatus(unit.id, "blocked")}
                            style={{ padding: "6px 10px" }}
                          >
                            Bloquear
                          </Button>
                          <Button
                            variant="ghost"
                            disabled={busy || unit.operationalStatus === "maintenance"}
                            onClick={() => setUnitOperationalStatus(unit.id, "maintenance")}
                            style={{ padding: "6px 10px" }}
                          >
                            Mantenimiento
                          </Button>
                          <Button
                            variant="secondary"
                            style={{ padding: "6px 10px" }}
                            disabled={busy}
                            onClick={() => setSelectedUnitForBlock(unit)}
                          >
                            Bloquear rango
                          </Button>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          {unitBlocks
                            .filter((b) => b.unitId === unit.id)
                            .map((b) => (
                              <div key={b.id} style={{ fontSize: 12 }}>
                                {b.fromDate} → {b.toDate}
                                <Button
                                  variant="ghost"
                                  disabled={busy}
                                  style={{ padding: "2px 6px", marginLeft: 6 }}
                                  onClick={() => handleDeleteBlock(b.id)}
                                >
                                  ✕
                                </Button>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </>
              )}
            </Card>
          </div>

          {selectedUnitForBlock ? (
            <div style={{ marginTop: 16 }}>
              <Card title={`Bloquear ${selectedUnitForBlock.displayName}`}>
                <div style={{ display: "grid", gap: 12 }}>
                  <label style={{ display: "grid", gap: 4 }}>
                    Desde
                    <input
                      type="date"
                      value={blockFromDate}
                      onChange={(e) => setBlockFromDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: 10,
                        border: "1px solid var(--color-border)",
                        borderRadius: 10,
                        background: "var(--color-surface)",
                        color: "var(--color-text)",
                        boxSizing: "border-box",
                      }}
                    />
                  </label>

                  <label style={{ display: "grid", gap: 4 }}>
                    Hasta
                    <input
                      type="date"
                      value={blockToDate}
                      onChange={(e) => setBlockToDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: 10,
                        border: "1px solid var(--color-border)",
                        borderRadius: 10,
                        background: "var(--color-surface)",
                        color: "var(--color-text)",
                        boxSizing: "border-box",
                      }}
                    />
                  </label>

                  <Button onClick={handleCreateBlock} disabled={busy}>
                    Crear bloqueo
                  </Button>

                  <Button variant="ghost" onClick={() => setSelectedUnitForBlock(null)}>
                    Cancelar
                  </Button>
                </div>
              </Card>
            </div>
          ) : null}
        </>
      ) : null}

      <div style={{ marginTop: 16 }}>
        <Card
          title={`Disponibilidad (${formatYmdToDmy(fromDate || "...")} → ${formatYmdToDmy(rangeEndDate || "...")})`}
        >
          {!camping ? (
            <p>Cargando…</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Fecha</Th>
                  <Th>Ocupadas</Th>
                  <Th>Disponibles</Th>
                </tr>
              </thead>
              <tbody>
                {availability.map((d) => (
                  <tr key={d.date}>
                    <Td>{formatYmdToDmy(d.date)}</Td>
                    <Td>{d.ocupadas}</Td>
                    <Td>{d.disponibles}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      <div style={{ marginTop: 16 }}>
        <Card title="Reservas (en rango)">
          {reservasEnRango.length === 0 ? (
            <p>No hay reservas en el rango seleccionado.</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Estado</Th>
                  <Th>Fechas</Th>
                  <Th>Titular</Th>
                  <Th>Personas</Th>
                  <Th>Total</Th>
                  <Th>Origen</Th>
                  <Th>Detalle</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {reservasEnRango.map((r) => {
                  const estadoB = estadoBadge(r.estado);
                  const origenB = origenBadge(r.createdByMode ?? "");
                  const rowReservaUnit = r.unitId ? units.find((u) => u.id === r.unitId) : undefined;
                  return (
                    <tr key={r.id}>
                      <Td>
                        <Badge text={estadoB.text} tone={estadoB.tone} />
                      </Td>
                      <Td>
                        {formatYmdToDmy(r.checkInDate)} → {formatYmdToDmy(r.checkOutDate)}
                      </Td>
                      <Td>
                        <div>
                          {r.titularNombre} ({r.titularEmail})
                        </div>
                        {rowReservaUnit?.displayName ? (
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--color-text-muted)",
                              marginTop: 2,
                            }}
                          >
                            {rowReservaUnit.displayName}
                          </div>
                        ) : null}
                      </Td>
                      <Td>
                        {r.adultos}A / {r.menores}M
                      </Td>
                      <Td>${r.montoTotalArs.toLocaleString("es-AR")}</Td>
                      <Td>
                        <Badge text={origenB.text} tone={origenB.tone} />
                      </Td>
                      <Td>
                        <Button
                          variant="ghost"
                          onClick={() => openDetail(r)}
                          style={{ padding: "6px 10px" }}
                        >
                          Ver
                        </Button>
                      </Td>
                    <Td>
                      {!canCreateOrCancel ? (
                        "-"
                      ) : r.estado === "pendiente_pago" || r.estado === "pagada" ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {r.estado === "pendiente_pago" ? (
                            <>
                              <Button
                                variant="secondary"
                                disabled={busy}
                                onClick={() => markAsPaid(r.id)}
                                style={{ padding: "6px 10px" }}
                              >
                                Marcar como pagada
                              </Button>
                              <Button
                                variant="ghost"
                                disabled={busy}
                                onClick={() => expireReserva(r.id)}
                                style={{ padding: "6px 10px" }}
                              >
                                Expirar
                              </Button>
                            </>
                          ) : null}
                          <Button
                            variant="ghost"
                            disabled={busy}
                            onClick={() => cancelReserva(r.id)}
                            style={{ padding: "6px 10px" }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        "-"
                      )}
                    </Td>
                  </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      <ReservaDetailModal
        open={detailOpen && !!detailReserva}
        detailReserva={detailReserva}
        canCreateOrCancel={canCreateOrCancel}
        campingInventoryMode={camping?.inventoryMode}
        profileRole={profile.role}
        busy={busy}
        units={units}
        unitTypeById={unitTypeById}
        detailReservaUnitRows={detailReservaUnitRows}
        reassigningReservaId={reassigningReservaId}
        reassignTargetUnitId={reassignTargetUnitId}
        oldUnitNextStatus={oldUnitNextStatus}
        reassignUnitOptions={reassignUnitOptions}
        oldUnitNextStatusOptions={OLD_UNIT_NEXT_STATUS_OPTIONS}
        formatEstadoLabel={(estado) => estadoBadge(estado).text}
        formatOrigenLabel={(origen) => origenBadge(origen).text}
        onClose={closeDetail}
        onStartReassign={(reservaId) => {
          setReassigningReservaId(reservaId);
          setReassignTargetUnitId("");
          setOldUnitNextStatus("available");
        }}
        onCancelReassign={() => {
          setReassigningReservaId(null);
          setReassignTargetUnitId("");
          setOldUnitNextStatus("available");
        }}
        onConfirmReassign={() => void handleReassignReserva()}
        onChangeReassignTargetUnitId={setReassignTargetUnitId}
        onChangeOldUnitNextStatus={setOldUnitNextStatus}
      />
    </main>
  );
}
