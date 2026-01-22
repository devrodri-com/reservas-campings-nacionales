"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
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

const DEFAULT_CAMPING_ID = "talampaya-campamento-agreste";

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
    typeof o.activo === "boolean"
  );
}

type ReservaDoc = Omit<Reserva, "id">;

function isReservaEstado(v: unknown): v is ReservaEstado {
  return v === "confirmada" || v === "cancelada";
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
    (o.createdByMode === undefined || isCreatedByMode(o.createdByMode))
  );
}

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
  const [days, setDays] = useState<number>(7);
  const [showWalkIn, setShowWalkIn] = useState(false);

  // Walk-in form state
  const [walkInCheckIn, setWalkInCheckIn] = useState<string>(addDaysYmd(todayYmd(), 1));
  const [walkInCheckOut, setWalkInCheckOut] = useState<string>(addDaysYmd(todayYmd(), 2));
  const [walkInParcelas, setWalkInParcelas] = useState<number>(1);
  const [walkInAdultos, setWalkInAdultos] = useState<number>(2);
  const [walkInMenores, setWalkInMenores] = useState<number>(0);
  const [walkInNombre, setWalkInNombre] = useState("");
  const [walkInEmail, setWalkInEmail] = useState("");
  const [walkInTelefono, setWalkInTelefono] = useState("");
  const [walkInEdad, setWalkInEdad] = useState<number>(30);

  const [fromDate, setFromDate] = useState<string>(todayYmd());

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
          return;
        }

        setCamping(selected);

        // C) Cargar reservas del camping seleccionado
        const items = await loadReservasForCamping(selected.id);
        setReservas(items);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, selectedCampingId]);

  const reservasConfirmadas = useMemo(
    () => reservas.filter((r) => r.estado === "confirmada"),
    [reservas]
  );

  const rangeEndDate = useMemo(() => {
    const end = addDaysYmd(fromDate, days);
    return end || fromDate; // fallback a fromDate si es inválido
  }, [fromDate, days]);

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
      reservas: reservasConfirmadas,
    });
  }, [camping, reservasConfirmadas, fromDate, days]);

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
        estado: "confirmada",
        montoTotalArs,
        createdAtMs: Date.now(),
        createdByUid: user?.uid ?? undefined,
        createdByMode: "admin",
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

      // recargar reservas
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

      if (!walkInNombre.trim() || !walkInEmail.trim() || !walkInTelefono.trim()) {
        setError("Nombre, email y teléfono son obligatorios.");
        setBusy(false);
        return;
      }

      if (walkInEdad < 18) {
        setError("El titular debe ser mayor de edad.");
        setBusy(false);
        return;
      }

      // Validar disponibilidad
      const all = await loadReservasForCamping(camping.id);
      const confirmadas = all.filter((r) => r.estado === "confirmada");

      const availability = buildAvailabilityForRange({
        fromDate: walkInCheckIn,
        days: noches,
        capacidadParcelas: camping.capacidadParcelas,
        reservas: confirmadas,
      });

      const noDisponible = availability.find((d) => d.disponibles < walkInParcelas);
      if (noDisponible) {
        setError(`No hay disponibilidad suficiente para ${walkInParcelas} parcela(s) el día ${noDisponible.date}.`);
        setBusy(false);
        return;
      }

      // Crear reserva
      const montoTotalArs = noches * walkInParcelas * camping.precioNocheArs;

      const docReserva: ReservaDoc = {
        campingId: camping.id,
        checkInDate: walkInCheckIn,
        checkOutDate: walkInCheckOut,
        parcelas: walkInParcelas,
        adultos: walkInAdultos,
        menores: walkInMenores,
        titularNombre: walkInNombre.trim(),
        titularEmail: walkInEmail.trim(),
        titularTelefono: walkInTelefono.trim(),
        titularEdad: walkInEdad,
        estado: "confirmada",
        montoTotalArs,
        createdAtMs: Date.now(),
        createdByUid: user.uid,
        createdByMode: "admin",
      };

      await addDoc(collection(db, "reservas"), docReserva);

      // Recargar reservas
      const items = await loadReservasForCamping(camping.id);
      setReservas(items);

      // Limpiar formulario y ocultar
      setWalkInCheckIn(addDaysYmd(todayYmd(), 1));
      setWalkInCheckOut(addDaysYmd(todayYmd(), 2));
      setWalkInParcelas(1);
      setWalkInAdultos(2);
      setWalkInMenores(0);
      setWalkInNombre("");
      setWalkInEmail("");
      setWalkInTelefono("");
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

  if (loading || profileLoading) return <main style={{ padding: 24 }}>Cargando…</main>;
  if (!user) return null;
  if (!profile || !profile.activo) {
    return (
      <main style={{ padding: 24 }}>
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
    <main style={{ padding: 24 }}>
      <h1>Panel Admin</h1>
      <p>Sesión: {user.email}</p>

      <div style={{ display: "flex", gap: 12 }}>
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
              {busy ? "Creando..." : "Crear reserva demo"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowWalkIn(!showWalkIn)}
              disabled={busy || !camping}
            >
              {showWalkIn ? "Ocultar walk-in" : "Crear reserva manual (walk-in)"}
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
            Exportar CSV global
          </Button>
        ) : null}
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
        {showCampingSelector ? (
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>Camping:</span>
            <select
              value={selectedCampingId}
              onChange={(e) => setSelectedCampingId(e.target.value)}
              style={{ padding: 8, border: "1px solid #ccc", background: "transparent", color: "inherit" }}
            >
              {campings.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.areaProtegida})
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Desde:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) {
                setFromDate(todayYmd());
                return;
              }
              setFromDate(v);
            }}
            style={{ padding: 8, border: "1px solid #ccc", background: "transparent", color: "inherit" }}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Rango:</span>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            style={{ padding: 8, border: "1px solid #ccc", background: "transparent", color: "inherit" }}
          >
            <option value={7}>7 días</option>
            <option value={14}>14 días</option>
            <option value={30}>30 días</option>
          </select>
        </label>
      </div>

      <hr style={{ margin: "24px 0" }} />

      {error ? <p style={{ color: "red" }}>{error}</p> : null}

      {showWalkIn && camping && canCreateOrCancel ? (
        <div style={{ marginTop: 16 }}>
          <Card title="Crear reserva manual (walk-in)">
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <label style={{ flex: 1, minWidth: 220 }}>
                Check-in
                <input
                  type="date"
                  value={walkInCheckIn}
                  onChange={(e) => setWalkInCheckIn(e.target.value)}
                  style={{ width: "100%", padding: 8, border: "1px solid #ccc" }}
                />
              </label>

              <label style={{ flex: 1, minWidth: 220 }}>
                Check-out
                <input
                  type="date"
                  value={walkInCheckOut}
                  onChange={(e) => setWalkInCheckOut(e.target.value)}
                  style={{ width: "100%", padding: 8, border: "1px solid #ccc" }}
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <label style={{ flex: 1, minWidth: 160 }}>
                Parcelas
                <select
                  value={walkInParcelas}
                  onChange={(e) => setWalkInParcelas(Number(e.target.value))}
                  style={{ width: "100%", padding: 8, border: "1px solid #ccc" }}
                >
                  {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ flex: 1, minWidth: 160 }}>
                Adultos
                <input
                  type="number"
                  min={0}
                  value={walkInAdultos}
                  onChange={(e) => setWalkInAdultos(Number(e.target.value))}
                  style={{ width: "100%", padding: 8, border: "1px solid #ccc" }}
                />
              </label>

              <label style={{ flex: 1, minWidth: 160 }}>
                Menores
                <input
                  type="number"
                  min={0}
                  value={walkInMenores}
                  onChange={(e) => setWalkInMenores(Number(e.target.value))}
                  style={{ width: "100%", padding: 8, border: "1px solid #ccc" }}
                />
              </label>
            </div>

            <hr />

            <label>
              Nombre y apellido
              <input
                value={walkInNombre}
                onChange={(e) => setWalkInNombre(e.target.value)}
                style={{ width: "100%", padding: 8, border: "1px solid #ccc" }}
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={walkInEmail}
                onChange={(e) => setWalkInEmail(e.target.value)}
                style={{ width: "100%", padding: 8, border: "1px solid #ccc" }}
              />
            </label>

            <label>
              Teléfono
              <input
                value={walkInTelefono}
                onChange={(e) => setWalkInTelefono(e.target.value)}
                style={{ width: "100%", padding: 8, border: "1px solid #ccc" }}
              />
            </label>

            <label>
              Edad del titular
              <input
                type="number"
                min={18}
                value={walkInEdad}
                onChange={(e) => setWalkInEdad(Number(e.target.value))}
                style={{ width: "100%", padding: 8, border: "1px solid #ccc" }}
              />
            </label>

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
            <p>
              <strong>{camping.nombre}</strong> - {camping.areaProtegida} - Capacidad:{" "}
              {camping.capacidadParcelas} parcelas
            </p>
          ) : (
            <p>Cargando camping…</p>
          )}
        </Card>
      </div>

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
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {reservasEnRango.map((r) => (
                  <tr key={r.id}>
                    <Td>{r.estado}</Td>
                    <Td>
                      {formatYmdToDmy(r.checkInDate)} → {formatYmdToDmy(r.checkOutDate)}
                    </Td>
                    <Td>
                      {r.titularNombre} ({r.titularEmail})
                    </Td>
                    <Td>
                      {r.adultos}A / {r.menores}M
                    </Td>
                    <Td>${r.montoTotalArs.toLocaleString("es-AR")}</Td>
                    <Td>{r.createdByMode ?? "-"}</Td>
                    <Td>
                      {canCreateOrCancel && r.estado === "confirmada" ? (
                        <Button
                          variant="ghost"
                          disabled={busy}
                          onClick={() => cancelReserva(r.id)}
                          style={{ padding: "6px 10px" }}
                        >
                          Cancelar
                        </Button>
                      ) : (
                        "-"
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </main>
  );
}
