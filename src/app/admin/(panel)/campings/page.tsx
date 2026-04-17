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

type EditableFields = Pick<
  Camping,
  "descripcionCorta" | "igUrl" | "webUrl" | "coverImageUrl" | "direccion" | "mapsUrl" | "mapsEmbedUrl"
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

function looksLikeHttpUrl(s: string): boolean {
  const t = s.trim();
  if (/^https?:\/\//i.test(t) || /^\/\//.test(t)) return true;
  if (/^www\.google\./i.test(t) && t.toLowerCase().includes("maps")) return true;
  return false;
}

/** Ubicación que no conviene mostrar en el lateral (links Maps, embeds, acortadores, etc.). */
function looksLikeMapsOrLinkNoise(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (looksLikeHttpUrl(t)) return true;
  const lower = t.toLowerCase();
  if (/^maps\.app\.goo\.gl\//i.test(t)) return true;
  if (lower.includes("google.com/maps") || lower.includes("maps.google")) return true;
  if (lower.includes("maps/embed") || lower.includes("/embed?")) return true;
  if (lower.includes("goo.gl/maps") || lower.includes("maps.app.goo.gl")) return true;
  return false;
}

/** Texto de ubicación para el resumen lateral: sin URLs ni cadenas enormes. */
function campingContextUbicacionLine(raw: string | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  if (looksLikeMapsOrLinkNoise(t)) return null;
  if (t.length > 120) return `${t.slice(0, 117)}…`;
  return t;
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
    igUrl: "",
    webUrl: "",
    coverImageUrl: "",
    direccion: "",
    mapsUrl: "",
    mapsEmbedUrl: "",
  });

  const [cancellationPolicyEnabled, setCancellationPolicyEnabled] = useState(false);
  const [cancellationRefundDaysThreshold, setCancellationRefundDaysThreshold] = useState(7);
  const [cancellationRefundPercentBeforeThreshold, setCancellationRefundPercentBeforeThreshold] =
    useState(100);
  const [cancellationRefundPercentAfterThreshold, setCancellationRefundPercentAfterThreshold] =
    useState(0);

  const [saving, setSaving] = useState(false);
  const [showNewCamping, setShowNewCamping] = useState(false);
  const [newCampingId, setNewCampingId] = useState("");
  const [newNombre, setNewNombre] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newUbicacion, setNewUbicacion] = useState("");

  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [unitTypeName, setUnitTypeName] = useState("");
  const [unitTypeCode, setUnitTypeCode] = useState("");
  const [unitTypeCapacity, setUnitTypeCapacity] = useState(1);
  const [unitTypePricingModel, setUnitTypePricingModel] =
    useState<UnitTypePricingModel>("per_person");
  const [unitTypeAdultPrice, setUnitTypeAdultPrice] = useState(0);
  const [unitTypeChildPrice, setUnitTypeChildPrice] = useState(0);
  const [unitTypePricePerUnit, setUnitTypePricePerUnit] = useState(0);
  const [unitTypeBookingMode, setUnitTypeBookingMode] =
    useState<UnitTypeBookingMode>("overnight_only");

  const [editingUnitTypeId, setEditingUnitTypeId] = useState("");
  const [editUnitTypeName, setEditUnitTypeName] = useState("");
  const [editUnitTypeCapacity, setEditUnitTypeCapacity] = useState(1);
  const [editUnitTypePricingModel, setEditUnitTypePricingModel] =
    useState<UnitTypePricingModel>("per_person");
  const [editUnitTypeAdultPrice, setEditUnitTypeAdultPrice] = useState(0);
  const [editUnitTypeChildPrice, setEditUnitTypeChildPrice] = useState(0);
  const [editUnitTypePricePerUnit, setEditUnitTypePricePerUnit] = useState(0);
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
  const [bulkFromNumber, setBulkFromNumber] = useState(1);
  const [bulkToNumber, setBulkToNumber] = useState(1);
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
    setUnitTypeCapacity(1);
    setUnitTypePricingModel("per_person");
    setUnitTypeAdultPrice(0);
    setUnitTypeChildPrice(0);
    setUnitTypePricePerUnit(0);
    setUnitTypeBookingMode("overnight_only");

    setUnitDisplayName("");
    setUnitNumber("");
    setUnitTypeIdToCreate("");
    setUnitSector("");
    setUnitPriceOverride("");

    setBulkUnitTypeId("");
    setBulkPrefix("");
    setBulkFromNumber(1);
    setBulkToNumber(1);
    setBulkSector("");
    setBulkPriceOverride("");

    setEditingUnitTypeId("");
    setEditUnitTypeName("");
    setEditUnitTypeCapacity(1);
    setEditUnitTypePricingModel("per_person");
    setEditUnitTypeAdultPrice(0);
    setEditUnitTypeChildPrice(0);
    setEditUnitTypePricePerUnit(0);
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
      igUrl: selectedCamping.igUrl ?? "",
      webUrl: selectedCamping.webUrl ?? "",
      coverImageUrl: selectedCamping.coverImageUrl ?? "",
      direccion: selectedCamping.direccion ?? "",
      mapsUrl: selectedCamping.mapsUrl ?? "",
      mapsEmbedUrl: selectedCamping.mapsEmbedUrl ?? "",
    });
    setCancellationPolicyEnabled(Boolean(selectedCamping.cancellationPolicyEnabled));
    setCancellationRefundDaysThreshold(
      typeof selectedCamping.cancellationRefundDaysThreshold === "number" &&
        Number.isFinite(selectedCamping.cancellationRefundDaysThreshold)
        ? Math.max(0, Math.round(selectedCamping.cancellationRefundDaysThreshold))
        : 7
    );
    setCancellationRefundPercentBeforeThreshold(
      typeof selectedCamping.cancellationRefundPercentBeforeThreshold === "number" &&
        Number.isFinite(selectedCamping.cancellationRefundPercentBeforeThreshold)
        ? Math.min(100, Math.max(0, Math.round(selectedCamping.cancellationRefundPercentBeforeThreshold)))
        : 100
    );
    setCancellationRefundPercentAfterThreshold(
      typeof selectedCamping.cancellationRefundPercentAfterThreshold === "number" &&
        Number.isFinite(selectedCamping.cancellationRefundPercentAfterThreshold)
        ? Math.min(100, Math.max(0, Math.round(selectedCamping.cancellationRefundPercentAfterThreshold)))
        : 0
    );
  }, [selectedCamping]);

  const onSave = async () => {
    if (!selectedCamping) return;

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
        igUrl: sanitizeUrl(form.igUrl || ""),
        webUrl: sanitizeUrl(form.webUrl || ""),
        coverImageUrl: sanitizeUrl(form.coverImageUrl || ""),
        direccion: form.direccion?.trim() || "",
        mapsUrl: sanitizeUrl(form.mapsUrl || ""),
        mapsEmbedUrl: sanitizeUrl(extractIframeSrc(form.mapsEmbedUrl || "")),
        cancellationPolicyEnabled,
        cancellationRefundDaysThreshold: Math.max(
          0,
          Math.round(
            Number.isFinite(cancellationRefundDaysThreshold)
              ? cancellationRefundDaysThreshold
              : 0
          )
        ),
        cancellationRefundPercentBeforeThreshold: Math.min(
          100,
          Math.max(
            0,
            Math.round(
              Number.isFinite(cancellationRefundPercentBeforeThreshold)
                ? cancellationRefundPercentBeforeThreshold
                : 0
            )
          )
        ),
        cancellationRefundPercentAfterThreshold: Math.min(
          100,
          Math.max(
            0,
            Math.round(
              Number.isFinite(cancellationRefundPercentAfterThreshold)
                ? cancellationRefundPercentAfterThreshold
                : 0
            )
          )
        ),
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
    if (unitTypeCapacity <= 0) {
      setError("La capacidad máxima debe ser mayor a 0.");
      return;
    }
    if (unitTypePricingModel === "per_person") {
      if (!Number.isFinite(unitTypeAdultPrice) || unitTypeAdultPrice < 0) {
        setError("La tarifa de adulto debe ser numérica y mayor o igual a 0.");
        return;
      }
      if (!Number.isFinite(unitTypeChildPrice) || unitTypeChildPrice < 0) {
        setError("La tarifa de menor debe ser numérica y mayor o igual a 0.");
        return;
      }
    } else {
      if (!Number.isFinite(unitTypePricePerUnit) || unitTypePricePerUnit < 0) {
        setError("El precio por unidad debe ser numérico y mayor o igual a 0.");
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
        const adultPriceArs = Number(unitTypeAdultPrice);
        const childPriceArs = Number(unitTypeChildPrice);
        await addDoc(collection(db, "unitTypes"), {
          campingId: selectedCamping.id,
          code,
          name,
          pricingModel: "per_person" satisfies UnitTypePricingModel,
          bookingMode: unitTypeBookingMode,
          capacityMax: unitTypeCapacity,
          active: true,
          adultPriceArs,
          childPriceArs,
          basePriceArs: adultPriceArs,
          createdAtMs,
        });
      } else {
        const unitPriceArs = Number(unitTypePricePerUnit);
        await addDoc(collection(db, "unitTypes"), {
          campingId: selectedCamping.id,
          code,
          name,
          pricingModel: "per_unit" satisfies UnitTypePricingModel,
          bookingMode: unitTypeBookingMode,
          capacityMax: unitTypeCapacity,
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
      setUnitTypeCapacity(1);
      setUnitTypePricingModel("per_person");
      setUnitTypeAdultPrice(0);
      setUnitTypeChildPrice(0);
      setUnitTypePricePerUnit(0);
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
    setEditUnitTypeCapacity(ut.capacityMax);
    setEditUnitTypePricingModel(ut.pricingModel);
    setEditUnitTypeAdultPrice(ut.adultPriceArs ?? 0);
    setEditUnitTypeChildPrice(ut.childPriceArs ?? 0);
    setEditUnitTypePricePerUnit(ut.unitPriceArs ?? ut.basePriceArs ?? 0);
    setEditUnitTypeBookingMode(ut.bookingMode);
    setError(null);
  };

  const handleCancelEditUnitType = () => {
    setEditingUnitTypeId("");
    setEditUnitTypeName("");
    setEditUnitTypeCapacity(1);
    setEditUnitTypePricingModel("per_person");
    setEditUnitTypeAdultPrice(0);
    setEditUnitTypeChildPrice(0);
    setEditUnitTypePricePerUnit(0);
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
    if (editUnitTypeCapacity <= 0) {
      setError("La capacidad máxima debe ser mayor a 0.");
      return;
    }
    if (editUnitTypePricingModel === "per_person") {
      if (!Number.isFinite(editUnitTypeAdultPrice) || editUnitTypeAdultPrice < 0) {
        setError("La tarifa de adulto debe ser numérica y mayor o igual a 0.");
        return;
      }
      if (!Number.isFinite(editUnitTypeChildPrice) || editUnitTypeChildPrice < 0) {
        setError("La tarifa de menor debe ser numérica y mayor o igual a 0.");
        return;
      }
    } else {
      if (!Number.isFinite(editUnitTypePricePerUnit) || editUnitTypePricePerUnit < 0) {
        setError("El precio por unidad debe ser numérico y mayor o igual a 0.");
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      await updateUnitType(editingUnitTypeId, {
        name,
        capacityMax: editUnitTypeCapacity,
        pricingModel: editUnitTypePricingModel,
        ...(editUnitTypePricingModel === "per_person"
          ? {
              adultPriceArs: Number(editUnitTypeAdultPrice),
              childPriceArs: Number(editUnitTypeChildPrice),
            }
          : {
              unitPriceArs: Number(editUnitTypePricePerUnit),
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
    if (bulkFromNumber <= 0 || bulkToNumber <= 0) {
      setError("Los números desde y hasta deben ser mayores a 0.");
      return;
    }
    if (bulkToNumber < bulkFromNumber) {
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
    for (let n = bulkFromNumber; n <= bulkToNumber; n++) {
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

      for (let n = bulkFromNumber; n <= bulkToNumber; n++) {
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
      setBulkFromNumber(1);
      setBulkToNumber(1);
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
    marginTop: 4,
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
    marginTop: 16,
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
    ? campingContextUbicacionLine(selectedCamping.ubicacionTexto)
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
        <Card title="Listado">
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
            <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <Button
                  variant="secondary"
                  onClick={() => setShowNewCamping(true)}
                  style={{ width: "auto", flex: "0 0 auto" }}
                >
                  Crear nuevo camping
                </Button>
              </div>
              {campings.length === 0 ? (
                <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 13 }}>
                  No hay campings cargados.
                </p>
              ) : (
                <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "min(100%, 200px)",
                      minWidth: 0,
                    }}
                  >
                    <SelectDropdown
                      label="Elegí camping"
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
                  {selectedCamping ? (
                    <div
                      style={{
                        margin: 0,
                        padding: "7px 9px",
                        display: "grid",
                        gap: 4,
                        minWidth: 0,
                        borderRadius: 8,
                        border: "1px solid color-mix(in srgb, var(--color-border) 75%, transparent)",
                        background: "color-mix(in srgb, var(--color-border) 4%, var(--color-surface))",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 13,
                          color: "var(--color-text)",
                          lineHeight: 1.35,
                          overflowWrap: "anywhere",
                          wordBreak: "break-word",
                        }}
                      >
                        {selectedCamping.nombre}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--color-text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          overflowWrap: "anywhere",
                          wordBreak: "break-word",
                        }}
                      >
                        {selectedCamping.areaProtegida}
                      </div>
                      {campingSidebarUbicacionLine ? (
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--color-text-muted)",
                            lineHeight: 1.45,
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                          }}
                        >
                          {campingSidebarUbicacionLine}
                        </div>
                      ) : null}
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--color-text)",
                          paddingTop: 2,
                          borderTop: "1px solid var(--color-border)",
                        }}
                      >
                        {campingInventoryModeLabel(selectedCamping.inventoryMode)}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
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
                        igUrl: selectedCamping.igUrl ?? "",
                        webUrl: selectedCamping.webUrl ?? "",
                        coverImageUrl: selectedCamping.coverImageUrl ?? "",
                        direccion: selectedCamping.direccion ?? "",
                        mapsUrl: selectedCamping.mapsUrl ?? "",
                        mapsEmbedUrl: selectedCamping.mapsEmbedUrl ?? "",
                      });
                      setCancellationPolicyEnabled(Boolean(selectedCamping.cancellationPolicyEnabled));
                      setCancellationRefundDaysThreshold(
                        typeof selectedCamping.cancellationRefundDaysThreshold === "number" &&
                          Number.isFinite(selectedCamping.cancellationRefundDaysThreshold)
                          ? Math.max(0, Math.round(selectedCamping.cancellationRefundDaysThreshold))
                          : 7
                      );
                      setCancellationRefundPercentBeforeThreshold(
                        typeof selectedCamping.cancellationRefundPercentBeforeThreshold === "number" &&
                          Number.isFinite(selectedCamping.cancellationRefundPercentBeforeThreshold)
                          ? Math.min(
                              100,
                              Math.max(
                                0,
                                Math.round(selectedCamping.cancellationRefundPercentBeforeThreshold)
                              )
                            )
                          : 100
                      );
                      setCancellationRefundPercentAfterThreshold(
                        typeof selectedCamping.cancellationRefundPercentAfterThreshold === "number" &&
                          Number.isFinite(selectedCamping.cancellationRefundPercentAfterThreshold)
                          ? Math.min(
                              100,
                              Math.max(
                                0,
                                Math.round(selectedCamping.cancellationRefundPercentAfterThreshold)
                              )
                            )
                          : 0
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
                    bulkFromNumber={bulkFromNumber}
                    setBulkFromNumber={setBulkFromNumber}
                    bulkToNumber={bulkToNumber}
                    setBulkToNumber={setBulkToNumber}
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
