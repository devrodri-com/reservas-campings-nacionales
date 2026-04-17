"use client";

import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type {
  UnitType,
  UnitTypeBookingMode,
  UnitTypePricingModel,
} from "@/types/unitType";
import UnitTypeForm from "@/components/admin/UnitTypeForm";
import { Button } from "@/components/ui";
import type { SelectOption } from "@/components/SelectDropdown";

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
  unitTypeCapacity: number;
  setUnitTypeCapacity: Dispatch<SetStateAction<number>>;
  unitTypePricingModel: UnitTypePricingModel;
  setUnitTypePricingModel: Dispatch<SetStateAction<UnitTypePricingModel>>;
  unitTypeAdultPrice: number;
  setUnitTypeAdultPrice: Dispatch<SetStateAction<number>>;
  unitTypeChildPrice: number;
  setUnitTypeChildPrice: Dispatch<SetStateAction<number>>;
  unitTypePricePerUnit: number;
  setUnitTypePricePerUnit: Dispatch<SetStateAction<number>>;
  unitTypeBookingMode: UnitTypeBookingMode;
  setUnitTypeBookingMode: Dispatch<SetStateAction<UnitTypeBookingMode>>;
  editingUnitTypeId: string;
  editUnitTypeName: string;
  setEditUnitTypeName: Dispatch<SetStateAction<string>>;
  editUnitTypeCapacity: number;
  setEditUnitTypeCapacity: Dispatch<SetStateAction<number>>;
  editUnitTypePricingModel: UnitTypePricingModel;
  setEditUnitTypePricingModel: Dispatch<SetStateAction<UnitTypePricingModel>>;
  editUnitTypeAdultPrice: number;
  setEditUnitTypeAdultPrice: Dispatch<SetStateAction<number>>;
  editUnitTypeChildPrice: number;
  setEditUnitTypeChildPrice: Dispatch<SetStateAction<number>>;
  editUnitTypePricePerUnit: number;
  setEditUnitTypePricePerUnit: Dispatch<SetStateAction<number>>;
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
                  <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                    <strong>{ut.name}</strong> · código <code>{ut.code}</code> · capacidad {ut.capacityMax} ·{" "}
                    {ut.pricingModel === "per_unit"
                      ? typeof ut.unitPriceArs === "number"
                        ? `Por unidad · $${ut.unitPriceArs.toLocaleString("es-AR")} ARS`
                        : "Precio no disponible"
                      : typeof ut.adultPriceArs === "number" && typeof ut.childPriceArs === "number"
                        ? `Por persona · adulto $${ut.adultPriceArs.toLocaleString("es-AR")} ARS · menor $${ut.childPriceArs.toLocaleString("es-AR")} ARS`
                        : "Precio no disponible"}
                  </div>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => onStartEditUnitType(ut)}
                    disabled={saving || editingUnitTypeId !== ""}
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
          paddingTop: 12,
          borderTop: "1px dashed var(--color-border)",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14 }}>Nuevo tipo</span>
        <UnitTypeForm
          name={unitTypeName}
          onNameChange={setUnitTypeName}
          code={unitTypeCode}
          onCodeChange={setUnitTypeCode}
          codePlaceholder="ej: cabaña-4p"
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
