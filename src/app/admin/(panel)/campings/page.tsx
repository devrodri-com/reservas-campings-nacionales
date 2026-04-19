"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import type { Camping } from "@/types/camping";
import type { UserProfile } from "@/types/user";
import { fetchCampings } from "@/lib/campingsRepo";
import { fetchUnitTypesByCamping, updateUnitType } from "@/lib/unitTypesRepo";
import { fetchUnitsByCamping, createUnit, updateUnit } from "@/lib/unitsRepo";
import { fetchUserProfile } from "@/lib/userProfile";
import type { Unit } from "@/types/unit";
import type {
  UnitType,
  UnitTypeBookingMode,
  UnitTypePricingModel,
} from "@/types/unitType";
import AdminCampingDataSection from "@/components/admin/AdminCampingDataSection";
import AdminCampingSectionNav, {
  type CampingEditorTab,
} from "@/components/admin/AdminCampingSectionNav";
import AdminCampingUnitTypesSection from "@/components/admin/AdminCampingUnitTypesSection";
import AdminCampingUnitsSection from "@/components/admin/AdminCampingUnitsSection";
import { Button, Card } from "@/components/ui";
import SelectDropdown from "@/components/SelectDropdown";
import type { SelectOption } from "@/components/SelectDropdown";
import { getCampingContextLocation, looksLikeMapsOrLinkNoise } from "@/lib/campingPresentation";
import { adminParseOptionalUint } from "@/lib/adminFormNumbers";

type EditableFields = Pick<
  Camping,
  | "descripcionCorta"
  | "serviciosTexto"
  | "igUrl"
  | "webUrl"
  | "coverImageUrl"
  | "ubicacionTexto"
  | "direccion"
  | "mapsUrl"
  | "mapsEmbedUrl"
>;

function sanitizeUrl(url: string): string {
  const v = url.trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://${v}`;
}

function extractIframeSrc(input: string): string {
  const v = input.trim();
  if (!v) return "";
  // si ya es una URL normal
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  // si es iframe completo, extraer src=""
  const match = v.match(/src\s*=\s*"([^"]+)"/i);
  if (match && match[1]) return match[1];
  return v;
}

function operationalStatusLabel(status: Unit["operationalStatus"]): string {
  switch (status) {
    case "available":
      return "Disponible";
    case "blocked":
      return "Bloqueado";
    case "maintenance":
      return "Mantenimiento";
    default:
      return status;
  }
}

function campingInventoryModeLabel(mode: Camping["inventoryMode"]): string {
  if (mode === "unit_based") return "Modo: Por unidad";
  if (mode === "capacity") return "Modo: Por capacidad";
  return "Modo: no indicado";
}

function campingInventoryModeShort(mode: Camping["inventoryMode"]): string {
  if (mode === "unit_based") return "Por unidad";
  if (mode === "capacity") return "Por capacidad";
  return "Sin indicar";
}

export default function AdminCampingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [campings, setCampings] = useState<Camping[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<EditableFields>({
    descripcionCorta: "",
    serviciosTexto: "",
    igUrl: "",
    webUrl: "",
    coverImageUrl: "",
    ubicacionTexto: "",
    direccion: "",
    mapsUrl: "",
    mapsEmbedUrl: "",
  });

  const [cancellationPolicyEnabled, setCancellationPolicyEnabled] = useState(false);
  const [cancellationRefundDaysThreshold, setCancellationRefundDaysThreshold] = useState("7");
  const [cancellationRefundPercentBeforeThreshold, setCancellationRefundPercentBeforeThreshold] =
    useState("100");
  const [cancellationRefundPercentAfterThreshold, setCancellationRefundPercentAfterThreshold] =
    useState("0");

  const [saving, setSaving] = useState(false);
  const [showNewCamping, setShowNewCamping] = useState(false);
  const [newCampingId, setNewCampingId] = useState("");
  const [newNombre, setNewNombre] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newUbicacion, setNewUbicacion] = useState("");

  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [unitTypeName, setUnitTypeName] = useState("");
  const [unitTypeCode, setUnitTypeCode] = useState("");
  const [unitTypeCapacity, setUnitTypeCapacity] = useState("");
  const [unitTypePricingModel, setUnitTypePricingModel] =
    useState<UnitTypePricingModel>("per_person");
  const [unitTypeAdultPrice, setUnitTypeAdultPrice] = useState("");
  const [unitTypeChildPrice, setUnitTypeChildPrice] = useState("");
  const [unitTypePricePerUnit, setUnitTypePricePerUnit] = useState("");
  const [unitTypeBookingMode, setUnitTypeBookingMode] =
    useState<UnitTypeBookingMode>("overnight_only");

  const [editingUnitTypeId, setEditingUnitTypeId] = useState("");
  const [editUnitTypeName, setEditUnitTypeName] = useState("");
  const [editUnitTypeCapacity, setEditUnitTypeCapacity] = useState("");
  const [editUnitTypePricingModel, setEditUnitTypePricingModel] =
    useState<UnitTypePricingModel>("per_person");
  const [editUnitTypeAdultPrice, setEditUnitTypeAdultPrice] = useState("");
  const [editUnitTypeChildPrice, setEditUnitTypeChildPrice] = useState("");
  const [editUnitTypePricePerUnit, setEditUnitTypePricePerUnit] = useState("");
  const [editUnitTypeBookingMode, setEditUnitTypeBookingMode] =
    useState<UnitTypeBookingMode>("overnight_only");

  const [units, setUnits] = useState<Unit[]>([]);
  const [unitDisplayName, setUnitDisplayName] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [unitTypeIdToCreate, setUnitTypeIdToCreate] = useState("");
  const [unitSector, setUnitSector] = useState("");
  const [unitPriceOverride, setUnitPriceOverride] = useState("");

  const [bulkUnitTypeId, setBulkUnitTypeId] = useState("");
  const [bulkPrefix, setBulkPrefix] = useState("");
  const [bulkFrom, setBulkFrom] = useState("1");
  const [bulkTo, setBulkTo] = useState("1");
  const [bulkSector, setBulkSector] = useState("");
  const [bulkPriceOverride, setBulkPriceOverride] = useState("");

  const [editingUnitId, setEditingUnitId] = useState("");
  const [editUnitDisplayName, setEditUnitDisplayName] = useState("");
  const [editUnitNumber, setEditUnitNumber] = useState("");
  const [editUnitSector, setEditUnitSector] = useState("");
  const [editUnitPriceOverride, setEditUnitPriceOverride] = useState("");
  const [campingEditorTab, setCampingEditorTab] = useState<CampingEditorTab>("data");

  useEffect(() => {
    if (!loading && !user) router.replace("/admin/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) {
      setProfileLoading(false);
      return;
    }
    const run = async () => {
      setProfileLoading(true);
      const p = await fetchUserProfile(user.uid);
      setProfile(p);
      setProfileLoading(false);
    };
    run();
  }, [user]);

  const isAdminGlobal = profile?.activo && profile.role === "admin_global";

  useEffect(() => {
    if (!user || !profile || !profile.activo) return;
    if (!isAdminGlobal) return;

    const run = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const list = await fetchCampings();
        setCampings(list);
        setSelectedId(list[0]?.id ?? "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoadingData(false);
      }
    };

    run();
  }, [user, profile, isAdminGlobal]);

  const selectedCamping = useMemo(
    () => campings.find((c) => c.id === selectedId) ?? null,
    [campings, selectedId]
  );

  useEffect(() => {
    setCampingEditorTab("data");
  }, [selectedCamping?.id]);

  const campingOptions: SelectOption[] = useMemo(
    () =>
      campings.map((c) => ({
        value: c.id,
        label: `${c.nombre} (${c.areaProtegida})`,
      })),
    [campings]
  );

  const unitTypeBookingModeOptions: SelectOption[] = useMemo(
    () => [
      { value: "overnight_only", label: "Solo pernocte" },
      { value: "day_use_only", label: "Solo día" },
      { value: "both", label: "Ambos" },
    ],
    []
  );
  const unitTypePricingModelOptions: SelectOption[] = useMemo(
    () => [
      { value: "per_person", label: "Por persona" },
      { value: "per_unit", label: "Por unidad" },
    ],
    []
  );

  const unitTypeSelectOptions: SelectOption[] = useMemo(
    () =>
      unitTypes.map((ut) => ({
        value: ut.id,
        label: ut.name,
        description: ut.code,
      })),
    [unitTypes]
  );

  useEffect(() => {
    setUnitTypeName("");
    setUnitTypeCode("");
    setUnitTypeCapacity("");
    setUnitTypePricingModel("per_person");
    setUnitTypeAdultPrice("");
    setUnitTypeChildPrice("");
    setUnitTypePricePerUnit("");
    setUnitTypeBookingMode("overnight_only");

    setUnitDisplayName("");
    setUnitNumber("");
    setUnitTypeIdToCreate("");
    setUnitSector("");
    setUnitPriceOverride("");

    setBulkUnitTypeId("");
    setBulkPrefix("");
    setBulkFrom("1");
    setBulkTo("1");
    setBulkSector("");
    setBulkPriceOverride("");

    setEditingUnitTypeId("");
    setEditUnitTypeName("");
    setEditUnitTypeCapacity("");
    setEditUnitTypePricingModel("per_person");
    setEditUnitTypeAdultPrice("");
    setEditUnitTypeChildPrice("");
    setEditUnitTypePricePerUnit("");
    setEditUnitTypeBookingMode("overnight_only");

    setEditingUnitId("");
    setEditUnitDisplayName("");
    setEditUnitNumber("");
    setEditUnitSector("");
    setEditUnitPriceOverride("");

    if (!selectedCamping) {
      setUnitTypes([]);
      setUnits([]);
      return;
    }
    if (selectedCamping.inventoryMode !== "unit_based") {
      setUnitTypes([]);
      setUnits([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [typesList, unitsList] = await Promise.all([
          fetchUnitTypesByCamping(selectedCamping.id),
          fetchUnitsByCamping(selectedCamping.id),
        ]);
        if (!cancelled) {
          setUnitTypes(typesList);
          setUnits(unitsList);
        }
      } catch {
        if (!cancelled) {
          setUnitTypes([]);
          setUnits([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCamping]);

  useEffect(() => {
    if (!selectedCamping) return;
    setForm({
      descripcionCorta: selectedCamping.descripcionCorta ?? "",
      serviciosTexto: selectedCamping.serviciosTexto ?? "",
      igUrl: selectedCamping.igUrl ?? "",
      webUrl: selectedCamping.webUrl ?? "",
      coverImageUrl: selectedCamping.coverImageUrl ?? "",
      ubicacionTexto: selectedCamping.ubicacionTexto ?? "",
      direccion: selectedCamping.direccion ?? "",
      mapsUrl: selectedCamping.mapsUrl ?? "",
      mapsEmbedUrl: selectedCamping.mapsEmbedUrl ?? "",
    });
    setCancellationPolicyEnabled(Boolean(selectedCamping.cancellationPolicyEnabled));
    setCancellationRefundDaysThreshold(
      typeof selectedCamping.cancellationRefundDaysThreshold === "number" &&
        Number.isFinite(selectedCamping.cancellationRefundDaysThreshold)
        ? String(Math.max(0, Math.round(selectedCamping.cancellationRefundDaysThreshold)))
        : "7"
    );
    setCancellationRefundPercentBeforeThreshold(
      typeof selectedCamping.cancellationRefundPercentBeforeThreshold === "number" &&
        Number.isFinite(selectedCamping.cancellationRefundPercentBeforeThreshold)
        ? String(
            Math.min(
              100,
              Math.max(0, Math.round(selectedCamping.cancellationRefundPercentBeforeThreshold))
            )
          )
        : "100"
    );
    setCancellationRefundPercentAfterThreshold(
      typeof selectedCamping.cancellationRefundPercentAfterThreshold === "number" &&
        Number.isFinite(selectedCamping.cancellationRefundPercentAfterThreshold)
        ? String(
            Math.min(
              100,
              Math.max(0, Math.round(selectedCamping.cancellationRefundPercentAfterThreshold))
            )
          )
        : "0"
    );
  }, [selectedCamping]);

  const onSave = async () => {
    if (!selectedCamping) return;

    const ubicacionTrim = form.ubicacionTexto?.trim() ?? "";
    if (!ubicacionTrim) {
      setError("La ubicación breve es obligatoria.");
      return;
    }
    if (looksLikeMapsOrLinkNoise(ubicacionTrim)) {
      setError("La ubicación breve debe ser un texto corto, no un link de Google Maps.");
      return;
    }

    const daysVal = adminParseOptionalUint(cancellationRefundDaysThreshold);
    const beforeVal = adminParseOptionalUint(cancellationRefundPercentBeforeThreshold);
    const afterVal = adminParseOptionalUint(cancellationRefundPercentAfterThreshold);

    if (cancellationPolicyEnabled) {
      if (daysVal === null) {
        setError("Completá el umbral de días de anticipación (número entero).");
        return;
      }
      if (beforeVal === null) {
        setError("Completá la devolución antes del umbral (%).");
        return;
      }
      if (afterVal === null) {
        setError("Completá la devolución después del umbral (%).");
        return;
      }
    }

    const days = Math.max(0, Math.round(daysVal ?? 0));
    const before = Math.min(100, Math.max(0, Math.round(beforeVal ?? 0)));
    const after = Math.min(100, Math.max(0, Math.round(afterVal ?? 0)));

    setSaving(true);
    setError(null);

    try {
      const payload: EditableFields & {
        cancellationPolicyEnabled: boolean;
        cancellationRefundDaysThreshold: number;
        cancellationRefundPercentBeforeThreshold: number;
        cancellationRefundPercentAfterThreshold: number;
      } = {
        descripcionCorta: form.descripcionCorta?.trim() || "",
        serviciosTexto: form.serviciosTexto?.trim() || "",
        igUrl: sanitizeUrl(form.igUrl || ""),
        webUrl: sanitizeUrl(form.webUrl || ""),
        coverImageUrl: sanitizeUrl(form.coverImageUrl || ""),
        ubicacionTexto: ubicacionTrim,
        direccion: form.direccion?.trim() || "",
        mapsUrl: sanitizeUrl(form.mapsUrl || ""),
        mapsEmbedUrl: sanitizeUrl(extractIframeSrc(form.mapsEmbedUrl || "")),
        cancellationPolicyEnabled,
        cancellationRefundDaysThreshold: days,
        cancellationRefundPercentBeforeThreshold: before,
        cancellationRefundPercentAfterThreshold: after,
      };

      await updateDoc(doc(db, "campings", selectedCamping.id), payload);

      setCampings((prev) =>
        prev.map((c) => (c.id === selectedCamping.id ? { ...c, ...payload } : c))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const createCamping = async () => {
    const id = newCampingId.trim().toLowerCase();

    if (!id || !/^[a-z0-9-]+$/.test(id)) {
      setError("El ID debe contener solo letras minúsculas, números y guiones (sin espacios).");
      return;
    }
    if (!newNombre.trim() || !newArea.trim() || !newUbicacion.trim()) {
      setError("Nombre, Área protegida y Ubicación son obligatorios.");
      return;
    }
    if (looksLikeMapsOrLinkNoise(newUbicacion.trim())) {
      setError(
        "La ubicación debe ser un texto breve (ej: ciudad/provincia), no un link de Google Maps."
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await setDoc(doc(db, "campings", id), {
        areaProtegida: newArea.trim(),
        nombre: newNombre.trim(),
        ubicacionTexto: newUbicacion.trim(),
        titular: "-",
        capacidadParcelas: 0,
        precioNocheArs: 0,
        maxPersonasPorParcela: 6,
        checkInHour: 15,
        checkOutHour: 11,
        activo: true,
        inventoryMode: "unit_based",
        descripcionCorta: "",
        serviciosTexto: "",
        igUrl: "",
        webUrl: "",
        coverImageUrl: "",
        direccion: "",
        mapsUrl: "",
        mapsEmbedUrl: "",
        cancellationPolicyEnabled: false,
        cancellationRefundDaysThreshold: 7,
        cancellationRefundPercentBeforeThreshold: 100,
        cancellationRefundPercentAfterThreshold: 0,
      });

      const list = await fetchCampings();
      setCampings(list);
      setSelectedId(id);

      setNewCampingId("");
      setNewNombre("");
      setNewArea("");
      setNewUbicacion("");
      setShowNewCamping(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUnitType = async () => {
    if (!selectedCamping) {
      setError("Seleccioná un camping.");
      return;
    }
    if (selectedCamping.inventoryMode !== "unit_based") {
      setError("Este camping no usa inventario por unidades.");
      return;
    }
    const name = unitTypeName.trim();
    const code = unitTypeCode.trim();
    if (!name) {
      setError("El nombre del tipo de unidad es obligatorio.");
      return;
    }
    if (!code) {
      setError("El código del tipo de unidad es obligatorio.");
      return;
    }
    const cap = adminParseOptionalUint(unitTypeCapacity);
    if (cap === null || cap <= 0) {
      setError("La capacidad máxima debe ser un número entero mayor a 0.");
      return;
    }
    if (unitTypePricingModel === "per_person") {
      const adult = adminParseOptionalUint(unitTypeAdultPrice);
      const child = adminParseOptionalUint(unitTypeChildPrice);
      if (adult === null) {
        setError("Ingresá la tarifa de adulto (número entero, puede ser 0).");
        return;
      }
      if (child === null) {
        setError("Ingresá la tarifa de menor (número entero, puede ser 0).");
        return;
      }
    } else {
      const unitP = adminParseOptionalUint(unitTypePricePerUnit);
      if (unitP === null) {
        setError("Ingresá el precio por unidad (número entero, puede ser 0).");
        return;
      }
    }

    const codeNorm = code.toLowerCase();
    if (unitTypes.some((ut) => ut.code.trim().toLowerCase() === codeNorm)) {
      setError("Ya existe un tipo de unidad con ese código en este camping.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const createdAtMs = Date.now();
      if (unitTypePricingModel === "per_person") {
        const adultPriceArs = adminParseOptionalUint(unitTypeAdultPrice) ?? 0;
        const childPriceArs = adminParseOptionalUint(unitTypeChildPrice) ?? 0;
        await addDoc(collection(db, "unitTypes"), {
          campingId: selectedCamping.id,
          code,
          name,
          pricingModel: "per_person" satisfies UnitTypePricingModel,
          bookingMode: unitTypeBookingMode,
          capacityMax: cap,
          active: true,
          adultPriceArs,
          childPriceArs,
          basePriceArs: adultPriceArs,
          createdAtMs,
        });
      } else {
        const unitPriceArs = adminParseOptionalUint(unitTypePricePerUnit) ?? 0;
        await addDoc(collection(db, "unitTypes"), {
          campingId: selectedCamping.id,
          code,
          name,
          pricingModel: "per_unit" satisfies UnitTypePricingModel,
          bookingMode: unitTypeBookingMode,
          capacityMax: cap,
          active: true,
          unitPriceArs,
          basePriceArs: unitPriceArs,
          createdAtMs,
        });
      }
      const list = await fetchUnitTypesByCamping(selectedCamping.id);
      setUnitTypes(list);
      setUnitTypeName("");
      setUnitTypeCode("");
      setUnitTypeCapacity("");
      setUnitTypePricingModel("per_person");
      setUnitTypeAdultPrice("");
      setUnitTypeChildPrice("");
      setUnitTypePricePerUnit("");
      setUnitTypeBookingMode("overnight_only");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear el tipo de unidad.");
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditUnitType = (ut: UnitType) => {
    setEditingUnitTypeId(ut.id);
    setEditUnitTypeName(ut.name);
    setEditUnitTypeCapacity(String(ut.capacityMax));
    setEditUnitTypePricingModel(ut.pricingModel);
    setEditUnitTypeAdultPrice(ut.adultPriceArs != null ? String(ut.adultPriceArs) : "");
    setEditUnitTypeChildPrice(ut.childPriceArs != null ? String(ut.childPriceArs) : "");
    setEditUnitTypePricePerUnit(
      ut.unitPriceArs != null
        ? String(ut.unitPriceArs)
        : ut.basePriceArs != null
          ? String(ut.basePriceArs)
          : ""
    );
    setEditUnitTypeBookingMode(ut.bookingMode);
    setError(null);
  };

  const handleCancelEditUnitType = () => {
    setEditingUnitTypeId("");
    setEditUnitTypeName("");
    setEditUnitTypeCapacity("");
    setEditUnitTypePricingModel("per_person");
    setEditUnitTypeAdultPrice("");
    setEditUnitTypeChildPrice("");
    setEditUnitTypePricePerUnit("");
    setEditUnitTypeBookingMode("overnight_only");
  };

  const handleSaveEditUnitType = async () => {
    if (!editingUnitTypeId) {
      setError("No hay un tipo en edición.");
      return;
    }
    if (!selectedCamping) {
      setError("Seleccioná un camping.");
      return;
    }
    if (selectedCamping.inventoryMode !== "unit_based") {
      setError("Este camping no usa inventario por unidades.");
      return;
    }
    const name = editUnitTypeName.trim();
    if (!name) {
      setError("El nombre del tipo de unidad es obligatorio.");
      return;
    }
    const editCap = adminParseOptionalUint(editUnitTypeCapacity);
    if (editCap === null || editCap <= 0) {
      setError("La capacidad máxima debe ser un número entero mayor a 0.");
      return;
    }
    if (editUnitTypePricingModel === "per_person") {
      const adult = adminParseOptionalUint(editUnitTypeAdultPrice);
      const child = adminParseOptionalUint(editUnitTypeChildPrice);
      if (adult === null) {
        setError("Ingresá la tarifa de adulto (número entero, puede ser 0).");
        return;
      }
      if (child === null) {
        setError("Ingresá la tarifa de menor (número entero, puede ser 0).");
        return;
      }
    } else {
      const unitP = adminParseOptionalUint(editUnitTypePricePerUnit);
      if (unitP === null) {
        setError("Ingresá el precio por unidad (número entero, puede ser 0).");
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      await updateUnitType(editingUnitTypeId, {
        name,
        capacityMax: editCap,
        pricingModel: editUnitTypePricingModel,
        ...(editUnitTypePricingModel === "per_person"
          ? {
              adultPriceArs: adminParseOptionalUint(editUnitTypeAdultPrice) ?? 0,
              childPriceArs: adminParseOptionalUint(editUnitTypeChildPrice) ?? 0,
            }
          : {
              unitPriceArs: adminParseOptionalUint(editUnitTypePricePerUnit) ?? 0,
            }),
        bookingMode: editUnitTypeBookingMode,
      });
      const list = await fetchUnitTypesByCamping(selectedCamping.id);
      setUnitTypes(list);
      handleCancelEditUnitType();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar el tipo de unidad.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUnit = async () => {
    if (!selectedCamping) {
      setError("Seleccioná un camping.");
      return;
    }
    if (selectedCamping.inventoryMode !== "unit_based") {
      setError("Este camping no usa inventario por unidades.");
      return;
    }
    if (!unitTypeIdToCreate.trim()) {
      setError("Elegí un tipo de unidad.");
      return;
    }
    const displayName = unitDisplayName.trim();
    const number = unitNumber.trim();
    if (!displayName) {
      setError("El nombre visible es obligatorio.");
      return;
    }
    if (!number) {
      setError("El número o código es obligatorio.");
      return;
    }

    const numberNorm = number.toLowerCase();
    if (units.some((u) => u.number.trim().toLowerCase() === numberNorm)) {
      setError("Ya existe una unidad con ese número o identificador en este camping.");
      return;
    }

    const sectorTrimmed = unitSector.trim();
    const priceTrimmed = unitPriceOverride.trim();
    let priceOverrideArs: number | undefined;
    if (priceTrimmed !== "") {
      const n = Number(priceTrimmed.replace(",", "."));
      if (!Number.isFinite(n)) {
        setError("El precio propio debe ser un número válido.");
        return;
      }
      priceOverrideArs = n;
    }

    setSaving(true);
    setError(null);
    try {
      await createUnit({
        campingId: selectedCamping.id,
        unitTypeId: unitTypeIdToCreate.trim(),
        number,
        displayName,
        active: true,
        operationalStatus: "available",
        ...(sectorTrimmed !== "" ? { sector: sectorTrimmed } : {}),
        ...(priceOverrideArs !== undefined ? { priceOverrideArs } : {}),
      });
      const list = await fetchUnitsByCamping(selectedCamping.id);
      setUnits(list);
      setUnitDisplayName("");
      setUnitNumber("");
      setUnitTypeIdToCreate("");
      setUnitSector("");
      setUnitPriceOverride("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear la unidad.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUnitsBulk = async () => {
    if (!selectedCamping) {
      setError("Seleccioná un camping.");
      return;
    }
    if (selectedCamping.inventoryMode !== "unit_based") {
      setError("Este camping no usa inventario por unidades.");
      return;
    }
    const typeId = bulkUnitTypeId.trim();
    if (!typeId) {
      setError("Elegí un tipo de unidad para el lote.");
      return;
    }
    const prefix = bulkPrefix.trim();
    if (!prefix) {
      setError("El prefijo visible es obligatorio.");
      return;
    }
    const fromN = adminParseOptionalUint(bulkFrom);
    const toN = adminParseOptionalUint(bulkTo);
    if (fromN === null || fromN <= 0 || toN === null || toN <= 0) {
      setError("Los números desde y hasta deben ser enteros mayores a 0.");
      return;
    }
    if (toN < fromN) {
      setError("“Hasta” debe ser mayor o igual que “Desde”.");
      return;
    }

    const sectorTrimmed = bulkSector.trim();
    const priceTrimmed = bulkPriceOverride.trim();
    let priceOverrideArs: number | undefined;
    if (priceTrimmed !== "") {
      const parsed = Number(priceTrimmed.replace(",", "."));
      if (!Number.isFinite(parsed)) {
        setError("El precio propio del lote debe ser un número válido.");
        return;
      }
      priceOverrideArs = parsed;
    }

    const existingNumberNorm = new Set(units.map((u) => u.number.trim().toLowerCase()));
    const conflictingNumbers: string[] = [];
    for (let n = fromN; n <= toN; n++) {
      const key = String(n).toLowerCase();
      if (existingNumberNorm.has(key)) {
        conflictingNumbers.push(String(n));
      }
    }
    if (conflictingNumbers.length > 0) {
      const sample = conflictingNumbers.slice(0, 5).join(", ");
      const more = conflictingNumbers.length > 5 ? "…" : "";
      setError(
        `El lote incluye números que ya existen en este camping. Revisá el rango antes de crear. Ejemplos: ${sample}${more}`
      );
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const optionalSector = sectorTrimmed !== "" ? { sector: sectorTrimmed } : {};
      const optionalPrice =
        priceOverrideArs !== undefined ? { priceOverrideArs } : {};

      for (let n = fromN; n <= toN; n++) {
        await createUnit({
          campingId: selectedCamping.id,
          unitTypeId: typeId,
          number: String(n),
          displayName: `${prefix} ${n}`,
          active: true,
          operationalStatus: "available",
          ...optionalSector,
          ...optionalPrice,
        });
      }

      const list = await fetchUnitsByCamping(selectedCamping.id);
      setUnits(list);
      setBulkUnitTypeId("");
      setBulkPrefix("");
      setBulkFrom("1");
      setBulkTo("1");
      setBulkSector("");
      setBulkPriceOverride("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear unidades en lote.");
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditUnit = (u: Unit) => {
    setEditingUnitId(u.id);
    setEditUnitDisplayName(u.displayName);
    setEditUnitNumber(u.number);
    setEditUnitSector(u.sector ?? "");
    setEditUnitPriceOverride(
      u.priceOverrideArs !== undefined ? String(u.priceOverrideArs) : ""
    );
    setError(null);
  };

  const handleCancelEditUnit = () => {
    setEditingUnitId("");
    setEditUnitDisplayName("");
    setEditUnitNumber("");
    setEditUnitSector("");
    setEditUnitPriceOverride("");
  };

  const handleSaveEditUnit = async () => {
    if (!editingUnitId) {
      setError("No hay una unidad en edición.");
      return;
    }
    if (!selectedCamping) {
      setError("Seleccioná un camping.");
      return;
    }
    if (selectedCamping.inventoryMode !== "unit_based") {
      setError("Este camping no usa inventario por unidades.");
      return;
    }
    const displayName = editUnitDisplayName.trim();
    const number = editUnitNumber.trim();
    if (!displayName) {
      setError("El nombre visible es obligatorio.");
      return;
    }
    if (!number) {
      setError("El número o código es obligatorio.");
      return;
    }

    const numberNorm = number.toLowerCase();
    if (
      units.some(
        (u) =>
          u.id !== editingUnitId && u.number.trim().toLowerCase() === numberNorm
      )
    ) {
      setError("Ya existe una unidad con ese número o identificador en este camping.");
      return;
    }

    const sectorTrimmed = editUnitSector.trim();
    const priceTrimmed = editUnitPriceOverride.trim();
    let priceOverrideArs: number | null;
    if (priceTrimmed !== "") {
      const parsed = Number(priceTrimmed.replace(",", "."));
      if (!Number.isFinite(parsed)) {
        setError("El precio propio debe ser un número válido.");
        return;
      }
      priceOverrideArs = parsed;
    } else {
      priceOverrideArs = null;
    }

    setSaving(true);
    setError(null);
    try {
      await updateUnit(editingUnitId, {
        displayName,
        number,
        sector: sectorTrimmed !== "" ? sectorTrimmed : null,
        priceOverrideArs,
      });
      const list = await fetchUnitsByCamping(selectedCamping.id);
      setUnits(list);
      handleCancelEditUnit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar la unidad.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: 10,
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    background: "var(--color-surface)",
    color: "var(--color-text)",
    boxSizing: "border-box",
    minWidth: 0,
  };

  const textAreaStyle: CSSProperties = {
    ...inputStyle,
    resize: "vertical",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: 12,
    lineHeight: 1.4,
    maxWidth: "100%",
    display: "block",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  };

  const flowStepPanel: CSSProperties = {
    display: "grid",
    gap: 14,
    marginTop: 14,
    padding: "18px 16px",
    borderRadius: 12,
    border: "1px solid var(--color-border)",
    background: "var(--color-surface)",
    boxShadow: "0 1px 0 rgba(0, 0, 0, 0.04)",
    minWidth: 0,
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  };

  const flowSubPanelSolo: CSSProperties = {
    display: "grid",
    gap: 10,
    marginTop: 0,
    padding: "16px 14px",
    borderRadius: 10,
    border: "1px solid var(--color-border)",
    borderLeft: "4px solid var(--color-accent)",
    background: "var(--color-surface)",
    minWidth: 0,
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  };

  const flowSubPanelBulk: CSSProperties = {
    display: "grid",
    gap: 10,
    marginTop: 0,
    padding: "16px 14px",
    borderRadius: 10,
    border: "2px dashed var(--color-border)",
    background: "var(--color-surface)",
    minWidth: 0,
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  };

  if (loading || profileLoading) {
    return <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>Cargando…</main>;
  }

  if (!user) return null;

  if (!profile || !profile.activo) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        <Card title="No autorizado">
          <p style={{ marginTop: 0, color: "var(--color-text-muted)" }}>
            No tenés permisos para acceder a esta sección.
          </p>
        </Card>
      </main>
    );
  }

  if (!isAdminGlobal) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        <Card title="Acceso restringido">
          <p style={{ marginTop: 0, color: "var(--color-text-muted)" }}>
            Solo el rol <strong>admin_global</strong> puede editar campings.
          </p>
        </Card>
      </main>
    );
  }

  const campingSidebarUbicacionLine = selectedCamping
    ? getCampingContextLocation(selectedCamping)
    : null;

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "24px 16px",
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ margin: "0 0 12px 0", color: "var(--color-accent)" }}>
        Editar campings
      </h1>
      <p style={{ marginTop: 0, color: "var(--color-text-muted)" }}>
        Cargá descripción corta, links y portada. Los cambios impactan en la Home y en el detalle del camping.
      </p>

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

      <div
        style={{
          display: "grid",
          gap: 16,
          alignItems: "start",
          gridTemplateColumns: "1fr",
        }}
        className="admin-campings-grid"
      >
        <Card title={showNewCamping ? "Nuevo camping" : "Seleccionar camping"}>
          {loadingData ? (
            <p>Cargando…</p>
          ) : showNewCamping ? (
            <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700 }}>ID (slug)</span>
                <input
                  value={newCampingId}
                  onChange={(e) => setNewCampingId(e.target.value)}
                  placeholder="ej: mi-camping"
                  style={inputStyle}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700 }}>Nombre</span>
                <input
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  style={inputStyle}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700 }}>Área protegida</span>
                <input
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  style={inputStyle}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700 }}>Ubicación</span>
                <input
                  value={newUbicacion}
                  onChange={(e) => setNewUbicacion(e.target.value)}
                  style={inputStyle}
                />
              </label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button variant="primary" onClick={createCamping} disabled={saving}>
                  {saving ? "Creando…" : "Crear"}
                </Button>
                <Button variant="secondary" onClick={() => setShowNewCamping(false)} disabled={saving}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="admin-campings-top-inner">
              <div className="admin-campings-top-inner__col-main">
                {campings.length === 0 ? (
                  <>
                    <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 13 }}>
                      No hay campings cargados.
                    </p>
                    <div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowNewCamping(true)}
                        disabled={saving}
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "5px 8px",
                          width: "auto",
                        }}
                      >
                        Crear nuevo camping
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="admin-campings-top-inner__selector">
                      <SelectDropdown
                        label="Camping activo"
                        value={selectedId}
                        options={campingOptions}
                        onChange={setSelectedId}
                        placeholder="Seleccionar…"
                        disabled={loadingData || campings.length === 0 || saving}
                        searchable
                        size="compact"
                        compactDensity="minimal"
                      />
                    </div>
                    <div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowNewCamping(true)}
                        disabled={saving}
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "5px 8px",
                          width: "auto",
                        }}
                      >
                        Crear nuevo camping
                      </Button>
                    </div>
                  </>
                )}
              </div>
              {campings.length > 0 && selectedCamping ? (
                <div className="admin-campings-top-inner__col-aside" aria-label="Resumen del camping activo">
                  <div className="admin-campings-top-summary">
                    <div className="admin-campings-top-summary__name">{selectedCamping.nombre}</div>
                    <div className="admin-campings-top-summary__area">{selectedCamping.areaProtegida}</div>
                    {campingSidebarUbicacionLine ? (
                      <div className="admin-campings-top-summary__loc">{campingSidebarUbicacionLine}</div>
                    ) : null}
                    <span
                      className="admin-campings-top-inventory-badge"
                      title={campingInventoryModeLabel(selectedCamping.inventoryMode)}
                    >
                      {campingInventoryModeShort(selectedCamping.inventoryMode)}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </Card>

        <div style={{ minWidth: 0, width: "100%", maxWidth: "100%" }}>
          <Card title="Camping">
            {showNewCamping ? (
              <p style={{ color: "var(--color-text-muted)" }}>
                Completá el formulario a la izquierda y hacé clic en Crear.
              </p>
            ) : !selectedCamping ? (
              <p>Seleccioná un camping.</p>
            ) : (
              <>
                <AdminCampingSectionNav
                  active={campingEditorTab}
                  onChange={setCampingEditorTab}
                  inventoryUnitBased={selectedCamping.inventoryMode === "unit_based"}
                />
                {campingEditorTab === "data" ? (
                  <AdminCampingDataSection
                    selectedCamping={selectedCamping}
                    form={form}
                    setForm={setForm}
                    cancellationPolicyEnabled={cancellationPolicyEnabled}
                    setCancellationPolicyEnabled={setCancellationPolicyEnabled}
                    cancellationRefundDaysThreshold={cancellationRefundDaysThreshold}
                    setCancellationRefundDaysThreshold={setCancellationRefundDaysThreshold}
                    cancellationRefundPercentBeforeThreshold={cancellationRefundPercentBeforeThreshold}
                    setCancellationRefundPercentBeforeThreshold={
                      setCancellationRefundPercentBeforeThreshold
                    }
                    cancellationRefundPercentAfterThreshold={cancellationRefundPercentAfterThreshold}
                    setCancellationRefundPercentAfterThreshold={
                      setCancellationRefundPercentAfterThreshold
                    }
                    onSave={onSave}
                    onRevert={() => {
                      setForm({
                        descripcionCorta: selectedCamping.descripcionCorta ?? "",
                        serviciosTexto: selectedCamping.serviciosTexto ?? "",
                        igUrl: selectedCamping.igUrl ?? "",
                        webUrl: selectedCamping.webUrl ?? "",
                        coverImageUrl: selectedCamping.coverImageUrl ?? "",
                        ubicacionTexto: selectedCamping.ubicacionTexto ?? "",
                        direccion: selectedCamping.direccion ?? "",
                        mapsUrl: selectedCamping.mapsUrl ?? "",
                        mapsEmbedUrl: selectedCamping.mapsEmbedUrl ?? "",
                      });
                      setCancellationPolicyEnabled(Boolean(selectedCamping.cancellationPolicyEnabled));
                      setCancellationRefundDaysThreshold(
                        typeof selectedCamping.cancellationRefundDaysThreshold === "number" &&
                          Number.isFinite(selectedCamping.cancellationRefundDaysThreshold)
                          ? String(Math.max(0, Math.round(selectedCamping.cancellationRefundDaysThreshold)))
                          : "7"
                      );
                      setCancellationRefundPercentBeforeThreshold(
                        typeof selectedCamping.cancellationRefundPercentBeforeThreshold === "number" &&
                          Number.isFinite(selectedCamping.cancellationRefundPercentBeforeThreshold)
                          ? String(
                              Math.min(
                                100,
                                Math.max(
                                  0,
                                  Math.round(selectedCamping.cancellationRefundPercentBeforeThreshold)
                                )
                              )
                            )
                          : "100"
                      );
                      setCancellationRefundPercentAfterThreshold(
                        typeof selectedCamping.cancellationRefundPercentAfterThreshold === "number" &&
                          Number.isFinite(selectedCamping.cancellationRefundPercentAfterThreshold)
                          ? String(
                              Math.min(
                                100,
                                Math.max(
                                  0,
                                  Math.round(selectedCamping.cancellationRefundPercentAfterThreshold)
                                )
                              )
                            )
                          : "0"
                      );
                    }}
                    saving={saving}
                    inputStyle={inputStyle}
                    textAreaStyle={textAreaStyle}
                  />
                ) : null}
                {selectedCamping.inventoryMode === "unit_based" && campingEditorTab === "unitTypes" ? (
                  <AdminCampingUnitTypesSection
                    panelStyle={flowStepPanel}
                    saving={saving}
                    unitTypes={unitTypes}
                    unitTypePricingModelOptions={unitTypePricingModelOptions}
                    unitTypeBookingModeOptions={unitTypeBookingModeOptions}
                    inputStyle={inputStyle}
                    unitTypeName={unitTypeName}
                    setUnitTypeName={setUnitTypeName}
                    unitTypeCode={unitTypeCode}
                    setUnitTypeCode={setUnitTypeCode}
                    unitTypeCapacity={unitTypeCapacity}
                    setUnitTypeCapacity={setUnitTypeCapacity}
                    unitTypePricingModel={unitTypePricingModel}
                    setUnitTypePricingModel={setUnitTypePricingModel}
                    unitTypeAdultPrice={unitTypeAdultPrice}
                    setUnitTypeAdultPrice={setUnitTypeAdultPrice}
                    unitTypeChildPrice={unitTypeChildPrice}
                    setUnitTypeChildPrice={setUnitTypeChildPrice}
                    unitTypePricePerUnit={unitTypePricePerUnit}
                    setUnitTypePricePerUnit={setUnitTypePricePerUnit}
                    unitTypeBookingMode={unitTypeBookingMode}
                    setUnitTypeBookingMode={setUnitTypeBookingMode}
                    editingUnitTypeId={editingUnitTypeId}
                    editUnitTypeName={editUnitTypeName}
                    setEditUnitTypeName={setEditUnitTypeName}
                    editUnitTypeCapacity={editUnitTypeCapacity}
                    setEditUnitTypeCapacity={setEditUnitTypeCapacity}
                    editUnitTypePricingModel={editUnitTypePricingModel}
                    setEditUnitTypePricingModel={setEditUnitTypePricingModel}
                    editUnitTypeAdultPrice={editUnitTypeAdultPrice}
                    setEditUnitTypeAdultPrice={setEditUnitTypeAdultPrice}
                    editUnitTypeChildPrice={editUnitTypeChildPrice}
                    setEditUnitTypeChildPrice={setEditUnitTypeChildPrice}
                    editUnitTypePricePerUnit={editUnitTypePricePerUnit}
                    setEditUnitTypePricePerUnit={setEditUnitTypePricePerUnit}
                    editUnitTypeBookingMode={editUnitTypeBookingMode}
                    setEditUnitTypeBookingMode={setEditUnitTypeBookingMode}
                    onCreateUnitType={handleCreateUnitType}
                    onStartEditUnitType={handleStartEditUnitType}
                    onCancelEditUnitType={handleCancelEditUnitType}
                    onSaveEditUnitType={handleSaveEditUnitType}
                  />
                ) : null}
                {selectedCamping.inventoryMode === "unit_based" && campingEditorTab === "units" ? (
                  <AdminCampingUnitsSection
                    panelStyle={flowStepPanel}
                    flowSubPanelSolo={flowSubPanelSolo}
                    flowSubPanelBulk={flowSubPanelBulk}
                    units={units}
                    unitTypes={unitTypes}
                    unitTypeSelectOptions={unitTypeSelectOptions}
                    saving={saving}
                    editingUnitId={editingUnitId}
                    editUnitDisplayName={editUnitDisplayName}
                    onEditUnitDisplayNameChange={setEditUnitDisplayName}
                    editUnitNumber={editUnitNumber}
                    onEditUnitNumberChange={setEditUnitNumber}
                    editUnitSector={editUnitSector}
                    onEditUnitSectorChange={setEditUnitSector}
                    editUnitPriceOverride={editUnitPriceOverride}
                    onEditUnitPriceOverrideChange={setEditUnitPriceOverride}
                    onStartEditUnit={handleStartEditUnit}
                    onSaveEditUnit={handleSaveEditUnit}
                    onCancelEditUnit={handleCancelEditUnit}
                    operationalStatusLabel={operationalStatusLabel}
                    inputStyle={inputStyle}
                    unitDisplayName={unitDisplayName}
                    setUnitDisplayName={setUnitDisplayName}
                    unitNumber={unitNumber}
                    setUnitNumber={setUnitNumber}
                    unitTypeIdToCreate={unitTypeIdToCreate}
                    setUnitTypeIdToCreate={setUnitTypeIdToCreate}
                    unitSector={unitSector}
                    setUnitSector={setUnitSector}
                    unitPriceOverride={unitPriceOverride}
                    setUnitPriceOverride={setUnitPriceOverride}
                    onCreateUnit={handleCreateUnit}
                    bulkUnitTypeId={bulkUnitTypeId}
                    setBulkUnitTypeId={setBulkUnitTypeId}
                    bulkPrefix={bulkPrefix}
                    setBulkPrefix={setBulkPrefix}
                    bulkFrom={bulkFrom}
                    setBulkFrom={setBulkFrom}
                    bulkTo={bulkTo}
                    setBulkTo={setBulkTo}
                    bulkSector={bulkSector}
                    setBulkSector={setBulkSector}
                    bulkPriceOverride={bulkPriceOverride}
                    setBulkPriceOverride={setBulkPriceOverride}
                    onCreateUnitsBulk={handleCreateUnitsBulk}
                  />
                ) : null}
              </>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
