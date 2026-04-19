"use client";

import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type { Camping } from "@/types/camping";
import { Button } from "@/components/ui";
import { adminDigitsOnlyNonNegative } from "@/lib/adminFormNumbers";

type EditableFields = Pick<
  Camping,
  | "descripcionCorta"
  | "serviciosTexto"
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
  cancellationRefundDaysThreshold: string;
  setCancellationRefundDaysThreshold: Dispatch<SetStateAction<string>>;
  cancellationRefundPercentBeforeThreshold: string;
  setCancellationRefundPercentBeforeThreshold: Dispatch<SetStateAction<string>>;
  cancellationRefundPercentAfterThreshold: string;
  setCancellationRefundPercentAfterThreshold: Dispatch<SetStateAction<string>>;
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

      <div className="admin-camping-data-group">
        <h3 className="admin-camping-data-group__title">Contenido público</h3>

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
          <span style={{ fontWeight: 700 }}>Instagram</span>
          <span className="admin-field-hint" style={{ display: "block" }}>
            Link a tu perfil o a una publicación (con https://).
          </span>
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
          <span style={{ fontWeight: 700 }}>Sitio oficial</span>
          <span className="admin-field-hint" style={{ display: "block" }}>
            Página web del camping (con https://).
          </span>
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
          <span style={{ fontWeight: 700 }}>Imagen de portada</span>
          <span className="admin-field-hint" style={{ display: "block" }}>
            Opcional. Link directo a la imagen; si queda vacío se usa el placeholder del sistema.
          </span>
          <input
            value={form.coverImageUrl ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, coverImageUrl: e.target.value }))}
            placeholder="Dejar vacío para usar el placeholder"
            style={coverInput}
          />
        </label>

        <label style={field}>
          <span style={{ fontWeight: 700 }}>Servicios del camping</span>
          <span className="admin-field-hint" style={{ display: "block" }}>
            Podés escribir un servicio por línea. Ej.: Baños, Parrillas, Acceso al río, Electricidad.
          </span>
          <textarea
            value={form.serviciosTexto ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, serviciosTexto: e.target.value }))}
            rows={5}
            style={textAreaStyle}
          />
        </label>
      </div>

      <div className="admin-camping-data-group admin-camping-data-group--ruled">
        <h3 className="admin-camping-data-group__title">Ubicación y mapas</h3>

        <label style={field}>
          <span style={{ fontWeight: 700 }}>Ubicación breve</span>
          <input
            value={form.ubicacionTexto ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, ubicacionTexto: e.target.value }))}
            placeholder="Ej: El Calafate, Santa Cruz"
            style={inputStyle}
          />
          <span style={fieldHint}>Texto corto para la ficha pública. No pegues acá el link de Google Maps.</span>
        </label>

        <label style={field}>
          <span style={{ fontWeight: 700 }}>Dirección</span>
          <input
            value={form.direccion ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))}
            placeholder="Dirección del camping"
            style={inputStyle}
          />
          <span style={fieldHint}>Dirección postal o de acceso, si querés mostrarla.</span>
        </label>

        <label style={field}>
          <span style={{ fontWeight: 700 }}>Link de Google Maps</span>
          <span className="admin-field-hint" style={{ display: "block" }}>
            Abrí el mapa en Google Maps y copiá el link que aparece en la barra del navegador.
          </span>
          <textarea
            value={form.mapsUrl ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, mapsUrl: e.target.value }))}
            placeholder="https://maps.google.com/..."
            rows={2}
            style={textAreaStyle}
            spellCheck={false}
          />
        </label>

        <label style={field}>
          <span style={{ fontWeight: 700 }}>Mapa embebido (iframe)</span>
          <span className="admin-field-hint" style={{ display: "block" }}>
            Pegá acá el <strong>src</strong> del iframe de Google Maps. También podés pegar el iframe completo: el
            sistema extrae el link interno.
          </span>
          <textarea
            value={form.mapsEmbedUrl ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, mapsEmbedUrl: e.target.value }))}
            placeholder="https://www.google.com/maps/embed?pb=… o el iframe completo"
            rows={2}
            style={textAreaStyle}
            spellCheck={false}
          />
        </label>
      </div>

      <div className="admin-camping-data-group admin-camping-data-group--policy">
        <h3 className="admin-camping-data-policy-title">Política de cancelación (V1)</h3>
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
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className="admin-input-num-compact"
            value={cancellationRefundDaysThreshold}
            onChange={(e) =>
              setCancellationRefundDaysThreshold(adminDigitsOnlyNonNegative(e.target.value))
            }
            style={inputStyle}
            disabled={!cancellationPolicyEnabled}
          />
          <span style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.45 }}>
            Si quedan esta cantidad de días o más hasta el check-in original, aplica el % “antes”; con menos días de
            anticipación, el % “después”.
          </span>
        </label>
        <label style={field}>
          <span style={{ fontWeight: 700 }}>Devolución antes del umbral (%)</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className="admin-input-num-compact"
            value={cancellationRefundPercentBeforeThreshold}
            onChange={(e) =>
              setCancellationRefundPercentBeforeThreshold(adminDigitsOnlyNonNegative(e.target.value))
            }
            style={inputStyle}
            disabled={!cancellationPolicyEnabled}
          />
        </label>
        <label style={field}>
          <span style={{ fontWeight: 700 }}>Devolución después del umbral (%)</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className="admin-input-num-compact"
            value={cancellationRefundPercentAfterThreshold}
            onChange={(e) =>
              setCancellationRefundPercentAfterThreshold(adminDigitsOnlyNonNegative(e.target.value))
            }
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
