"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, setDoc, collection } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { Camping } from "@/types/camping";
import type { Reserva } from "@/types/reserva";
import type { ReservaCreateInput } from "@/types/reservaCreate";
import { fetchCampings } from "@/lib/campingsRepo";
import { fetchReservasPublicByCamping, type ReservaPublic } from "@/lib/reservasRepo";
import { fetchUnitTypesByCamping } from "@/lib/unitTypesRepo";
import { fetchUnitsByCamping } from "@/lib/unitsRepo";
import { fetchUnitBlocksByCamping } from "@/lib/unitBlocksRepo";
import { buildAvailabilityForRange } from "@/lib/availability";
import type { Unit } from "@/types/unit";
import type { UnitType } from "@/types/unitType";
import type { UnitBlock } from "@/types/unitBlock";
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

/** Fila para UI de selección de unidad (misma info que construye `unitOptions`). */
type UnitReservationOptionRow = {
  id: string;
  displayName: string;
  typeName: string;
  capacityMax: number;
  pricingKind: "per_unit" | "per_person" | "unknown";
  pricingKindLabel: string;
  priceLinePrimary: string;
  priceLineSecondary: string | null;
  label: string;
};

type UnitReservationGroup = {
  typeName: string;
  rows: UnitReservationOptionRow[];
};

const MAX_PARCELAS = 5;

function nightsCount(checkIn: string, checkOut: string): number {
  return enumerateNights(checkIn, checkOut).length;
}

function unitBasedPricePerNight(
  unitType: UnitType | undefined,
  adultos: number,
  menores: number
): number | null {
  if (!unitType) return null;

  if (unitType.pricingModel === "per_unit") {
    if (typeof unitType.unitPriceArs === "number") return unitType.unitPriceArs;
    // Compat temporal para tipos legacy todavía no migrados
    if (typeof unitType.basePriceArs === "number") return unitType.basePriceArs;
    return null;
  }

  if (typeof unitType.adultPriceArs === "number" && typeof unitType.childPriceArs === "number") {
    return adultos * unitType.adultPriceArs + menores * unitType.childPriceArs;
  }
  // Compat temporal para tipos legacy todavía no migrados
  if (typeof unitType.basePriceArs === "number") return unitType.basePriceArs;
  return null;
}

function filterReservasBloqueantes(all: ReservaPublic[], nowMs: number): ReservaPublic[] {
  return all.filter(
    (r) =>
      r.estado === "pagada" ||
      (r.estado === "pendiente_pago" && typeof r.expiresAtMs === "number" && r.expiresAtMs > nowMs)
  );
}

function unitAvailableForStay(
  unit: Unit,
  unitBlocks: UnitBlock[],
  reservasBloqueantes: ReservaPublic[],
  checkInDate: string,
  checkOutDate: string
): boolean {
  if (!unit.active || unit.operationalStatus !== "available") return false;
  if (
    unitBlocks.some(
      (b) =>
        b.unitId === unit.id && b.fromDate < checkOutDate && b.toDate > checkInDate
    )
  ) {
    return false;
  }
  if (
    reservasBloqueantes.some(
      (r) =>
        typeof r.unitId === "string" &&
        r.unitId === unit.id &&
        r.checkInDate < checkOutDate &&
        r.checkOutDate > checkInDate
    )
  ) {
    return false;
  }
  return true;
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

  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitBlocks, setUnitBlocks] = useState<UnitBlock[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [unitBasedPublicReservas, setUnitBasedPublicReservas] = useState<ReservaPublic[]>([]);

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
    if (!selectedCamping) return 0;
    if (selectedCamping.inventoryMode === "unit_based") {
      const u = units.find((x) => x.id === selectedUnitId);
      if (!u) return Math.max(0, selectedCamping.maxPersonasPorParcela);
      const ut = unitTypes.find((t) => t.id === u.unitTypeId);
      return Math.max(0, ut?.capacityMax ?? selectedCamping.maxPersonasPorParcela);
    }
    const base = selectedCamping.maxPersonasPorParcela;
    return Math.max(0, parcelas * base);
  }, [selectedCamping, parcelas, units, unitTypes, selectedUnitId]);

  const isUnitBased = selectedCamping?.inventoryMode === "unit_based";

  const adultosOptions: SelectOption[] = useMemo(
    () => {
      const minAdultos = isUnitBased ? 1 : 0;
      const maxAdultos = Math.max(minAdultos, maxPersonas);
      return Array.from({ length: maxAdultos - minAdultos + 1 }, (_, idx) => ({
        value: String(minAdultos + idx),
        label: String(minAdultos + idx),
      }));
    },
    [isUnitBased, maxPersonas]
  );

  const maxMenores = useMemo(() => {
    if (!isUnitBased) return maxPersonas;
    const adultosValidos = Math.min(Math.max(adultos, 1), Math.max(1, maxPersonas));
    return Math.max(0, maxPersonas - adultosValidos);
  }, [isUnitBased, maxPersonas, adultos]);

  const menoresOptions: SelectOption[] = useMemo(
    () =>
      Array.from({ length: maxMenores + 1 }, (_, i) => ({
        value: String(i),
        label: String(i),
      })),
    [maxMenores]
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

  const totalArs = useMemo<number | null>(() => {
    if (!selectedCamping) return null;
    if (selectedCamping.inventoryMode === "unit_based") {
      const u = units.find((x) => x.id === selectedUnitId);
      const ut = u ? unitTypes.find((t) => t.id === u.unitTypeId) : undefined;
      const precioNoche = unitBasedPricePerNight(ut, adultos, menores);
      if (precioNoche === null) return null;
      return noches * precioNoche;
    }
    return noches * parcelas * selectedCamping.precioNocheArs;
  }, [selectedCamping, noches, parcelas, units, unitTypes, selectedUnitId, adultos, menores]);

  const unitTypesById = useMemo(() => {
    const m = new Map<string, UnitType>();
    unitTypes.forEach((t) => m.set(t.id, t));
    return m;
  }, [unitTypes]);

  const availableUnits = useMemo(() => {
    if (!selectedCamping || selectedCamping.inventoryMode !== "unit_based") return [];
    const nowMs = Date.now();
    const bloquean = filterReservasBloqueantes(unitBasedPublicReservas, nowMs);
    const result = units.filter((unit) =>
      unitAvailableForStay(unit, unitBlocks, bloquean, checkInDate, checkOutDate)
    );
    console.log("UNIT_BASED availableUnits", {
      campingId: selectedCamping.id,
      checkInDate,
      checkOutDate,
      units: units.length,
      unitBlocks: unitBlocks.length,
      reservasBloqueantes: bloquean.length,
      availableUnits: result.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        operationalStatus: u.operationalStatus,
      })),
    });
    return result;
  }, [
    selectedCamping,
    units,
    unitBlocks,
    unitBasedPublicReservas,
    checkInDate,
    checkOutDate,
  ]);

  const unitReservationRows: UnitReservationOptionRow[] = useMemo(() => {
    const rows = availableUnits.map((unit) => {
      const unitType = unitTypesById.get(unit.unitTypeId);
      const typeName = unitType?.name ?? "Tipo";
      const capacity = unitType?.capacityMax ?? 0;

      let pricingKind: UnitReservationOptionRow["pricingKind"] = "unknown";
      let pricingKindLabel = "";
      let priceLinePrimary = "";
      let priceLineSecondary: string | null = null;

      const pricingText = (() => {
        if (!unitType) {
          pricingKindLabel = "";
          priceLinePrimary = "Precio no disponible";
          return "Precio no disponible";
        }

        if (unitType.pricingModel === "per_unit") {
          pricingKind = "per_unit";
          pricingKindLabel = "Por unidad";
          if (typeof unitType.unitPriceArs !== "number") {
            priceLinePrimary = "Precio no disponible";
            return "Precio no disponible";
          }
          priceLinePrimary = `$${formatArs(unitType.unitPriceArs)}/noche`;
          return `Por unidad · $${unitType.unitPriceArs.toLocaleString("es-AR")}/noche`;
        }

        pricingKind = "per_person";
        pricingKindLabel = "Por persona";
        if (
          typeof unitType.adultPriceArs !== "number" ||
          typeof unitType.childPriceArs !== "number"
        ) {
          priceLinePrimary = "Precio no disponible";
          return "Precio no disponible";
        }
        priceLinePrimary = `Adulto $${formatArs(unitType.adultPriceArs)}/noche`;
        priceLineSecondary = `Menor $${formatArs(unitType.childPriceArs)}/noche`;
        return `Por persona · Adulto $${unitType.adultPriceArs.toLocaleString("es-AR")} / Menor $${unitType.childPriceArs.toLocaleString("es-AR")}`;
      })();

      const label = `${unit.displayName} (${typeName}) · ${capacity} personas · ${pricingText}`;

      return {
        id: unit.id,
        displayName: unit.displayName,
        typeName,
        capacityMax: capacity,
        pricingKind,
        pricingKindLabel,
        priceLinePrimary,
        priceLineSecondary,
        label,
      };
    });
    console.log("UNIT_BASED unitOptions", rows.map((r) => ({ value: r.id, label: r.label })));
    return rows;
  }, [availableUnits, unitTypesById]);

  const unitReservationGroups: UnitReservationGroup[] = useMemo(() => {
    const groupsMap = new Map<string, UnitReservationOptionRow[]>();
    for (const row of unitReservationRows) {
      const existing = groupsMap.get(row.typeName);
      if (existing) {
        existing.push(row);
      } else {
        groupsMap.set(row.typeName, [row]);
      }
    }
    return Array.from(groupsMap.entries()).map(([typeName, rows]) => ({ typeName, rows }));
  }, [unitReservationRows]);

  const [expandedUnitGroups, setExpandedUnitGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExpandedUnitGroups((prev) => {
      const next: Record<string, boolean> = {};
      for (const group of unitReservationGroups) {
        next[group.typeName] = prev[group.typeName] ?? false;
      }
      return next;
    });
  }, [unitReservationGroups]);

  const unitOptions: SelectOption[] = useMemo(
    () => unitReservationRows.map((r) => ({ value: r.id, label: r.label })),
    [unitReservationRows]
  );
  const selectedUnitReservationRow = useMemo(
    () => unitReservationRows.find((row) => row.id === selectedUnitId) ?? null,
    [unitReservationRows, selectedUnitId]
  );

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

  useEffect(() => {
    setSelectedUnitId("");
    if (!selectedCamping) {
      setUnitTypes([]);
      setUnits([]);
      setUnitBlocks([]);
      return;
    }
    if (selectedCamping.inventoryMode === "unit_based") {
      let cancelled = false;
      (async () => {
        try {
          const [types, us, blocks] = await Promise.all([
            fetchUnitTypesByCamping(selectedCamping.id),
            fetchUnitsByCamping(selectedCamping.id),
            fetchUnitBlocksByCamping(selectedCamping.id),
          ]);
          console.log("UNIT_BASED load", {
            campingId: selectedCamping.id,
            campingNombre: selectedCamping.nombre,
            unitTypes: types.length,
            units: us.length,
            blocks: blocks.length,
          });
          if (!cancelled) {
            setUnitTypes(types);
            setUnits(us);
            setUnitBlocks(blocks);
          }
        } catch (e) {
          console.log("FAIL fetch unit inventory", e);
          if (!cancelled) {
            setUnitTypes([]);
            setUnits([]);
            setUnitBlocks([]);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }
    setUnitTypes([]);
    setUnits([]);
    setUnitBlocks([]);
    return undefined;
  }, [selectedCamping]);

  useEffect(() => {
    if (!selectedCamping || selectedCamping.inventoryMode !== "unit_based") {
      setUnitBasedPublicReservas([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchReservasPublicByCamping(selectedCamping.id);
        console.log("UNIT_BASED reservas_public", {
          campingId: selectedCamping.id,
          total: list.length,
          withUnitId: list.filter((r) => typeof r.unitId === "string").length,
        });
        if (!cancelled) setUnitBasedPublicReservas(list);
      } catch (e) {
        console.log("FAIL fetchReservasPublicByCamping (unit_based)", e);
        if (!cancelled) setUnitBasedPublicReservas([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCamping, checkInDate, checkOutDate]);

  useEffect(() => {
    if (selectedCamping?.inventoryMode !== "unit_based") return;
    if (!selectedUnitId) return;
    if (!availableUnits.some((u) => u.id === selectedUnitId)) {
      setSelectedUnitId("");
    }
  }, [availableUnits, selectedUnitId, selectedCamping]);

  useEffect(() => {
    if (!isUnitBased) return;

    const maxAdultos = Math.max(1, maxPersonas);
    const adultosNormalizados = Math.min(Math.max(adultos, 1), maxAdultos);
    if (adultos !== adultosNormalizados) {
      setAdultos(adultosNormalizados);
      return;
    }

    const maxMenoresPermitidos = Math.max(0, maxPersonas - adultosNormalizados);
    const menoresNormalizados = Math.min(Math.max(menores, 0), maxMenoresPermitidos);
    if (menores !== menoresNormalizados) {
      setMenores(menoresNormalizados);
    }
  }, [isUnitBased, maxPersonas, adultos, menores]);

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
    if (selectedCamping.inventoryMode === "unit_based") {
      if (!selectedUnitId.trim()) {
        return "Debés seleccionar una unidad.";
      }
      const u = units.find((x) => x.id === selectedUnitId);
      if (!u) {
        return "Debés seleccionar una unidad.";
      }
      const ut = unitTypes.find((t) => t.id === u.unitTypeId);
      const capUnidad = ut?.capacityMax ?? selectedCamping.maxPersonasPorParcela;
      if (adultos < 0 || menores < 0) return "Adultos/menores inválido.";
      if (adultos < 1) return "Debe haber al menos 1 adulto.";
      if (totalPersonas > capUnidad) {
        return `Excede el máximo: ${capUnidad} personas para esta unidad.`;
      }
    } else {
      if (parcelas < 1 || parcelas > MAX_PARCELAS) return `Parcelas debe estar entre 1 y ${MAX_PARCELAS}.`;
      if (adultos < 0 || menores < 0) return "Adultos/menores inválido.";
      if (totalPersonas <= 0) return "Debe haber al menos 1 persona.";
      if (totalPersonas > parcelas * selectedCamping.maxPersonasPorParcela) {
        return `Excede el máximo: ${selectedCamping.maxPersonasPorParcela} personas por parcela.`;
      }
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

    const today = todayYmd();
    if (checkInDate < today) {
      setError("La fecha de ingreso no puede ser anterior a hoy.");
      setSubmitting(false);
      return;
    }
    if (checkOutDate <= checkInDate) {
      setError("La fecha de salida debe ser posterior a la fecha de ingreso.");
      setSubmitting(false);
      return;
    }

    try {
      const uid = await ensureSignedInGuest();
      const isUnitBased = selectedCamping.inventoryMode === "unit_based";

      let input: ReservaCreateInput;
      let docReserva: ReservaDoc;
      let docReservaPublic: Omit<ReservaPublic, "id">;

      if (isUnitBased) {
        let all: ReservaPublic[];
        let freshUnits: Unit[];
        let freshBlocks: UnitBlock[];
        let freshTypes: UnitType[];
        try {
          [all, freshUnits, freshBlocks, freshTypes] = await Promise.all([
            fetchReservasPublicByCamping(selectedCamping.id),
            fetchUnitsByCamping(selectedCamping.id),
            fetchUnitBlocksByCamping(selectedCamping.id),
            fetchUnitTypesByCamping(selectedCamping.id),
          ]);
          console.log("OK fetch unit_based availability");
        } catch (e) {
          console.log("FAIL fetch unit_based availability", e);
          throw e;
        }
        const nowMs = Date.now();
        const bloquean = filterReservasBloqueantes(all, nowMs);
        const selectedUnit = freshUnits.find((u) => u.id === selectedUnitId);
        if (!selectedUnit || !selectedUnitId.trim()) {
          setError("Debés seleccionar una unidad.");
          setSubmitting(false);
          return;
        }
        if (!unitAvailableForStay(selectedUnit, freshBlocks, bloquean, checkInDate, checkOutDate)) {
          setError("La unidad seleccionada ya no está disponible para ese rango.");
          setSubmitting(false);
          return;
        }
        const freshUt = freshTypes.find((t) => t.id === selectedUnit.unitTypeId);
        const precioNoche = unitBasedPricePerNight(freshUt, adultos, menores);
        if (precioNoche === null) {
          setError("No se pudo calcular el precio de la unidad seleccionada.");
          setSubmitting(false);
          return;
        }
        const montoTotalArs = noches * precioNoche;

        input = {
          campingId: selectedCamping.id,
          checkInDate,
          checkOutDate,
          parcelas: 1,
          adultos,
          menores,
          titularNombre: titularNombre.trim(),
          titularEmail: titularEmail.trim(),
          titularTelefono: composePhone({
            countryCode: telefonoPais,
            number: telefonoNumero,
            manualDialCode: telefonoDialManual,
          }),
          titularEdad,
        };

        docReserva = {
          campingId: input.campingId,
          checkInDate: input.checkInDate,
          checkOutDate: input.checkOutDate,
          parcelas: 1,
          adultos: input.adultos,
          menores: input.menores,
          titularNombre: input.titularNombre,
          titularEmail: input.titularEmail,
          titularTelefono: input.titularTelefono,
          titularEdad: input.titularEdad,
          estado: "pendiente_pago",
          montoTotalArs,
          createdAtMs: Date.now(),
          createdByUid: uid,
          createdByMode: "public",
          paymentProvider: "mercadopago",
          paymentStatus: "pending",
          expiresAtMs: Date.now() + 15 * 60 * 1000,
          unitId: selectedUnit.id,
          unitTypeId: selectedUnit.unitTypeId,
          assignedBy: "user",
        };

        docReservaPublic = {
          campingId: docReserva.campingId,
          checkInDate: docReserva.checkInDate,
          checkOutDate: docReserva.checkOutDate,
          parcelas: docReserva.parcelas,
          estado: docReserva.estado,
          expiresAtMs: docReserva.expiresAtMs,
          createdAtMs: docReserva.createdAtMs,
          unitId: selectedUnit.id,
          unitTypeId: selectedUnit.unitTypeId,
        };
      } else {
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

        input = {
          campingId: selectedCamping.id,
          checkInDate,
          checkOutDate,
          parcelas,
          adultos,
          menores,
          titularNombre: titularNombre.trim(),
          titularEmail: titularEmail.trim(),
          titularTelefono: composePhone({
            countryCode: telefonoPais,
            number: telefonoNumero,
            manualDialCode: telefonoDialManual,
          }),
          titularEdad,
        };

        docReserva = {
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
          montoTotalArs: noches * parcelas * selectedCamping.precioNocheArs,
          createdAtMs: Date.now(),
          createdByUid: uid,
          createdByMode: "public",
          paymentProvider: "mercadopago",
          paymentStatus: "pending",
          expiresAtMs: Date.now() + 15 * 60 * 1000,
        };

        docReservaPublic = {
          campingId: docReserva.campingId,
          checkInDate: docReserva.checkInDate,
          checkOutDate: docReserva.checkOutDate,
          parcelas: docReserva.parcelas,
          estado: docReserva.estado,
          expiresAtMs: docReserva.expiresAtMs,
          createdAtMs: docReserva.createdAtMs,
        };
      }

      const docRef = doc(collection(db, "reservas"));
      const docRefPub = doc(db, "reservas_public", docRef.id);

      try {
        await setDoc(docRef, docReserva);
        await setDoc(docRefPub, docReservaPublic);
        console.log("OK setDoc reservas + reservas_public");
      } catch (e) {
        console.log("FAIL setDoc reservas/reservas_public", e);
        throw e;
      }

      if (isUnitBased) {
        setSelectedUnitId("");
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

          {selectedCamping?.inventoryMode !== "unit_based" ? (
            <SelectDropdown
              label="Parcelas"
              value={String(parcelas)}
              options={parcelasOptions}
              onChange={(v) => setParcelas(Number(v))}
              disabled={submitting}
              searchable={false}
            />
          ) : null}

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
        <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: -2 }}>
          Menores: 3 a 10 años · Mayores: 11 años o más
        </div>

        {selectedCamping?.inventoryMode === "unit_based" ? (
          <div style={{ width: "100%", minWidth: 0, display: "grid", gap: 12 }}>
            <div style={{ width: "100%" }}>
              <span
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 6,
                  color: "var(--color-text-muted)",
                }}
              >
                Unidad
              </span>
              <div style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.45 }}>
                Elegí una unidad. Podés ver capacidad y precio base antes de seleccionar.
              </div>
            </div>

            <div
              role="group"
              aria-label="Unidades disponibles"
              style={{
                display: "grid",
                gap: 10,
                width: "100%",
              }}
            >
              {unitReservationRows.length === 0 ? (
                <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-muted)" }}>
                  No hay unidades disponibles para estas fechas.
                </p>
              ) : (
                unitReservationGroups.map((group) => {
                  const expanded = expandedUnitGroups[group.typeName] ?? false;
                  return (
                    <div
                      key={group.typeName}
                      style={{
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                        background: "var(--color-surface, #fff)",
                        overflow: "hidden",
                      }}
                    >
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() =>
                          setExpandedUnitGroups((prev) => ({
                            ...prev,
                            [group.typeName]: !(prev[group.typeName] ?? false),
                          }))
                        }
                        aria-expanded={expanded}
                        style={{
                          width: "100%",
                          border: "none",
                          background: "transparent",
                          textAlign: "left",
                          font: "inherit",
                          cursor: submitting ? "default" : "pointer",
                          padding: "10px 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          color: "var(--color-text)",
                          fontWeight: 700,
                        }}
                      >
                        <span style={{ width: 16, textAlign: "center", color: "var(--color-text-muted)" }}>
                          {expanded ? "▼" : "▶"}
                        </span>
                        <span>
                          {group.typeName} ({group.rows.length})
                        </span>
                      </button>

                      {expanded ? (
                        <div style={{ borderTop: "1px solid var(--color-border)" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                            <thead>
                              <tr style={{ background: "var(--color-bg)" }}>
                                <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 12 }}>Unidad</th>
                                <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 12 }}>Capacidad</th>
                                <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 12 }}>Cobro</th>
                                <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 12 }}>Precio</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.rows.map((row) => {
                                const selected = row.id === selectedUnitId;
                                const cobro =
                                  row.pricingKind === "per_unit"
                                    ? "Por unidad"
                                    : row.pricingKind === "per_person"
                                      ? "Por persona"
                                      : "No definido";
                                const precio =
                                  row.pricingKind === "per_person" &&
                                  row.priceLinePrimary &&
                                  row.priceLineSecondary
                                    ? `${row.priceLinePrimary} / ${row.priceLineSecondary}`
                                    : row.priceLinePrimary || "Precio no disponible";

                                return (
                                  <tr
                                    key={row.id}
                                    onClick={() => setSelectedUnitId(row.id)}
                                    style={{
                                      cursor: submitting ? "default" : "pointer",
                                      background: selected
                                        ? "rgba(37, 99, 235, 0.12)"
                                        : "var(--color-surface, #fff)",
                                      boxShadow: selected
                                        ? "inset 3px 0 0 var(--color-accent, #2563eb)"
                                        : "none",
                                    }}
                                  >
                                    <td
                                      style={{
                                        padding: "10px 12px",
                                        borderTop: "1px solid var(--color-border)",
                                        fontWeight: 600,
                                        color: "var(--color-text)",
                                      }}
                                    >
                                      {row.displayName}
                                      {selected ? (
                                        <span
                                          style={{
                                            marginLeft: 8,
                                            fontSize: 12,
                                            color: "var(--color-accent, #2563eb)",
                                            fontWeight: 700,
                                          }}
                                        >
                                          Seleccionada
                                        </span>
                                      ) : null}
                                    </td>
                                    <td
                                      style={{
                                        padding: "10px 12px",
                                        borderTop: "1px solid var(--color-border)",
                                        color: "var(--color-text-muted)",
                                      }}
                                    >
                                      hasta {row.capacityMax} personas
                                    </td>
                                    <td
                                      style={{
                                        padding: "10px 12px",
                                        borderTop: "1px solid var(--color-border)",
                                        color: "var(--color-text-muted)",
                                      }}
                                    >
                                      {cobro}
                                    </td>
                                    <td
                                      style={{
                                        padding: "10px 12px",
                                        borderTop: "1px solid var(--color-border)",
                                        color: "var(--color-text)",
                                      }}
                                    >
                                      {precio}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : null}

        {selectedCamping?.inventoryMode === "unit_based" && selectedUnitReservationRow ? (
          <div
            style={{
              border: "1px solid rgba(37, 99, 235, 0.35)",
              borderRadius: 12,
              background: "rgba(37, 99, 235, 0.08)",
              padding: "12px 14px",
              display: "grid",
              gap: 6,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--color-accent, #2563eb)",
                letterSpacing: "0.01em",
              }}
            >
              Unidad seleccionada
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--color-text)" }}>
                {selectedUnitReservationRow.displayName}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--color-accent, #2563eb)",
                  whiteSpace: "nowrap",
                }}
              >
                Confirmada
              </span>
            </div>

            <div style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.45 }}>
              {selectedUnitReservationRow.typeName} · hasta {selectedUnitReservationRow.capacityMax} personas
            </div>
            <div style={{ fontSize: 13, color: "var(--color-text)", lineHeight: 1.45 }}>
              {selectedUnitReservationRow.pricingKind === "per_unit" && selectedUnitReservationRow.priceLinePrimary
                ? `Por unidad · ${selectedUnitReservationRow.priceLinePrimary}`
                : selectedUnitReservationRow.pricingKind === "per_person" &&
                    selectedUnitReservationRow.priceLinePrimary &&
                    selectedUnitReservationRow.priceLineSecondary
                  ? `Por persona · ${selectedUnitReservationRow.priceLinePrimary} · ${selectedUnitReservationRow.priceLineSecondary}`
                  : selectedUnitReservationRow.priceLinePrimary || "Precio no disponible"}
            </div>
          </div>
        ) : null}

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
              {selectedCamping.inventoryMode === "unit_based" ? (
                <div>
                  <strong>Unidad:</strong>{" "}
                  {units.find((u) => u.id === selectedUnitId)?.displayName ?? "—"}
                </div>
              ) : (
                <div>
                  <strong>Parcelas:</strong> {parcelas}
                </div>
              )}
              <div><strong>Personas:</strong> {adultos} adultos / {menores} menores</div>
              <div>
                <strong>Total:</strong>{" "}
                {totalArs === null ? "Precio no disponible" : `$${formatArs(totalArs)}`}
              </div>
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
