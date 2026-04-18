"use client";

import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type { Unit } from "@/types/unit";
import type { UnitType } from "@/types/unitType";
import AdminCampingUnitsList from "@/components/admin/AdminCampingUnitsList";
import { Button } from "@/components/ui";
import SelectDropdown from "@/components/SelectDropdown";
import type { SelectOption } from "@/components/SelectDropdown";
import { adminDigitsOnlyNonNegative } from "@/lib/adminFormNumbers";

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
  bulkFrom: string;
  setBulkFrom: Dispatch<SetStateAction<string>>;
  bulkTo: string;
  setBulkTo: Dispatch<SetStateAction<string>>;
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
  bulkFrom,
  setBulkFrom,
  bulkTo,
  setBulkTo,
  bulkSector,
  setBulkSector,
  bulkPriceOverride,
  setBulkPriceOverride,
  onCreateUnitsBulk,
}: AdminCampingUnitsSectionProps) {
  return (
    <div style={panelStyle} className="admin-units-section">
      <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.45 }}>
        Tres bloques: revisá el inventario, creá una unidad puntual o generá varias de una vez. Los datos y reglas de
        guardado no cambian.
      </p>

      <div className="admin-units-list-block">
        <h3 className="admin-units-block-heading">1 · Unidades actuales</h3>
        <p className="admin-units-block-lead">
          Por tipo, ordenado por código interno. Tocá cada tipo para desplegar u ocultar; los grupos grandes inician
          cerrados para reducir scroll. Al editar, el grupo se abre solo.
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
      </div>

      <div className="admin-units-create-row">
        <div style={flowSubPanelSolo} className="admin-units-create-col">
          <span className="admin-units-subpanel-kicker">Alta puntual</span>
          <span className="admin-units-subpanel-title">2 · Crear una unidad</span>
          <p className="admin-units-subpanel-lead">
            Para una sola parcela, cabaña u otro espacio. Completá nombre visible y código interno distintos: el
            primero es lo que ve el huésped; el segundo es tu referencia interna única.
          </p>
          <aside className="admin-units-help-callout" aria-label="Ejemplo ilustrativo, no editable">
            <div className="admin-units-help-callout__title">Ejemplo</div>
            <dl className="admin-units-help-callout__dl">
              <dt>Nombre visible</dt>
              <dd>Parcela 12</dd>
              <dt>Código interno</dt>
              <dd>P-12</dd>
            </dl>
          </aside>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700 }}>Nombre visible</span>
            <p className="admin-field-hint">
              Nombre legible para el huésped. Ejemplos: Parcela 1, Sendero, Camarote A.
            </p>
            <input
              value={unitDisplayName}
              onChange={(e) => setUnitDisplayName(e.target.value)}
              style={inputStyle}
              disabled={saving || unitTypes.length === 0}
              placeholder="ej: Parcela 12"
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700 }}>Código interno</span>
            <p className="admin-field-hint">
              Identificador operativo único en tu sistema; no sustituye al nombre visible.
            </p>
            <input
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              style={inputStyle}
              disabled={saving || unitTypes.length === 0}
              placeholder="ej: P-12"
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
            <span style={{ fontWeight: 700 }}>Precio especial (opcional)</span>
            <p className="admin-field-hint">
              Solo usalo si esta unidad tiene un precio distinto al del tipo de unidad. Si lo dejás vacío, se usa el
              precio del tipo.
            </p>
            <input
              value={unitPriceOverride}
              onChange={(e) => setUnitPriceOverride(e.target.value)}
              style={inputStyle}
              disabled={saving || unitTypes.length === 0}
              placeholder="Vacío = precio del tipo"
              inputMode="decimal"
            />
          </label>
          <div>
            <Button variant="secondary" onClick={onCreateUnit} disabled={saving || unitTypes.length === 0}>
              {saving ? "Guardando…" : "Crear unidad"}
            </Button>
          </div>
        </div>

        <div style={flowSubPanelBulk} className="admin-units-create-col">
          <span className="admin-units-subpanel-kicker">Varias a la vez</span>
          <span className="admin-units-subpanel-title">3 · Crear unidades en lote</span>
          <p className="admin-units-subpanel-lead">
            Usá este bloque para cargar muchas unidades parecidas de una sola vez, por ejemplo parcelas.
          </p>
          <p className="admin-field-hint" style={{ margin: 0 }}>
            El sistema crea una unidad por cada número del rango.
          </p>
          <p className="admin-field-hint" style={{ margin: "8px 0 0 0" }}>
            Ejemplo: si escribís prefijo &quot;Parcela&quot;, desde 1 hasta 55, se crean &quot;Parcela 1&quot; a
            &quot;Parcela 55&quot;.
          </p>
          <p className="admin-field-hint" style={{ margin: "8px 0 0 0" }}>
            Recomendado para unidades numeradas.
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
            <p className="admin-field-hint">Parte fija del nombre visible antes del número.</p>
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
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className="admin-input-num-compact"
              value={bulkFrom}
              onChange={(e) => setBulkFrom(adminDigitsOnlyNonNegative(e.target.value))}
              style={inputStyle}
              disabled={saving || unitTypes.length === 0}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700 }}>Hasta número</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className="admin-input-num-compact"
              value={bulkTo}
              onChange={(e) => setBulkTo(adminDigitsOnlyNonNegative(e.target.value))}
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
            <span style={{ fontWeight: 700 }}>Precio especial (opcional)</span>
            <p className="admin-field-hint">
              Solo usalo si todas las unidades del lote comparten el mismo precio distinto al del tipo. Si lo dejás
              vacío, se usa el precio del tipo.
            </p>
            <input
              value={bulkPriceOverride}
              onChange={(e) => setBulkPriceOverride(e.target.value)}
              style={inputStyle}
              disabled={saving || unitTypes.length === 0}
              placeholder="Vacío = precio del tipo"
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
    </div>
  );
}
