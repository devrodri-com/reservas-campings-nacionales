"use client";

import type { CSSProperties } from "react";
import type { UserProfile } from "@/types/user";
import type { Camping } from "@/types/camping";
import type { ReservaEstado, CreatedByMode } from "@/types/reserva";
import SelectDropdown, { type SelectOption } from "@/components/SelectDropdown";
import { Card } from "@/components/ui";

export type AdminReservationsFilterValues = {
  campingId: string;
  dateFrom: string;
  dateTo: string;
  estado: ReservaEstado | "";
  origen: CreatedByMode | "";
};

type Props = {
  profile: UserProfile;
  campings: Camping[];
  values: AdminReservationsFilterValues;
  onChange: (next: AdminReservationsFilterValues) => void;
};

const ESTADO_OPTIONS: SelectOption[] = [
  { value: "", label: "Todos" },
  { value: "pendiente_pago", label: "Pendiente pago" },
  { value: "pagada", label: "Pagada" },
  { value: "fallida", label: "Fallida" },
  { value: "cancelada", label: "Cancelada" },
];

const ORIGEN_OPTIONS: SelectOption[] = [
  { value: "", label: "Todos" },
  { value: "public", label: "Web" },
  { value: "admin", label: "Walk-in" },
];

const inputStyle: CSSProperties = {
  width: "100%",
  padding: 10,
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  background: "var(--color-surface)",
  color: "var(--color-text)",
  boxSizing: "border-box",
};

export default function AdminReservationsFilters({ profile, campings, values, onChange }: Props) {
  const campingOptions: SelectOption[] = [
    { value: "", label: "Todos los campings" },
    ...campings.map((c) => ({
      value: c.id,
      label: `${c.nombre} (${c.areaProtegida})`,
    })),
  ];

  const fixedCamping =
    profile.role === "admin_camping" && profile.campingId
      ? campings.find((c) => c.id === profile.campingId)
      : undefined;

  return (
    <Card title="Filtros">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12,
          alignItems: "end",
        }}
      >
        {profile.role === "admin_camping" && fixedCamping ? (
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                color: "var(--color-text-muted)",
              }}
            >
              Camping
            </label>
            <input
              type="text"
              readOnly
              disabled
              value={`${fixedCamping.nombre} (${fixedCamping.areaProtegida})`}
              style={{ ...inputStyle, opacity: 0.85, cursor: "not-allowed" }}
            />
          </div>
        ) : (
          <SelectDropdown
            label="Camping"
            value={values.campingId}
            options={campingOptions}
            onChange={(v) => onChange({ ...values, campingId: v })}
            placeholder="Todos"
          />
        )}

        <div>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 6,
              color: "var(--color-text-muted)",
            }}
          >
            Desde
          </label>
          <input
            type="date"
            value={values.dateFrom}
            onChange={(e) => onChange({ ...values, dateFrom: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 6,
              color: "var(--color-text-muted)",
            }}
          >
            Hasta
          </label>
          <input
            type="date"
            value={values.dateTo}
            onChange={(e) => onChange({ ...values, dateTo: e.target.value })}
            style={inputStyle}
          />
        </div>

        <SelectDropdown
          label="Estado"
          value={values.estado}
          options={ESTADO_OPTIONS}
          onChange={(v) =>
            onChange({
              ...values,
              estado: v === "" ? "" : (v as ReservaEstado),
            })
          }
        />

        <SelectDropdown
          label="Origen"
          value={values.origen}
          options={ORIGEN_OPTIONS}
          onChange={(v) =>
            onChange({
              ...values,
              origen: v === "" ? "" : (v as CreatedByMode),
            })
          }
        />
      </div>
    </Card>
  );
}
