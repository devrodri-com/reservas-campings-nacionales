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
import type { Camping } from "@/types/camping";
import type { Reserva, ReservaEstado, CreatedByMode } from "@/types/reserva";
import { buildAvailabilityForRange } from "@/lib/availability";
import { addDaysYmd, todayYmd, enumerateNights, formatYmdToDmy } from "@/lib/dates";

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
    if (!user) return;

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
  }, [user, selectedCampingId]);

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

  if (loading) return <main style={{ padding: 24 }}>Cargando…</main>;
  if (!user) return null;

  return (
    <main style={{ padding: 24 }}>
      <h1>Panel Admin</h1>
      <p>Sesión: {user.email}</p>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={async () => {
            await signOut(auth);
            router.replace("/admin/login");
          }}
          style={{ padding: 10, border: "1px solid #ccc" }}
        >
          Cerrar sesión
        </button>

        <button
          onClick={createDemoReserva}
          disabled={busy || !camping}
          style={{ padding: 10, border: "1px solid #ccc" }}
        >
          {busy ? "Creando..." : "Crear reserva demo"}
        </button>

        <button
          onClick={() => setShowWalkIn(!showWalkIn)}
          disabled={busy || !camping}
          style={{ padding: 10, border: "1px solid #ccc" }}
        >
          {showWalkIn ? "Ocultar walk-in" : "Crear reserva manual (walk-in)"}
        </button>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
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

      {showWalkIn && camping ? (
        <section style={{ marginTop: 16, padding: 16, border: "1px solid #ccc", borderRadius: 4 }}>
          <h2>Crear reserva manual (walk-in)</h2>
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

            <button
              onClick={createWalkInReserva}
              disabled={busy}
              style={{ padding: 12, border: "1px solid #ccc" }}
            >
              {busy ? "Creando..." : "Crear reserva walk-in"}
            </button>
          </div>
        </section>
      ) : null}

      <section style={{ marginTop: 16 }}>
        <h2>Camping</h2>
        {camping ? (
          <p>
            <strong>{camping.nombre}</strong> - {camping.areaProtegida} - Capacidad:{" "}
            {camping.capacidadParcelas} parcelas
          </p>
        ) : (
          <p>Cargando camping…</p>
        )}
      </section>

      <section style={{ marginTop: 16 }}>
        <h2>
          Disponibilidad ({formatYmdToDmy(fromDate || "...")} → {formatYmdToDmy(rangeEndDate || "...")})
        </h2>
        {!camping ? (
          <p>Cargando…</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #444", padding: 8 }}>
                  Fecha
                </th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #444", padding: 8 }}>
                  Ocupadas
                </th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #444", padding: 8 }}>
                  Disponibles
                </th>
              </tr>
            </thead>
            <tbody>
              {availability.map((d) => (
                <tr key={d.date}>
                  <td style={{ borderBottom: "1px solid #222", padding: 8 }}>{formatYmdToDmy(d.date)}</td>
                  <td style={{ borderBottom: "1px solid #222", padding: 8 }}>{d.ocupadas}</td>
                  <td style={{ borderBottom: "1px solid #222", padding: 8 }}>{d.disponibles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginTop: 16 }}>
        <h2>Reservas (en rango)</h2>
        {reservasEnRango.length === 0 ? (
          <p>No hay reservas en el rango seleccionado.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #444", padding: 8 }}>
                  Estado
                </th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #444", padding: 8 }}>
                  Fechas
                </th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #444", padding: 8 }}>
                  Titular
                </th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #444", padding: 8 }}>
                  Personas
                </th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #444", padding: 8 }}>
                  Total
                </th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #444", padding: 8 }}>
                  Origen
                </th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #444", padding: 8 }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {reservasEnRango.map((r) => (
                <tr key={r.id}>
                  <td style={{ borderBottom: "1px solid #222", padding: 8 }}>{r.estado}</td>
                  <td style={{ borderBottom: "1px solid #222", padding: 8 }}>
                    {formatYmdToDmy(r.checkInDate)} → {formatYmdToDmy(r.checkOutDate)}
                  </td>
                  <td style={{ borderBottom: "1px solid #222", padding: 8 }}>
                    {r.titularNombre} ({r.titularEmail})
                  </td>
                  <td style={{ borderBottom: "1px solid #222", padding: 8 }}>
                    {r.adultos}A / {r.menores}M
                  </td>
                  <td style={{ borderBottom: "1px solid #222", padding: 8 }}>
                    ${r.montoTotalArs.toLocaleString("es-AR")}
                  </td>
                  <td style={{ borderBottom: "1px solid #222", padding: 8 }}>
                    {r.createdByMode ?? "-"}
                  </td>
                  <td style={{ borderBottom: "1px solid #222", padding: 8 }}>
                    {r.estado === "confirmada" ? (
                      <button
                        disabled={busy}
                        onClick={() => cancelReserva(r.id)}
                        style={{ padding: "6px 10px", border: "1px solid #ccc" }}
                      >
                        Cancelar
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
