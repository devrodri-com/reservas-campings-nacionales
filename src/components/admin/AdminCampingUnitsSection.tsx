"use client";

import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type { Unit } from "@/types/unit";
import type { UnitType } from "@/types/unitType";
import AdminCampingUnitsList from "@/components/admin/AdminCampingUnitsList";
import { Button } from "@/components/ui";
import SelectDropdown from "@/components/SelectDropdown";
import type { SelectOption } from "@/components/SelectDropdown";

export type AdminCampingUnitsSectionProps = {
  panelStyle: CSSProperties;
  flowSubPanelSolo: CSSProperties;
  flowSubPanelBulk: CSSProperties;
  units: Unit[];
  unitTypes: UnitType[];
  unitTypeSelectOptions: SelectOption[];
  saving: boolean;
  editingUnitId: string;
  editUnitDisplayName: string;
  onEditUnitDisplayNameChange: Dispatch<SetStateAction<string>>;
  editUnitNumber: string;
  onEditUnitNumberChange: Dispatch<SetStateAction<string>>;
  editUnitSector: string;
  onEditUnitSectorChange: Dispatch<SetStateAction<string>>;
  editUnitPriceOverride: string;
  onEditUnitPriceOverrideChange: Dispatch<SetStateAction<string>>;
  onStartEditUnit: (u: Unit) => void;
  onSaveEditUnit: () => void;
  onCancelEditUnit: () => void;
  operationalStatusLabel: (status: Unit["operationalStatus"]) => string;
  inputStyle: CSSProperties;
  unitDisplayName: string;
  setUnitDisplayName: Dispatch<SetStateAction<string>>;
  unitNumber: string;
  setUnitNumber: Dispatch<SetStateAction<string>>;
  unitTypeIdToCreate: string;
  setUnitTypeIdToCreate: Dispatch<SetStateAction<string>>;
  unitSector: string;
  setUnitSector: Dispatch<SetStateAction<string>>;
  unitPriceOverride: string;
  setUnitPriceOverride: Dispatch<SetStateAction<string>>;
  onCreateUnit: () => void;
  bulkUnitTypeId: string;
  setBulkUnitTypeId: Dispatch<SetStateAction<string>>;
  bulkPrefix: string;
  setBulkPrefix: Dispatch<SetStateAction<string>>;
  bulkFromNumber: number;
  setBulkFromNumber: Dispatch<SetStateAction<number>>;
  bulkToNumber: number;
  setBulkToNumber: Dispatch<SetStateAction<number>>;
  bulkSector: string;
  setBulkSector: Dispatch<SetStateAction<string>>;
  bulkPriceOverride: string;
  setBulkPriceOverride: Dispatch<SetStateAction<string>>;
  onCreateUnitsBulk: () => void;
};

export default function AdminCampingUnitsSection({
  panelStyle,
  flowSubPanelSolo,
  flowSubPanelBulk,
  units,
  unitTypes,
  unitTypeSelectOptions,
  saving,
  editingUnitId,
  editUnitDisplayName,
  onEditUnitDisplayNameChange,
  editUnitNumber,
  onEditUnitNumberChange,
  editUnitSector,
  onEditUnitSectorChange,
  editUnitPriceOverride,
  onEditUnitPriceOverrideChange,
  onStartEditUnit,
  onSaveEditUnit,
  onCancelEditUnit,
  operationalStatusLabel,
  inputStyle,
  unitDisplayName,
  setUnitDisplayName,
  unitNumber,
  setUnitNumber,
  unitTypeIdToCreate,
  setUnitTypeIdToCreate,
  unitSector,
  setUnitSector,
  unitPriceOverride,
  setUnitPriceOverride,
  onCreateUnit,
  bulkUnitTypeId,
  setBulkUnitTypeId,
  bulkPrefix,
  setBulkPrefix,
  bulkFromNumber,
  setBulkFromNumber,
  bulkToNumber,
  setBulkToNumber,
  bulkSector,
  setBulkSector,
  bulkPriceOverride,
  setBulkPriceOverride,
  onCreateUnitsBulk,
}: AdminCampingUnitsSectionProps) {
  return (
    <div style={panelStyle}>
      <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.45 }}>
        Gestioná las unidades reales del camping: listado, alta individual y creación en lote.
      </p>
      <AdminCampingUnitsList
        units={units}
        unitTypes={unitTypes}
        editingUnitId={editingUnitId}
        saving={saving}
        editUnitDisplayName={editUnitDisplayName}
        onEditUnitDisplayNameChange={onEditUnitDisplayNameChange}
        editUnitNumber={editUnitNumber}
        onEditUnitNumberChange={onEditUnitNumberChange}
        editUnitSector={editUnitSector}
        onEditUnitSectorChange={onEditUnitSectorChange}
        editUnitPriceOverride={editUnitPriceOverride}
        onEditUnitPriceOverrideChange={onEditUnitPriceOverrideChange}
        onStartEditUnit={onStartEditUnit}
        onSaveEditUnit={onSaveEditUnit}
        onCancelEditUnit={onCancelEditUnit}
        operationalStatusLabel={operationalStatusLabel}
        inputStyle={inputStyle}
      />

      <div style={flowSubPanelSolo}>
        <span style={{ fontWeight: 800, fontSize: 15 }}>Crear una unidad</span>
        <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 13, lineHeight: 1.45 }}>
          Usá este formulario si querés crear una unidad puntual.
        </p>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Nombre visible</span>
          <input
            value={unitDisplayName}
            onChange={(e) => setUnitDisplayName(e.target.value)}
            style={inputStyle}
            disabled={saving || unitTypes.length === 0}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Número / código</span>
          <input
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            style={inputStyle}
            disabled={saving || unitTypes.length === 0}
            placeholder="ej: A-12"
          />
        </label>
        <SelectDropdown
          label="Tipo de unidad"
          value={unitTypeIdToCreate}
          options={unitTypeSelectOptions}
          onChange={setUnitTypeIdToCreate}
          placeholder="Seleccionar tipo…"
          disabled={saving || unitTypes.length === 0}
        />
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Sector (opcional)</span>
          <input
            value={unitSector}
            onChange={(e) => setUnitSector(e.target.value)}
            style={inputStyle}
            disabled={saving || unitTypes.length === 0}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Precio propio (opcional, ARS)</span>
          <input
            value={unitPriceOverride}
            onChange={(e) => setUnitPriceOverride(e.target.value)}
            style={inputStyle}
            disabled={saving || unitTypes.length === 0}
            placeholder="Vacío = usa precio del tipo"
            inputMode="decimal"
          />
        </label>
        <div>
          <Button variant="secondary" onClick={onCreateUnit} disabled={saving || unitTypes.length === 0}>
            {saving ? "Guardando…" : "Crear unidad"}
          </Button>
        </div>
      </div>

      <div style={flowSubPanelBulk}>
        <span style={{ fontWeight: 800, fontSize: 15 }}>Crear unidades en lote</span>
        <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 13, lineHeight: 1.45 }}>
          Usá este bloque si querés crear muchas unidades parecidas de una sola vez.
        </p>
        <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 13 }}>
          Ejemplo: prefijo <strong>Parcela</strong>, desde <strong>1</strong>, hasta <strong>55</strong> → se crean
          “Parcela 1” … “Parcela 55” con número <code>1</code> … <code>55</code>.
        </p>
        <SelectDropdown
          label="Tipo de unidad"
          value={bulkUnitTypeId}
          options={unitTypeSelectOptions}
          onChange={setBulkUnitTypeId}
          placeholder="Seleccionar tipo…"
          disabled={saving || unitTypes.length === 0}
        />
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Prefijo visible</span>
          <input
            value={bulkPrefix}
            onChange={(e) => setBulkPrefix(e.target.value)}
            style={inputStyle}
            disabled={saving || unitTypes.length === 0}
            placeholder="ej: Parcela"
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Desde número</span>
          <input
            type="number"
            min={1}
            value={bulkFromNumber}
            onChange={(e) => setBulkFromNumber(Number(e.target.value) || 0)}
            style={inputStyle}
            disabled={saving || unitTypes.length === 0}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Hasta número</span>
          <input
            type="number"
            min={1}
            value={bulkToNumber}
            onChange={(e) => setBulkToNumber(Number(e.target.value) || 0)}
            style={inputStyle}
            disabled={saving || unitTypes.length === 0}
            placeholder="ej: 55"
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Sector (opcional)</span>
          <input
            value={bulkSector}
            onChange={(e) => setBulkSector(e.target.value)}
            style={inputStyle}
            disabled={saving || unitTypes.length === 0}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Precio propio (opcional, ARS)</span>
          <input
            value={bulkPriceOverride}
            onChange={(e) => setBulkPriceOverride(e.target.value)}
            style={inputStyle}
            disabled={saving || unitTypes.length === 0}
            placeholder="Vacío = usa precio del tipo"
            inputMode="decimal"
          />
        </label>
        <div>
          <Button variant="secondary" onClick={onCreateUnitsBulk} disabled={saving || unitTypes.length === 0}>
            {saving ? "Guardando…" : "Crear en lote"}
          </Button>
        </div>
      </div>
    </div>
  );
}
