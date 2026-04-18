"use client";

import { useMemo, useState } from "react";

/** Marcador para el plano; `mapImageSrc` lo define el padre para poder cambiar el asset sin tocar este componente. */
export type UnitMapMarkerModel = {
  unitId: string;
  shortLabel: string;
  mapX?: number;
  mapY?: number;
  available: boolean;
  selected: boolean;
};

type PlacedMarker = UnitMapMarkerModel & { leftPct: number; topPct: number };

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.min(98, Math.max(2, n));
}

function placeMarkers(markers: UnitMapMarkerModel[]): PlacedMarker[] {
  const withCoord: UnitMapMarkerModel[] = [];
  const withoutCoord: UnitMapMarkerModel[] = [];
  for (const m of markers) {
    if (typeof m.mapX === "number" && typeof m.mapY === "number") {
      withCoord.push(m);
    } else {
      withoutCoord.push(m);
    }
  }

  const placed: PlacedMarker[] = withCoord.map((m) => ({
    ...m,
    leftPct: clampPct(m.mapX as number),
    topPct: clampPct(m.mapY as number),
  }));

  const n = withoutCoord.length;
  if (n === 0) return placed;

  const cols = Math.min(10, Math.max(4, Math.ceil(Math.sqrt(n))));
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const leftPct = clampPct(((col + 0.5) / cols) * 100);
    const topPct = clampPct(62 + row * 7);
    placed.push({
      ...withoutCoord[i],
      leftPct,
      topPct,
    });
  }

  return placed;
}

type UnitMapSelectorProps = {
  /** Identificador del camping; útil para `alt` y trazas; el plano se pasa por `mapImageSrc`. */
  campingId: string;
  mapImageSrc: string;
  markers: UnitMapMarkerModel[];
  onSelectUnit: (unitId: string) => void;
  disabled?: boolean;
  /**
   * Si es `true`, el overlay del plano vuelve a ser clickeable (hotspots).
   * MVP: `false` — solo referencia visual; la selección va por grilla/lista.
   */
  interactive?: boolean;
};

/** `polygonPoints` en el modelo de unidad queda listo para un overlay SVG en una iteración futura. */

export default function UnitMapSelector(props: UnitMapSelectorProps) {
  return <UnitMapSelectorImpl key={props.mapImageSrc} {...props} />;
}

function UnitMapSelectorImpl({
  campingId,
  mapImageSrc,
  markers,
  onSelectUnit,
  disabled = false,
  interactive = false,
}: UnitMapSelectorProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const placed = useMemo(() => placeMarkers(markers), [markers]);

  return (
    <div className="unit-map-selector">
      <div
        className="unit-map-selector__stage"
        role="region"
        aria-label={
          interactive ? "Mapa de ubicación de unidades" : "Plano de referencia del camping"
        }
      >
        {!imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element -- plano estático intercambiable por URL; sin optimización remota
          <img
            className="unit-map-selector__img"
            src={mapImageSrc}
            alt={
              interactive
                ? `Plano del camping ${campingId}`
                : `Plano de referencia del camping ${campingId}`
            }
            onError={() => setImageFailed(true)}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="unit-map-selector__placeholder" role="img" aria-label="Plano no disponible">
            <p className="unit-map-selector__placeholder-title">Plano en preparación</p>
            <p className="unit-map-selector__placeholder-hint">
              Podés elegir tu unidad en la grilla o lista junto al plano.
            </p>
          </div>
        )}

        {interactive ? (
          <div className="unit-map-selector__overlay" aria-hidden={markers.length === 0}>
            {placed.map((m) => {
              const statusClass = m.selected
                ? " unit-map-marker--selected"
                : m.available
                  ? " unit-map-marker--available"
                  : " unit-map-marker--unavailable";
              return (
                <button
                  key={m.unitId}
                  type="button"
                  className={`unit-map-marker${statusClass}`}
                  style={{ left: `${m.leftPct}%`, top: `${m.topPct}%` }}
                  disabled={disabled || !m.available}
                  aria-pressed={m.selected}
                  aria-label={
                    m.available
                      ? `${m.shortLabel}${m.selected ? ", seleccionada" : ", disponible. Elegir"}`
                      : `${m.shortLabel}, no disponible para estas fechas`
                  }
                  onClick={() => {
                    if (m.available && !disabled) onSelectUnit(m.unitId);
                  }}
                >
                  <span className="unit-map-marker__dot" />
                  <span className="unit-map-marker__label">{m.shortLabel}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {interactive ? (
        <p className="unit-map-selector__legend">
          <span className="unit-map-legend__item">
            <span className="unit-map-legend__swatch unit-map-legend__swatch--available" /> Disponible
          </span>
          <span className="unit-map-legend__item">
            <span className="unit-map-legend__swatch unit-map-legend__swatch--unavailable" /> No disponible
          </span>
          <span className="unit-map-legend__item">
            <span className="unit-map-legend__swatch unit-map-legend__swatch--selected" /> Seleccionada
          </span>
        </p>
      ) : (
        <p className="unit-map-selector__ref-note">
          Referencia espacial del camping. La selección se hace en la grilla o lista de unidades.
        </p>
      )}
    </div>
  );
}
