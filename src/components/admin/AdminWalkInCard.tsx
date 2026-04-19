"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Camping } from "@/types/camping";
import type { UnitAvailabilityResult } from "@/lib/adminUnitReassignSupport";
import type { Unit } from "@/types/unit";
import type { UnitType } from "@/types/unitType";
import { formatYmdToDmy } from "@/lib/dates";
import { Button, Card } from "@/components/ui";
import AdminUnitSelector from "@/components/admin/AdminUnitSelector";
import PhoneFieldSimple from "@/components/PhoneFieldSimple";
import SelectDropdown from "@/components/SelectDropdown";
import type { SelectOption } from "@/components/SelectDropdown";
import DateRangePicker from "@/components/DateRangePicker";

export type AdminWalkInCardProps = {
  camping: Camping;
  busy: boolean;
  canCreateOrCancel: boolean;
  walkInCheckIn: string;
  walkInCheckOut: string;
  onWalkInDatesChange: (checkInDate: string, checkOutDate: string) => void;
  walkInParcelas: number;
  onWalkInParcelasChange: (n: number) => void;
  walkInUnitId: string;
  onWalkInUnitIdChange: (id: string) => void;
  walkInAdultos: number;
  walkInMenores: number;
  onWalkInAdultosChange: (n: number) => void;
  onWalkInMenoresChange: (n: number) => void;
  walkInNombre: string;
  onWalkInNombreChange: (v: string) => void;
  walkInEmail: string;
  onWalkInEmailChange: (v: string) => void;
  walkInTelefonoPais: string;
  onWalkInTelefonoPaisChange: (v: string) => void;
  walkInTelefonoNumero: string;
  onWalkInTelefonoNumeroChange: (v: string) => void;
  walkInTelefonoDialManual: string;
  onWalkInTelefonoDialManualChange: (v: string) => void;
  walkInEdad: number;
  onWalkInEdadChange: (n: number) => void;
  unitTypes: UnitType[];
  parcelasOptions: SelectOption[];
  adultosOptions: SelectOption[];
  menoresOptions: SelectOption[];
  walkInUnitAdultosOptions: SelectOption[];
  walkInUnitMenoresOptions: SelectOption[];
  edadOptions: SelectOption[];
  walkInNochesCount: number;
  walkInEstimatedMontoArs: number;
  units: Unit[];
  /** Por unidad, coherente con el rango elegido (vacío si no aplica). */
  walkInUnitAvailabilityById: Record<string, UnitAvailabilityResult>;
  onSubmitWalkIn: () => void | Promise<void>;
};

const summaryLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--color-text-muted)",
};

const summaryValue: CSSProperties = {
  fontSize: 14,
  color: "var(--color-text)",
  fontWeight: 600,
  lineHeight: 1.4,
};

function SummaryRow(props: {
  label: string;
  children: ReactNode;
  valueStyle?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: 4,
        padding: "10px 0",
        borderBottom: "1px solid color-mix(in srgb, var(--color-border) 70%, transparent)",
      }}
    >
      <div style={summaryLabel}>{props.label}</div>
      <div style={{ ...summaryValue, ...props.valueStyle }}>{props.children}</div>
    </div>
  );
}

export default function AdminWalkInCard(props: AdminWalkInCardProps) {
  const { camping } = props;
  const selectedUnitName =
    camping.inventoryMode === "unit_based"
      ? props.units.find((u) => u.id === props.walkInUnitId)?.displayName ?? null
      : null;

  return (
    <div style={{ marginTop: 16 }}>
      <Card>
        <header style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid var(--color-border)" }}>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--color-accent)",
            }}
          >
            Crear reserva manual
          </h2>
          <p
            style={{
              margin: "8px 0 0 0",
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--color-text-muted)",
              maxWidth: 520,
            }}
          >
            Usá este bloque para cargar reservas tomadas por mostrador, teléfono o atención directa.
          </p>
        </header>

        <div style={{ display: "grid", gap: 12 }}>
          <div className="reservar-grid-top">
            <div style={{ minWidth: 0 }}>
              <DateRangePicker
                label="Fechas"
                checkInDate={props.walkInCheckIn}
                checkOutDate={props.walkInCheckOut}
                onChange={({ checkInDate, checkOutDate }) => {
                  props.onWalkInDatesChange(checkInDate, checkOutDate);
                }}
                disabled={props.busy}
                disablePast
              />
            </div>

            {camping.inventoryMode === "unit_based" ? (
              <>
                <div style={{ gridColumn: "1 / -1" }}>
                  <AdminUnitSelector
                    units={props.units}
                    unitTypes={props.unitTypes}
                    selectedUnitId={props.walkInUnitId}
                    onSelectUnit={props.onWalkInUnitIdChange}
                    disabled={props.busy}
                    availabilityByUnitId={props.walkInUnitAvailabilityById}
                  />
                </div>
                <SelectDropdown
                  label="Adultos"
                  value={String(props.walkInAdultos)}
                  options={props.walkInUnitAdultosOptions}
                  onChange={(v) => props.onWalkInAdultosChange(Number(v))}
                  disabled={props.busy || props.walkInUnitAdultosOptions.length === 0}
                />
                <SelectDropdown
                  label="Menores"
                  value={String(props.walkInMenores)}
                  options={props.walkInUnitMenoresOptions}
                  onChange={(v) => props.onWalkInMenoresChange(Number(v))}
                  disabled={props.busy || props.walkInUnitMenoresOptions.length === 0}
                />
              </>
            ) : (
              <>
                <SelectDropdown
                  label="Parcelas"
                  value={String(props.walkInParcelas)}
                  options={props.parcelasOptions}
                  onChange={(v) => props.onWalkInParcelasChange(Number(v))}
                  disabled={props.busy}
                />
                <SelectDropdown
                  label="Adultos"
                  value={String(props.walkInAdultos)}
                  options={props.adultosOptions}
                  onChange={(v) => props.onWalkInAdultosChange(Number(v))}
                  disabled={props.busy}
                />
                <SelectDropdown
                  label="Menores"
                  value={String(props.walkInMenores)}
                  options={props.menoresOptions}
                  onChange={(v) => props.onWalkInMenoresChange(Number(v))}
                  disabled={props.busy}
                />
              </>
            )}
          </div>

          <section
            aria-label="Resumen de la reserva manual"
            style={{
              border: "1px solid color-mix(in srgb, var(--color-accent) 28%, var(--color-border))",
              borderRadius: 12,
              padding: "14px 16px",
              background:
                "color-mix(in srgb, var(--color-accent) 5%, var(--color-surface))",
              display: "grid",
              gap: 0,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "var(--color-accent)",
                marginBottom: 4,
              }}
            >
              Resumen
            </div>
            <SummaryRow label="Camping">{camping.nombre}</SummaryRow>
            <SummaryRow label="Estadía">
              <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                {formatYmdToDmy(props.walkInCheckIn)}
                <span style={{ color: "var(--color-text-muted)", fontWeight: 600, margin: "0 6px" }}>
                  →
                </span>
                {formatYmdToDmy(props.walkInCheckOut)}
              </span>
            </SummaryRow>
            <SummaryRow label="Noches">
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{props.walkInNochesCount}</span>
            </SummaryRow>
            {camping.inventoryMode === "unit_based" ? (
              <SummaryRow
                label="Unidad seleccionada"
                valueStyle={{
                  fontWeight: 800,
                  fontSize: 15,
                  color: selectedUnitName ? "var(--color-text)" : "var(--color-text-muted)",
                }}
              >
                {selectedUnitName ?? "Elegí una unidad arriba"}
              </SummaryRow>
            ) : (
              <SummaryRow label="Parcelas">{props.walkInParcelas}</SummaryRow>
            )}
            <SummaryRow label="Personas">
              {props.walkInAdultos} adultos · {props.walkInMenores} menores
            </SummaryRow>
            <div style={{ paddingTop: 12, borderTop: "1px solid var(--color-border)", marginTop: 4 }}>
              <div style={summaryLabel}>Total estimado</div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 22,
                  fontWeight: 800,
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--color-accent)",
                  letterSpacing: "-0.02em",
                }}
              >
                ${props.walkInEstimatedMontoArs.toLocaleString("es-AR")}{" "}
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-muted)" }}>
                  ARS
                </span>
              </div>
            </div>
          </section>

          <h2
            style={{
              margin: "4px 0 0 0",
              fontSize: 15,
              fontWeight: 800,
              color: "var(--color-accent)",
            }}
          >
            Datos de contacto
          </h2>

          <div className="reservar-grid-60-40">
            <label>
              Nombre y apellido
              <input
                value={props.walkInNombre}
                onChange={(e) => props.onWalkInNombreChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: 10,
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  background: "var(--color-surface)",
                  color: "var(--color-text)",
                  boxSizing: "border-box",
                }}
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={props.walkInEmail}
                onChange={(e) => props.onWalkInEmailChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: 10,
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  background: "var(--color-surface)",
                  color: "var(--color-text)",
                  boxSizing: "border-box",
                }}
              />
            </label>
          </div>

          <PhoneFieldSimple
            label="Teléfono"
            countryCode={props.walkInTelefonoPais}
            onCountryCodeChange={props.onWalkInTelefonoPaisChange}
            number={props.walkInTelefonoNumero}
            onNumberChange={props.onWalkInTelefonoNumeroChange}
            manualDialCode={props.walkInTelefonoDialManual}
            onManualDialCodeChange={props.onWalkInTelefonoDialManualChange}
            placeholder="11 1234 5678"
            required
            layout="compact"
            disabled={props.busy}
          />

          <div style={{ maxWidth: 220 }}>
            <SelectDropdown
              label="Edad del titular"
              value={String(props.walkInEdad)}
              options={props.edadOptions}
              onChange={(v) => props.onWalkInEdadChange(Number(v))}
              disabled={props.busy}
            />
          </div>

          <Button
            variant="primary"
            onClick={() => void props.onSubmitWalkIn()}
            disabled={props.busy || !props.canCreateOrCancel}
          >
            {props.busy ? "Creando..." : "Crear reserva manual"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
