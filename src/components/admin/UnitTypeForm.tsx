"use client";

import type { CSSProperties } from "react";
import SelectDropdown from "@/components/SelectDropdown";
import type { SelectOption } from "@/components/SelectDropdown";
import { Button } from "@/components/ui";
import type { UnitTypeBookingMode, UnitTypePricingModel } from "@/types/unitType";

type Props = {
  name: string;
  onNameChange: (value: string) => void;
  code?: string;
  onCodeChange?: (value: string) => void;
  codePlaceholder?: string;
  capacityMax: number;
  onCapacityMaxChange: (value: number) => void;
  pricingModel: UnitTypePricingModel;
  onPricingModelChange: (value: UnitTypePricingModel) => void;
  pricingModelOptions: SelectOption[];
  adultPriceArs: number;
  onAdultPriceArsChange: (value: number) => void;
  childPriceArs: number;
  onChildPriceArsChange: (value: number) => void;
  unitPriceArs: number;
  onUnitPriceArsChange: (value: number) => void;
  bookingMode: UnitTypeBookingMode;
  onBookingModeChange: (value: UnitTypeBookingMode) => void;
  bookingModeOptions: SelectOption[];
  saving: boolean;
  submitLabel: string;
  onSubmit: () => void;
  onCancel?: () => void;
  inputStyle: CSSProperties;
};

export default function UnitTypeForm(props: Props) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontWeight: 700 }}>Nombre</span>
        <input
          value={props.name}
          onChange={(e) => props.onNameChange(e.target.value)}
          style={props.inputStyle}
          disabled={props.saving}
        />
      </label>
      {props.onCodeChange ? (
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Código</span>
          <input
            value={props.code ?? ""}
            onChange={(e) => props.onCodeChange?.(e.target.value)}
            style={props.inputStyle}
            disabled={props.saving}
            placeholder={props.codePlaceholder}
          />
        </label>
      ) : props.code ? (
        <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
          Código (no editable): <code>{props.code}</code>
        </div>
      ) : null}
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontWeight: 700 }}>Capacidad máxima</span>
        <input
          type="number"
          min={1}
          value={props.capacityMax}
          onChange={(e) => props.onCapacityMaxChange(Number(e.target.value) || 0)}
          style={props.inputStyle}
          disabled={props.saving}
        />
      </label>
      <SelectDropdown
        label="Modelo de precio base"
        value={props.pricingModel}
        options={props.pricingModelOptions}
        onChange={(v) => {
          if (v === "per_person" || v === "per_unit") {
            props.onPricingModelChange(v);
          }
        }}
        disabled={props.saving}
      />
      {props.pricingModel === "per_person" ? (
        <>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontWeight: 700 }}>Tarifa adulto (ARS)</span>
        <input
          type="number"
          min={0}
          step={1}
          value={props.adultPriceArs}
          onChange={(e) => props.onAdultPriceArsChange(Number(e.target.value) || 0)}
          style={props.inputStyle}
          disabled={props.saving}
        />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontWeight: 700 }}>Tarifa menor (ARS)</span>
        <input
          type="number"
          min={0}
          step={1}
          value={props.childPriceArs}
          onChange={(e) => props.onChildPriceArsChange(Number(e.target.value) || 0)}
          style={props.inputStyle}
          disabled={props.saving}
        />
      </label>
        </>
      ) : (
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Precio por unidad (ARS)</span>
          <input
            type="number"
            min={0}
            step={1}
            value={props.unitPriceArs}
            onChange={(e) => props.onUnitPriceArsChange(Number(e.target.value) || 0)}
            style={props.inputStyle}
            disabled={props.saving}
          />
        </label>
      )}
      <SelectDropdown
        label="Modo de reserva"
        value={props.bookingMode}
        options={props.bookingModeOptions}
        onChange={(v) => {
          if (v === "overnight_only" || v === "day_use_only" || v === "both") {
            props.onBookingModeChange(v);
          }
        }}
        disabled={props.saving}
      />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button variant="primary" onClick={props.onSubmit} disabled={props.saving}>
          {props.saving ? "Guardando…" : props.submitLabel}
        </Button>
        {props.onCancel ? (
          <Button variant="secondary" onClick={props.onCancel} disabled={props.saving}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </div>
  );
}
