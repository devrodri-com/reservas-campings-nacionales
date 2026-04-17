"use client";

import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type { Camping } from "@/types/camping";
import { Button } from "@/components/ui";

type EditableFields = Pick<
  Camping,
  | "descripcionCorta"
  | "igUrl"
  | "webUrl"
  | "coverImageUrl"
  | "ubicacionTexto"
  | "direccion"
  | "mapsUrl"
  | "mapsEmbedUrl"
>;

export type AdminCampingDataSectionProps = {
  selectedCamping: Camping;
  form: EditableFields;
  setForm: Dispatch<SetStateAction<EditableFields>>;
  cancellationPolicyEnabled: boolean;
  setCancellationPolicyEnabled: Dispatch<SetStateAction<boolean>>;
  cancellationRefundDaysThreshold: number;
  setCancellationRefundDaysThreshold: Dispatch<SetStateAction<number>>;
  cancellationRefundPercentBeforeThreshold: number;
  setCancellationRefundPercentBeforeThreshold: Dispatch<SetStateAction<number>>;
  cancellationRefundPercentAfterThreshold: number;
  setCancellationRefundPercentAfterThreshold: Dispatch<SetStateAction<number>>;
  onSave: () => void;
  onRevert: () => void;
  saving: boolean;
  inputStyle: CSSProperties;
  textAreaStyle: CSSProperties;
};

export default function AdminCampingDataSection({
  selectedCamping,
  form,
  setForm,
  cancellationPolicyEnabled,
  setCancellationPolicyEnabled,
  cancellationRefundDaysThreshold,
  setCancellationRefundDaysThreshold,
  cancellationRefundPercentBeforeThreshold,
  setCancellationRefundPercentBeforeThreshold,
  cancellationRefundPercentAfterThreshold,
  setCancellationRefundPercentAfterThreshold,
  onSave,
  onRevert,
  saving,
  inputStyle,
  textAreaStyle,
}: AdminCampingDataSectionProps) {
  const field: CSSProperties = { display: "grid", gap: 6, minWidth: 0, width: "100%", maxWidth: "100%" };
  const fieldHint: CSSProperties = {
    fontSize: 12,
    color: "var(--color-text-muted)",
    lineHeight: 1.45,
  };

  const coverInput: CSSProperties = {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    padding: 10,
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    background: "var(--color-surface)",
    color: "var(--color-text)",
    boxSizing: "border-box",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  };

  return (
    <div
      style={{
        width: "100%",
        minWidth: 0,
        maxWidth: 680,
        boxSizing: "border-box",
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontWeight: 800,
            color: "var(--color-accent)",
            fontSize: 15,
            lineHeight: 1.35,
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {selectedCamping.nombre}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 13,
            color: "var(--color-text-muted)",
            lineHeight: 1.45,
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {selectedCamping.areaProtegida}
          {((form.ubicacionTexto ?? "").trim() || (selectedCamping.ubicacionTexto ?? "").trim())
            ? ` · ${(form.ubicacionTexto ?? "").trim() || (selectedCamping.ubicacionTexto ?? "").trim()}`
            : ""}
        </div>
      </div>

      <label style={field}>
        <span style={{ fontWeight: 700 }}>Descripción corta</span>
        <textarea
          value={form.descripcionCorta ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, descripcionCorta: e.target.value }))}
          rows={3}
          style={textAreaStyle}
        />
      </label>

      <label style={field}>
        <span style={{ fontWeight: 700 }}>Instagram (URL)</span>
        <textarea
          value={form.igUrl ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, igUrl: e.target.value }))}
          placeholder="https://instagram.com/..."
          rows={2}
          style={textAreaStyle}
          spellCheck={false}
        />
      </label>

      <label style={field}>
        <span style={{ fontWeight: 700 }}>Sitio oficial (URL)</span>
        <textarea
          value={form.webUrl ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, webUrl: e.target.value }))}
          placeholder="https://..."
          rows={2}
          style={textAreaStyle}
          spellCheck={false}
        />
      </label>

      <label style={field}>
        <span style={{ fontWeight: 700 }}>Imagen de portada (URL opcional)</span>
        <input
          value={form.coverImageUrl ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, coverImageUrl: e.target.value }))}
          placeholder="Dejar vacío para usar el placeholder"
          style={coverInput}
        />
      </label>

      <label style={field}>
        <span style={{ fontWeight: 700 }}>Ubicación breve</span>
        <input
          value={form.ubicacionTexto ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, ubicacionTexto: e.target.value }))}
          placeholder="Ej: El Calafate, Santa Cruz"
          style={inputStyle}
        />
        <span style={fieldHint}>Usar un texto corto. No pegar links de Google Maps acá.</span>
      </label>

      <label style={field}>
        <span style={{ fontWeight: 700 }}>Dirección</span>
        <input
          value={form.direccion ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))}
          placeholder="Dirección del camping"
          style={inputStyle}
        />
        <span style={fieldHint}>Dirección postal o de acceso visible.</span>
      </label>

      <label style={field}>
        <span style={{ fontWeight: 700 }}>Google Maps (URL)</span>
        <textarea
          value={form.mapsUrl ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, mapsUrl: e.target.value }))}
          placeholder="https://maps.google.com/..."
          rows={2}
          style={textAreaStyle}
          spellCheck={false}
        />
        <span style={fieldHint}>Link externo.</span>
      </label>

      <label style={field}>
        <span style={{ fontWeight: 700 }}>Google Maps (Embed URL)</span>
        <textarea
          value={form.mapsEmbedUrl ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, mapsEmbedUrl: e.target.value }))}
          placeholder="Pegá el iframe completo o el src https://www.google.com/maps/embed?pb=..."
          rows={2}
          style={textAreaStyle}
          spellCheck={false}
        />
        <span style={fieldHint}>Solo embed src / iframe.</span>
      </label>

      <div
        style={{
          marginTop: 8,
          paddingTop: 14,
          borderTop: "1px solid var(--color-border)",
          display: "grid",
          gap: 12,
          minWidth: 0,
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <div style={{ fontWeight: 800, color: "var(--color-text)" }}>Política de cancelación (V1)</div>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "var(--color-text-muted)",
            lineHeight: 1.45,
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          Si está desactivada, al cancelar una reserva pagada se considera devolución del 100 % del monto. Si está
          activa, el porcentaje depende de los días de anticipación respecto al <strong>check-in original</strong> de
          la reserva (no cambia si luego modifican fechas).
        </p>
        <label style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="checkbox"
            checked={cancellationPolicyEnabled}
            onChange={(e) => setCancellationPolicyEnabled(e.target.checked)}
          />
          <span style={{ fontWeight: 700 }}>Política habilitada</span>
        </label>
        <label style={field}>
          <span style={{ fontWeight: 700 }}>Umbral (días de anticipación)</span>
          <input
            type="number"
            min={0}
            value={cancellationRefundDaysThreshold}
            onChange={(e) => setCancellationRefundDaysThreshold(Number(e.target.value))}
            style={inputStyle}
            disabled={!cancellationPolicyEnabled}
          />
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            Con esta cantidad de días o más hasta el check-in original → % “antes”; con menos → % “después”.
          </span>
        </label>
        <label style={field}>
          <span style={{ fontWeight: 700 }}>Devolución antes del umbral (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={cancellationRefundPercentBeforeThreshold}
            onChange={(e) => setCancellationRefundPercentBeforeThreshold(Number(e.target.value))}
            style={inputStyle}
            disabled={!cancellationPolicyEnabled}
          />
        </label>
        <label style={field}>
          <span style={{ fontWeight: 700 }}>Devolución después del umbral (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={cancellationRefundPercentAfterThreshold}
            onChange={(e) => setCancellationRefundPercentAfterThreshold(Number(e.target.value))}
            style={inputStyle}
            disabled={!cancellationPolicyEnabled}
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button variant="primary" onClick={onSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
        <Button variant="secondary" onClick={onRevert} disabled={saving}>
          Revertir
        </Button>
      </div>

      <p
        style={{
          margin: 0,
          color: "var(--color-text-muted)",
          fontSize: 13,
          lineHeight: 1.45,
          overflowWrap: "anywhere",
          wordBreak: "break-word",
        }}
      >
        Si dejás “Imagen de portada” vacío, se usa <code>/campings/placeholder.jpg</code>.
      </p>
    </div>
  );
}
