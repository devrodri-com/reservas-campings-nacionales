"use client";

import { useEffect, type CSSProperties, type Dispatch, type SetStateAction } from "react";
import type {
  UnitType,
  UnitTypeBookingMode,
  UnitTypePricingModel,
} from "@/types/unitType";
import UnitTypeForm from "@/components/admin/UnitTypeForm";
import { Button } from "@/components/ui";
import type { SelectOption } from "@/components/SelectDropdown";

const UNIT_TYPE_CODE_HELP =
  "Identificador interno corto (sin espacios). Sirve para distinguir tipos aunque el nombre visible sea parecido.";

const UNIT_TYPE_BOOKING_MODE_HELP =
  "Indica si este tipo aplica a estadías nocturnas, visitas de día o ambos. Es referencia para el operador; la experiencia pública puede depender de otras configuraciones del camping.";

const mutedMeta: CSSProperties = {
  fontSize: 12,
  color: "var(--color-text-muted)",
  lineHeight: 1.45,
};

const metaLabel: CSSProperties = {
  color: "var(--color-text-muted)",
  fontWeight: 600,
  marginRight: 4,
};

export type AdminCampingUnitTypesSectionProps = {
  panelStyle: CSSProperties;
  saving: boolean;
  unitTypes: UnitType[];
  unitTypePricingModelOptions: SelectOption[];
  unitTypeBookingModeOptions: SelectOption[];
  inputStyle: CSSProperties;
  unitTypeName: string;
  setUnitTypeName: Dispatch<SetStateAction<string>>;
  unitTypeCode: string;
  setUnitTypeCode: Dispatch<SetStateAction<string>>;
  unitTypeCapacity: string;
  setUnitTypeCapacity: Dispatch<SetStateAction<string>>;
  unitTypePricingModel: UnitTypePricingModel;
  setUnitTypePricingModel: Dispatch<SetStateAction<UnitTypePricingModel>>;
  unitTypeAdultPrice: string;
  setUnitTypeAdultPrice: Dispatch<SetStateAction<string>>;
  unitTypeChildPrice: string;
  setUnitTypeChildPrice: Dispatch<SetStateAction<string>>;
  unitTypePricePerUnit: string;
  setUnitTypePricePerUnit: Dispatch<SetStateAction<string>>;
  unitTypeBookingMode: UnitTypeBookingMode;
  setUnitTypeBookingMode: Dispatch<SetStateAction<UnitTypeBookingMode>>;
  editingUnitTypeId: string;
  editUnitTypeName: string;
  setEditUnitTypeName: Dispatch<SetStateAction<string>>;
  editUnitTypeCapacity: string;
  setEditUnitTypeCapacity: Dispatch<SetStateAction<string>>;
  editUnitTypePricingModel: UnitTypePricingModel;
  setEditUnitTypePricingModel: Dispatch<SetStateAction<UnitTypePricingModel>>;
  editUnitTypeAdultPrice: string;
  setEditUnitTypeAdultPrice: Dispatch<SetStateAction<string>>;
  editUnitTypeChildPrice: string;
  setEditUnitTypeChildPrice: Dispatch<SetStateAction<string>>;
  editUnitTypePricePerUnit: string;
  setEditUnitTypePricePerUnit: Dispatch<SetStateAction<string>>;
  editUnitTypeBookingMode: UnitTypeBookingMode;
  setEditUnitTypeBookingMode: Dispatch<SetStateAction<UnitTypeBookingMode>>;
  onCreateUnitType: () => void;
  onStartEditUnitType: (ut: UnitType) => void;
  onCancelEditUnitType: () => void;
  onSaveEditUnitType: () => void;
};

export default function AdminCampingUnitTypesSection({
  panelStyle,
  saving,
  unitTypes,
  unitTypePricingModelOptions,
  unitTypeBookingModeOptions,
  inputStyle,
  unitTypeName,
  setUnitTypeName,
  unitTypeCode,
  setUnitTypeCode,
  unitTypeCapacity,
  setUnitTypeCapacity,
  unitTypePricingModel,
  setUnitTypePricingModel,
  unitTypeAdultPrice,
  setUnitTypeAdultPrice,
  unitTypeChildPrice,
  setUnitTypeChildPrice,
  unitTypePricePerUnit,
  setUnitTypePricePerUnit,
  unitTypeBookingMode,
  setUnitTypeBookingMode,
  editingUnitTypeId,
  editUnitTypeName,
  setEditUnitTypeName,
  editUnitTypeCapacity,
  setEditUnitTypeCapacity,
  editUnitTypePricingModel,
  setEditUnitTypePricingModel,
  editUnitTypeAdultPrice,
  setEditUnitTypeAdultPrice,
  editUnitTypeChildPrice,
  setEditUnitTypeChildPrice,
  editUnitTypePricePerUnit,
  setEditUnitTypePricePerUnit,
  editUnitTypeBookingMode,
  setEditUnitTypeBookingMode,
  onCreateUnitType,
  onStartEditUnitType,
  onCancelEditUnitType,
  onSaveEditUnitType,
}: AdminCampingUnitTypesSectionProps) {
  useEffect(() => {
    if (!editingUnitTypeId) return;
    const el = document.getElementById(`admin-unit-type-edit-${editingUnitTypeId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [editingUnitTypeId]);

  return (
    <div style={panelStyle}>
      <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.45 }}>
        Definí primero las categorías base (por ejemplo Parcela, Cabaña). Luego podés cargar las unidades en la
        pestaña <strong>Unidades</strong>.
      </p>
      {unitTypes.length === 0 ? (
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>Todavía no hay tipos cargados.</p>
      ) : (
        <ul
          style={{
            margin: 0,
            paddingLeft: 0,
            listStyle: "none",
            color: "var(--color-text)",
            display: "grid",
            gap: 12,
          }}
        >
          {unitTypes.map((ut) => (
            <li
              key={ut.id}
              id={editingUnitTypeId === ut.id ? `admin-unit-type-edit-${ut.id}` : undefined}
              style={{
                paddingBottom: 12,
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              {editingUnitTypeId === ut.id ? (
                <UnitTypeForm
                  name={editUnitTypeName}
                  onNameChange={setEditUnitTypeName}
                  code={ut.code}
                  capacityMax={editUnitTypeCapacity}
                  onCapacityMaxChange={setEditUnitTypeCapacity}
                  pricingModel={editUnitTypePricingModel}
                  onPricingModelChange={setEditUnitTypePricingModel}
                  pricingModelOptions={unitTypePricingModelOptions}
                  adultPriceArs={editUnitTypeAdultPrice}
                  onAdultPriceArsChange={setEditUnitTypeAdultPrice}
                  childPriceArs={editUnitTypeChildPrice}
                  onChildPriceArsChange={setEditUnitTypeChildPrice}
                  unitPriceArs={editUnitTypePricePerUnit}
                  onUnitPriceArsChange={setEditUnitTypePricePerUnit}
                  bookingMode={editUnitTypeBookingMode}
                  onBookingModeChange={setEditUnitTypeBookingMode}
                  bookingModeOptions={unitTypeBookingModeOptions}
                  bookingModeHelp={UNIT_TYPE_BOOKING_MODE_HELP}
                  saving={saving}
                  submitLabel="Guardar"
                  onSubmit={onSaveEditUnitType}
                  onCancel={onCancelEditUnitType}
                  inputStyle={inputStyle}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ flex: "1 1 200px", minWidth: 0, display: "grid", gap: 6 }}>
                    <div style={{ color: "var(--color-text)" }}>
                      <strong style={{ fontSize: 15 }}>{ut.name}</strong>
                      <span style={{ ...mutedMeta, marginLeft: 8, fontSize: 13 }}>
                        · código <code style={{ fontSize: 12 }}>{ut.code}</code>
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        columnGap: 14,
                        rowGap: 4,
                        alignItems: "baseline",
                        fontSize: 13,
                        color: "var(--color-text)",
                      }}
                    >
                      <span>
                        <span style={metaLabel}>Capacidad</span>
                        {ut.capacityMax}
                      </span>
                      <span>
                        <span style={metaLabel}>Cobro</span>
                        {ut.pricingModel === "per_unit" ? "Por unidad" : "Por persona"}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span style={metaLabel}>Precio</span>
                        {ut.pricingModel === "per_unit"
                          ? typeof ut.unitPriceArs === "number"
                            ? `$${ut.unitPriceArs.toLocaleString("es-AR")}`
                            : "—"
                          : typeof ut.adultPriceArs === "number" && typeof ut.childPriceArs === "number"
                            ? `adulto $${ut.adultPriceArs.toLocaleString("es-AR")} · menor $${ut.childPriceArs.toLocaleString("es-AR")}`
                            : "—"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => onStartEditUnitType(ut)}
                    disabled={saving}
                  >
                    Editar
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <div
        style={{
          display: "grid",
          gap: 10,
          paddingTop: 20,
          marginTop: 4,
          borderTop: "1px dashed var(--color-border)",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontWeight: 800,
            fontSize: 15,
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
            color: "var(--color-text)",
          }}
        >
          Nuevo tipo
        </h3>
        <UnitTypeForm
          name={unitTypeName}
          onNameChange={setUnitTypeName}
          code={unitTypeCode}
          onCodeChange={setUnitTypeCode}
          codePlaceholder="ej: cabaña-4p"
          codeHelp={UNIT_TYPE_CODE_HELP}
          bookingModeHelp={UNIT_TYPE_BOOKING_MODE_HELP}
          capacityMax={unitTypeCapacity}
          onCapacityMaxChange={setUnitTypeCapacity}
          pricingModel={unitTypePricingModel}
          onPricingModelChange={setUnitTypePricingModel}
          pricingModelOptions={unitTypePricingModelOptions}
          adultPriceArs={unitTypeAdultPrice}
          onAdultPriceArsChange={setUnitTypeAdultPrice}
          childPriceArs={unitTypeChildPrice}
          onChildPriceArsChange={setUnitTypeChildPrice}
          unitPriceArs={unitTypePricePerUnit}
          onUnitPriceArsChange={setUnitTypePricePerUnit}
          bookingMode={unitTypeBookingMode}
          onBookingModeChange={setUnitTypeBookingMode}
          bookingModeOptions={unitTypeBookingModeOptions}
          saving={saving}
          submitLabel="Crear tipo"
          onSubmit={onCreateUnitType}
          inputStyle={inputStyle}
        />
      </div>
    </div>
  );
}
