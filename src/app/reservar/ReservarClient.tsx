"use client";

import { useEffect, useMemo, useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { Camping } from "@/types/camping";
import type { Reserva } from "@/types/reserva";
import type { ReservaCreateInput } from "@/types/reservaCreate";
import { fetchCampings } from "@/lib/campingsRepo";
import { fetchReservasByCamping } from "@/lib/reservasRepo";
import { buildAvailabilityForRange } from "@/lib/availability";
import { enumerateNights, todayYmd, addDaysYmd } from "@/lib/dates";
import { formatArs } from "@/lib/money";
import { ensureSignedInGuestOrLink } from "@/lib/ensureAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card } from "@/components/ui";
import PhoneFieldSimple, { composePhone } from "@/components/PhoneFieldSimple";

type ReservaDoc = Omit<Reserva, "id">;

const MAX_PARCELAS = 5;

function nightsCount(checkIn: string, checkOut: string): number {
  return enumerateNights(checkIn, checkOut).length;
}

export default function ReservarClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCampingId = searchParams.get("campingId");

  const [campings, setCampings] = useState<Camping[]>([]);
  const [loadingCampings, setLoadingCampings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [campingId, setCampingId] = useState<string>("");
  const [checkInDate, setCheckInDate] = useState<string>(addDaysYmd(todayYmd(), 1));
  const [checkOutDate, setCheckOutDate] = useState<string>(addDaysYmd(todayYmd(), 2));
  const [parcelas, setParcelas] = useState<number>(1);
  const [adultos, setAdultos] = useState<number>(2);
  const [menores, setMenores] = useState<number>(0);

  const [titularNombre, setTitularNombre] = useState("");
  const [titularEmail, setTitularEmail] = useState("");
  const [telefonoPais, setTelefonoPais] = useState<string>("ar");
  const [telefonoNumero, setTelefonoNumero] = useState<string>("");
  const [telefonoDialManual, setTelefonoDialManual] = useState<string>("+");
  const [titularEdad, setTitularEdad] = useState<number>(30);
  const [password, setPassword] = useState<string>(""); // opcional
  const [passwordConfirm, setPasswordConfirm] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: 10,
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    background: "var(--color-surface)",
    color: "var(--color-text)",
  };

  const selectStyle: React.CSSProperties = { ...inputStyle };

  const selectedCamping = useMemo(
    () => campings.find((c) => c.id === campingId) ?? null,
    [campings, campingId]
  );

  const noches = useMemo(() => nightsCount(checkInDate, checkOutDate), [checkInDate, checkOutDate]);

  const totalPersonas = adultos + menores;

  const totalArs = useMemo(() => {
    if (!selectedCamping) return 0;
    return noches * parcelas * selectedCamping.precioNocheArs;
  }, [selectedCamping, noches, parcelas]);

  useEffect(() => {
    const load = async () => {
      setLoadingCampings(true);
      setError(null);
      try {
        const list = await fetchCampings();
        setCampings(list);
        const initialId =
          preselectedCampingId && list.some((c) => c.id === preselectedCampingId)
            ? preselectedCampingId
            : (list[0]?.id ?? "");
        setCampingId(initialId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoadingCampings(false);
      }
    };
    load();
  }, [preselectedCampingId]);

  const validate = (): string | null => {
    if (!selectedCamping) return "Seleccioná un camping.";
    if (!checkInDate || !checkOutDate) return "Seleccioná fechas.";
    if (noches < 1) return "La estadía mínima es 1 noche.";
    if (parcelas < 1 || parcelas > MAX_PARCELAS) return `Parcelas debe estar entre 1 y ${MAX_PARCELAS}.`;
    if (adultos < 0 || menores < 0) return "Adultos/menores inválido.";
    if (totalPersonas <= 0) return "Debe haber al menos 1 persona.";
    if (totalPersonas > parcelas * selectedCamping.maxPersonasPorParcela) {
      return `Excede el máximo: ${selectedCamping.maxPersonasPorParcela} personas por parcela.`;
    }
    if (!titularNombre.trim()) return "Nombre y apellido es obligatorio.";
    if (!titularEmail.trim()) return "Email es obligatorio.";
    if (!composePhone({ countryCode: telefonoPais, number: telefonoNumero, manualDialCode: telefonoDialManual }).trim())
      return "Teléfono es obligatorio.";
    if (titularEdad < 18) return "El titular debe ser mayor de edad.";
    if (password && password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
    if (password && password !== passwordConfirm) return "Las contraseñas no coinciden.";
    return null;
  };

  const onSubmit = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    if (!selectedCamping) return;

    setSubmitting(true);
    setError(null);

    try {
      // 1) Asegurar auth (anónimo) y si hay password, vincular cuenta
      await ensureSignedInGuestOrLink({ email: titularEmail.trim(), password: password.trim() || undefined });

      const uid = auth.currentUser?.uid ?? undefined;

      // 2) Chequear disponibilidad (solo reservas pagadas bloquean)
      const all = await fetchReservasByCamping(selectedCamping.id);
      const bloquean = all.filter(
        (r) =>
          r.estado === "pagada" ||
          (r.estado === "pendiente_pago" &&
            typeof r.expiresAtMs === "number" &&
            r.expiresAtMs > Date.now())
      );

      const rangeDays = nightsCount(checkInDate, checkOutDate);
      const availability = buildAvailabilityForRange({
        fromDate: checkInDate,
        days: rangeDays,
        capacidadParcelas: selectedCamping.capacidadParcelas,
        reservas: bloquean,
      });

      const noDisponible = availability.find((d) => d.disponibles < parcelas);
      if (noDisponible) {
        setError(`No hay disponibilidad suficiente para ${parcelas} parcela(s) el día ${noDisponible.date}.`);
        setSubmitting(false);
        return;
      }

      // 3) Crear reserva (pendiente de pago)
      const input: ReservaCreateInput = {
        campingId: selectedCamping.id,
        checkInDate,
        checkOutDate,
        parcelas,
        adultos,
        menores,
        titularNombre: titularNombre.trim(),
        titularEmail: titularEmail.trim(),
        titularTelefono: composePhone({ countryCode: telefonoPais, number: telefonoNumero, manualDialCode: telefonoDialManual }),
        titularEdad,
        password: password.trim() || undefined,
      };

      const docReserva: ReservaDoc = {
        campingId: input.campingId,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        parcelas: input.parcelas,
        adultos: input.adultos,
        menores: input.menores,
        titularNombre: input.titularNombre,
        titularEmail: input.titularEmail,
        titularTelefono: input.titularTelefono,
        titularEdad: input.titularEdad,
        estado: "pendiente_pago",
        montoTotalArs: totalArs,
        createdAtMs: Date.now(),
        createdByUid: uid,
        createdByMode: "public",
        paymentProvider: "mercadopago",
        paymentStatus: "pending",
        expiresAtMs: Date.now() + 15 * 60 * 1000, // 15 min hold
      };

      const created = await addDoc(collection(db, "reservas"), docReserva);

      router.push(`/reserva/confirmada/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <h1>Reservar</h1>

      {loadingCampings ? <p>Cargando campings…</p> : null}
      {error ? <p style={{ color: "#ef4444" }}>{error}</p> : null}

      <Card>
      <div style={{ display: "grid", gap: 12 }}>
        <label>
          Camping
          <select
            value={campingId}
            onChange={(e) => setCampingId(e.target.value)}
            style={selectStyle}
          >
            {campings.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.areaProtegida})
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <label>
            Check-in
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
            Check-out
            <input
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <label>
            Parcelas
            <select
              value={parcelas}
              onChange={(e) => setParcelas(Number(e.target.value))}
              style={selectStyle}
            >
              {Array.from({ length: MAX_PARCELAS }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <label>
            Adultos
            <input
              type="number"
              min={0}
              value={adultos}
              onChange={(e) => setAdultos(Number(e.target.value))}
              style={inputStyle}
            />
          </label>

          <label>
            Menores
            <input
              type="number"
              min={0}
              value={menores}
              onChange={(e) => setMenores(Number(e.target.value))}
              style={inputStyle}
            />
          </label>
        </div>

        <hr />

        <h2>Datos de contacto</h2>

        <label>
          Nombre y apellido
          <input
            value={titularNombre}
            onChange={(e) => setTitularNombre(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={titularEmail}
            onChange={(e) => setTitularEmail(e.target.value)}
            style={inputStyle}
          />
        </label>

        <PhoneFieldSimple
          label="Teléfono"
          countryCode={telefonoPais}
          onCountryCodeChange={setTelefonoPais}
          number={telefonoNumero}
          onNumberChange={setTelefonoNumero}
          manualDialCode={telefonoDialManual}
          onManualDialCodeChange={setTelefonoDialManual}
          placeholder="11 1234 5678"
          required
        />

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <label>
            Edad del titular
            <input
              type="number"
              min={18}
              value={titularEdad}
              onChange={(e) => setTitularEdad(Number(e.target.value))}
              style={inputStyle}
            />
          </label>
        </div>

        {password.trim().length > 0 ? (
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <label>
              (Opcional) Crear contraseña para registrar cuenta
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Dejar vacío si no querés registrarte"
                style={inputStyle}
                autoComplete="new-password"
              />
            </label>
            <label>
              Confirmar contraseña
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Repetí la contraseña"
                style={inputStyle}
                autoComplete="new-password"
              />
            </label>
          </div>
        ) : (
          <label>
            (Opcional) Crear contraseña para registrar cuenta
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Dejar vacío si no querés registrarte"
              style={inputStyle}
              autoComplete="new-password"
            />
          </label>
        )}

        <hr />

        <h2>Resumen</h2>
        {selectedCamping ? (
          <p>
            <strong>{selectedCamping.nombre}</strong> - {noches} noche(s) - {parcelas} parcela(s) - Total:{" "}
            <strong>${formatArs(totalArs)}</strong>
          </p>
        ) : null}

        <Button
          variant="primary"
          onClick={onSubmit}
          disabled={submitting || !selectedCamping}
        >
          {submitting ? "Confirmando..." : "Confirmar reserva (pago simulado)"}
        </Button>
      </div>
      </Card>
    </main>
  );
}
