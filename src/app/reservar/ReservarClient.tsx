"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, setDoc, collection } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { Camping } from "@/types/camping";
import type { Reserva } from "@/types/reserva";
import type { ReservaCreateInput } from "@/types/reservaCreate";
import { fetchCampings } from "@/lib/campingsRepo";
import { fetchReservasPublicByCamping, type ReservaPublic } from "@/lib/reservasRepo";
import { buildAvailabilityForRange } from "@/lib/availability";
import { enumerateNights, todayYmd, addDaysYmd } from "@/lib/dates";
import { formatArs } from "@/lib/money";
import { ensureSignedInGuest } from "@/lib/ensureAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card } from "@/components/ui";
import PhoneFieldSimple, { composePhone } from "@/components/PhoneFieldSimple";
import SelectDropdown from "@/components/SelectDropdown";
import type { SelectOption } from "@/components/SelectDropdown";
import InfoTooltip from "@/components/InfoTooltip";
import DateRangePicker from "@/components/DateRangePicker";

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
  const [fieldError, setFieldError] = useState<string | null>(null);

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

  const [submitting, setSubmitting] = useState(false);

  const errorBorder = "1px solid rgba(239,68,68,0.8)";

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: 10,
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    background: "var(--color-surface)",
    color: "var(--color-text)",
    boxSizing: "border-box",
  };

  const selectStyle: React.CSSProperties = { ...inputStyle };

  const selectedCamping = useMemo(
    () => campings.find((c) => c.id === campingId) ?? null,
    [campings, campingId]
  );

  const campingOptions: SelectOption[] = useMemo(
    () =>
      campings.map((c) => ({
        value: c.id,
        label: `${c.nombre} (${c.areaProtegida})`,
        description: c.ubicacionTexto,
      })),
    [campings]
  );

  const parcelasOptions: SelectOption[] = useMemo(
    () =>
      Array.from({ length: MAX_PARCELAS }, (_, i) => {
        const n = i + 1;
        return { value: String(n), label: `${n} parcela${n > 1 ? "s" : ""}` };
      }),
    []
  );

  const maxPersonas = useMemo(() => {
    const base = selectedCamping?.maxPersonasPorParcela ?? 6;
    return Math.max(0, parcelas * base);
  }, [selectedCamping, parcelas]);

  const adultosOptions: SelectOption[] = useMemo(
    () =>
      Array.from({ length: maxPersonas + 1 }, (_, i) => ({
        value: String(i),
        label: String(i),
      })),
    [maxPersonas]
  );

  const menoresOptions: SelectOption[] = useMemo(
    () =>
      Array.from({ length: maxPersonas + 1 }, (_, i) => ({
        value: String(i),
        label: String(i),
      })),
    [maxPersonas]
  );

  const edadOptions: SelectOption[] = useMemo(
    () =>
      Array.from({ length: 99 - 18 + 1 }, (_, i) => {
        const age = 18 + i;
        return { value: String(age), label: String(age) };
      }),
    []
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
        console.log("OK fetchCampings");
        setCampings(list);
        const initialId =
          preselectedCampingId && list.some((c) => c.id === preselectedCampingId)
            ? preselectedCampingId
            : (list[0]?.id ?? "");
        setCampingId(initialId);
      } catch (e) {
        console.log("FAIL fetchCampings", e);
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoadingCampings(false);
      }
    };
    load();
  }, [preselectedCampingId]);

  const validate = (): string | null => {
    if (!selectedCamping) {
      setFieldError("camping");
      return "Seleccioná un camping.";
    }
    if (!checkInDate || !checkOutDate || noches < 1) {
      setFieldError("fechas");
      if (!checkInDate || !checkOutDate) return "Seleccioná fechas.";
      return "La estadía mínima es 1 noche.";
    }
    if (parcelas < 1 || parcelas > MAX_PARCELAS) return `Parcelas debe estar entre 1 y ${MAX_PARCELAS}.`;
    if (adultos < 0 || menores < 0) return "Adultos/menores inválido.";
    if (totalPersonas <= 0) return "Debe haber al menos 1 persona.";
    if (totalPersonas > parcelas * selectedCamping.maxPersonasPorParcela) {
      return `Excede el máximo: ${selectedCamping.maxPersonasPorParcela} personas por parcela.`;
    }
    if (!titularNombre.trim()) return "Nombre y apellido es obligatorio.";
    if (!titularEmail.trim()) {
      setFieldError("email");
      return "Email es obligatorio.";
    }
    if (!composePhone({ countryCode: telefonoPais, number: telefonoNumero, manualDialCode: telefonoDialManual }).trim()) {
      setFieldError("telefono");
      return "Teléfono es obligatorio.";
    }
    if (titularEdad < 18) return "El titular debe ser mayor de edad.";
    setFieldError(null);
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
    setFieldError(null);

    try {
      // 1) Asegurar auth anónima
      const uid = await ensureSignedInGuest();

      // 2) Chequear disponibilidad (solo reservas pagadas bloquean)
      let all: ReservaPublic[];
      try {
        all = await fetchReservasPublicByCamping(selectedCamping.id);
        console.log("OK fetchReservasPublicByCamping");
      } catch (e) {
        console.log("FAIL fetchReservasPublicByCamping", e);
        throw e;
      }
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

      // Crear doc con mismo id en ambas colecciones
      const docRef = doc(collection(db, "reservas"));
      const docRefPub = doc(db, "reservas_public", docRef.id);

      const docReservaPublic: Omit<ReservaPublic, "id"> = {
        campingId: docReserva.campingId,
        checkInDate: docReserva.checkInDate,
        checkOutDate: docReserva.checkOutDate,
        parcelas: docReserva.parcelas,
        estado: docReserva.estado,
        expiresAtMs: docReserva.expiresAtMs,
        createdAtMs: docReserva.createdAtMs,
        createdByUid: docReserva.createdByUid,
      };

      try {
        await setDoc(docRef, docReserva);
        await setDoc(docRefPub, docReservaPublic);
        console.log("OK setDoc reservas + reservas_public");
      } catch (e) {
        console.log("FAIL setDoc reservas/reservas_public", e);
        throw e;
      }

      router.push(`/reserva/confirmada/${docRef.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px", overflowX: "hidden" }}>
      <h1>Reservar</h1>

      {loadingCampings ? <p>Cargando campings…</p> : null}
      {error ? (
        <div
          style={{
            border: "1px solid rgba(239,68,68,0.5)",
            background: "rgba(239,68,68,0.08)",
            color: "var(--color-text)",
            padding: 12,
            borderRadius: 12,
            marginBottom: 16,
          }}
        >
          <strong style={{ display: "block", marginBottom: 6 }}>Revisá estos datos</strong>
          <span style={{ color: "var(--color-text-muted)" }}>{error}</span>
        </div>
      ) : null}

      <Card>
      <div style={{ display: "grid", gap: 12 }}>
        <SelectDropdown
          label="Camping"
          value={campingId}
          options={campingOptions}
          onChange={setCampingId}
          placeholder="Seleccionar camping…"
          disabled={submitting || loadingCampings}
          hasError={fieldError === "camping"}
          searchable
        />

        <div className="reservar-grid-top">
          <div style={{ minWidth: 0 }}>
            <DateRangePicker
              label="Fechas"
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              onChange={({ checkInDate, checkOutDate }) => {
                setCheckInDate(checkInDate);
                setCheckOutDate(checkOutDate);
              }}
              disabled={submitting}
              hasError={fieldError === "fechas"}
            />
          </div>

          <SelectDropdown
            label="Parcelas"
            value={String(parcelas)}
            options={parcelasOptions}
            onChange={(v) => setParcelas(Number(v))}
            disabled={submitting}
            searchable={false}
          />

          <SelectDropdown
            label="Adultos"
            value={String(adultos)}
            options={adultosOptions}
            onChange={(v) => setAdultos(Number(v))}
            disabled={submitting}
            searchable={false}
          />

          <SelectDropdown
            label="Menores"
            value={String(menores)}
            options={menoresOptions}
            onChange={(v) => setMenores(Number(v))}
            disabled={submitting}
            searchable={false}
          />
        </div>

        <hr />

        <h2>Datos de contacto</h2>

        <div className="reservar-grid-60-40">
          <label>
            Nombre y apellido
            <input
              value={titularNombre}
              onChange={(e) => setTitularNombre(e.target.value)}
              disabled={submitting}
              style={inputStyle}
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={titularEmail}
              onChange={(e) => setTitularEmail(e.target.value)}
              disabled={submitting}
              style={{
                ...inputStyle,
                border: fieldError === "email" ? errorBorder : inputStyle.border,
              }}
            />
          </label>
        </div>

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
          disabled={submitting}
          hasError={fieldError === "telefono"}
          layout="compact"
        />

        <div className="reservar-grid-20-40-40">
          <div style={{ display: "grid", gap: 6 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
              Edad
              <InfoTooltip text="Edad del titular de la reserva (mayor de 18 años)." />
            </span>
            <SelectDropdown
              label=""
              value={String(titularEdad)}
              options={edadOptions}
              onChange={(v) => setTitularEdad(Number(v))}
              disabled={submitting}
              searchable={false}
            />
          </div>
        </div>

        <hr />

        <div
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            padding: 12,
            background: "var(--color-bg)",
            display: "grid",
            gap: 6,
          }}
        >
          <div style={{ fontWeight: 800, color: "var(--color-accent)" }}>Resumen</div>
          {selectedCamping ? (
            <>
              <div><strong>Camping:</strong> {selectedCamping.nombre}</div>
              <div><strong>Fechas:</strong> {checkInDate} → {checkOutDate}</div>
              <div><strong>Noches:</strong> {noches}</div>
              <div><strong>Parcelas:</strong> {parcelas}</div>
              <div><strong>Personas:</strong> {adultos} adultos / {menores} menores</div>
              <div><strong>Total:</strong> ${formatArs(totalArs)}</div>
              <div style={{ color: "var(--color-text-muted)", fontSize: 13, marginTop: 4 }}>
                Tenés 15 minutos para completar el pago. Si no se completa, la disponibilidad se libera automáticamente.
              </div>
            </>
          ) : null}
        </div>

        <Button
          variant="primary"
          onClick={onSubmit}
          disabled={submitting || !selectedCamping}
        >
          {submitting ? "Procesando..." : "Confirmar reserva (pago simulado)"}
        </Button>
      </div>
      </Card>
    </main>
  );
}
