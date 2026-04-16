"use client";

import type { Camping } from "@/types/camping";
import type { Unit } from "@/types/unit";
import type { UnitType } from "@/types/unitType";
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
  onSubmitWalkIn: () => void | Promise<void>;
};

export default function AdminWalkInCard(props: AdminWalkInCardProps) {
  const { camping } = props;

  return (
    <div style={{ marginTop: 16 }}>
      <Card title="Crear reserva manual (walk-in)">
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

          <div
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              padding: 12,
              background: "var(--color-bg)",
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ fontWeight: 800, color: "var(--color-accent)" }}>Resumen walk-in</div>
            <div>
              <strong>Camping:</strong> {camping.nombre}
            </div>
            <div>
              <strong>Fechas:</strong> {props.walkInCheckIn} → {props.walkInCheckOut}
            </div>
            <div>
              <strong>Noches:</strong> {props.walkInNochesCount}
            </div>
            {camping.inventoryMode === "unit_based" ? (
              <div>
                <strong>Unidad:</strong>{" "}
                {props.units.find((u) => u.id === props.walkInUnitId)?.displayName ?? "—"}
              </div>
            ) : (
              <div>
                <strong>Parcelas:</strong> {props.walkInParcelas}
              </div>
            )}
            <div>
              <strong>Personas:</strong> {props.walkInAdultos} adultos / {props.walkInMenores}{" "}
              menores
            </div>
            <div>
              <strong>Total estimado:</strong> ${props.walkInEstimatedMontoArs.toLocaleString("es-AR")}{" "}
              ARS
            </div>
          </div>

          <hr />

          <h2 style={{ margin: "12px 0 0 0", color: "var(--color-accent)" }}>Datos de contacto</h2>

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
            {props.busy ? "Creando..." : "Crear reserva walk-in"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
