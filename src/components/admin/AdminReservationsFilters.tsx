"use client";

import type { CSSProperties } from "react";
import type { UserProfile } from "@/types/user";
import type { Camping } from "@/types/camping";
import type { ReservaEstado, CreatedByMode } from "@/types/reserva";
import SelectDropdown, { type SelectOption } from "@/components/SelectDropdown";
import DateRangePicker from "@/components/DateRangePicker";
import { Button, Card } from "@/components/ui";

export type AdminReservationsMomentoFilter = "" | "futuras" | "en_curso" | "pasadas";

export type AdminReservationsFilterValues = {
  campingId: string;
  dateFrom: string;
  dateTo: string;
  estado: ReservaEstado | "";
  origen: CreatedByMode | "";
  /** Vacío = todas; futuras / en curso / pasadas según ingreso y salida vs hoy. */
  momento: AdminReservationsMomentoFilter;
};

type Props = {
  profile: UserProfile;
  campings: Camping[];
  values: AdminReservationsFilterValues;
  onChange: (next: AdminReservationsFilterValues) => void;
  onResetFilters: () => void;
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
  { value: "admin", label: "Reserva manual" },
];

const MOMENTO_OPTIONS: SelectOption[] = [
  { value: "", label: "Todas" },
  { value: "futuras", label: "Futuras" },
  { value: "en_curso", label: "En curso" },
  { value: "pasadas", label: "Pasadas" },
];

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 4,
  color: "var(--color-text-muted)",
};

const controlStyle: CSSProperties = {
  width: "100%",
  minHeight: 40,
  padding: "8px 10px",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  background: "var(--color-surface)",
  color: "var(--color-text)",
  boxSizing: "border-box",
  fontSize: 14,
  lineHeight: "22px",
};

export default function AdminReservationsFilters({ profile, campings, values, onChange, onResetFilters }: Props) {
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

  const filtersPanel: CSSProperties = {
    marginTop: 4,
    padding: 12,
    borderRadius: 10,
    border: "1px solid var(--color-border)",
    background: "color-mix(in srgb, var(--color-border) 10%, var(--color-surface))",
  };

  const filtersGridDesktop: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2.5fr) minmax(0, 1fr) minmax(0, 1fr)",
    gap: 10,
    alignItems: "end",
  };

  const filtersSecondRow: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid color-mix(in srgb, var(--color-border) 55%, transparent)",
  };

  const cell: CSSProperties = { minWidth: 0, width: "100%" };

  return (
    <div style={{ width: "100%", minWidth: 0 }}>
      <style>{`
        @media (max-width: 720px) {
          .admin-resv-filters-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
      <Card title="Filtros">
        <div style={filtersPanel}>
        <div className="admin-resv-filters-grid" style={filtersGridDesktop}>
          <div style={cell}>
            {profile.role === "admin_camping" && fixedCamping ? (
              <div>
                <label style={labelStyle}>Camping</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`${fixedCamping.nombre} (${fixedCamping.areaProtegida})`}
                  style={{ ...controlStyle, opacity: 0.85, cursor: "not-allowed" }}
                />
              </div>
            ) : (
              <SelectDropdown
                label="Camping"
                value={values.campingId}
                options={campingOptions}
                onChange={(v) => onChange({ ...values, campingId: v })}
                placeholder="Todos"
                size="compact"
              />
            )}
          </div>

          <div style={cell}>
            <DateRangePicker
              label="Rango de fechas"
              checkInDate={values.dateFrom}
              checkOutDate={values.dateTo}
              onChange={({ checkInDate, checkOutDate }) =>
                onChange({ ...values, dateFrom: checkInDate, dateTo: checkOutDate })
              }
              size="compact"
            />
          </div>

          <div style={cell}>
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
              size="compact"
            />
          </div>

          <div style={cell}>
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
              size="compact"
            />
          </div>
        </div>

        <div style={filtersSecondRow}>
          <div style={{ ...cell, flex: "1 1 220px", maxWidth: 320 }}>
            <SelectDropdown
              label="Momento"
              value={values.momento}
              options={MOMENTO_OPTIONS}
              onChange={(v) =>
                onChange({
                  ...values,
                  momento: v === "" ? "" : (v as AdminReservationsMomentoFilter),
                })
              }
              size="compact"
            />
          </div>
          <Button type="button" variant="ghost" onClick={onResetFilters}>
            Limpiar filtros
          </Button>
        </div>
        </div>
      </Card>
    </div>
  );
}
