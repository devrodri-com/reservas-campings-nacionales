"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import type { Camping } from "@/types/camping";
import type { UserProfile } from "@/types/user";
import { fetchCampings } from "@/lib/campingsRepo";
import { fetchUserProfile } from "@/lib/userProfile";
import { Button, Card } from "@/components/ui";
import SelectDropdown from "@/components/SelectDropdown";
import type { SelectOption } from "@/components/SelectDropdown";

type EditableFields = Pick<
  Camping,
  "descripcionCorta" | "igUrl" | "webUrl" | "coverImageUrl" | "direccion" | "mapsUrl" | "mapsEmbedUrl"
>;

function sanitizeUrl(url: string): string {
  const v = url.trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://${v}`;
}

function extractIframeSrc(input: string): string {
  const v = input.trim();
  if (!v) return "";
  // si ya es una URL normal
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  // si es iframe completo, extraer src=""
  const match = v.match(/src\s*=\s*"([^"]+)"/i);
  if (match && match[1]) return match[1];
  return v;
}

export default function AdminCampingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [campings, setCampings] = useState<Camping[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<EditableFields>({
    descripcionCorta: "",
    igUrl: "",
    webUrl: "",
    coverImageUrl: "",
    direccion: "",
    mapsUrl: "",
    mapsEmbedUrl: "",
  });

  const [saving, setSaving] = useState(false);
  const [showNewCamping, setShowNewCamping] = useState(false);
  const [newCampingId, setNewCampingId] = useState("");
  const [newNombre, setNewNombre] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newUbicacion, setNewUbicacion] = useState("");
  const [newCapacidad, setNewCapacidad] = useState<number>(20);
  const [newPrecio, setNewPrecio] = useState<number>(10000);

  useEffect(() => {
    if (!loading && !user) router.replace("/admin/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) {
      setProfileLoading(false);
      return;
    }
    const run = async () => {
      setProfileLoading(true);
      const p = await fetchUserProfile(user.uid);
      setProfile(p);
      setProfileLoading(false);
    };
    run();
  }, [user]);

  const isAdminGlobal = profile?.activo && profile.role === "admin_global";

  useEffect(() => {
    if (!user || !profile || !profile.activo) return;
    if (!isAdminGlobal) return;

    const run = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const list = await fetchCampings();
        setCampings(list);
        setSelectedId(list[0]?.id ?? "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoadingData(false);
      }
    };

    run();
  }, [user, profile, isAdminGlobal]);

  const selectedCamping = useMemo(
    () => campings.find((c) => c.id === selectedId) ?? null,
    [campings, selectedId]
  );

  const campingOptions: SelectOption[] = useMemo(
    () =>
      campings.map((c) => ({
        value: c.id,
        label: `${c.nombre} (${c.areaProtegida})`,
        description: c.ubicacionTexto,
      })),
    [campings]
  );

  useEffect(() => {
    if (!selectedCamping) return;
    setForm({
      descripcionCorta: selectedCamping.descripcionCorta ?? "",
      igUrl: selectedCamping.igUrl ?? "",
      webUrl: selectedCamping.webUrl ?? "",
      coverImageUrl: selectedCamping.coverImageUrl ?? "",
      direccion: selectedCamping.direccion ?? "",
      mapsUrl: selectedCamping.mapsUrl ?? "",
      mapsEmbedUrl: selectedCamping.mapsEmbedUrl ?? "",
    });
  }, [selectedCamping]);

  const onSave = async () => {
    if (!selectedCamping) return;

    setSaving(true);
    setError(null);

    try {
      const payload: EditableFields = {
        descripcionCorta: form.descripcionCorta?.trim() || "",
        igUrl: sanitizeUrl(form.igUrl || ""),
        webUrl: sanitizeUrl(form.webUrl || ""),
        coverImageUrl: sanitizeUrl(form.coverImageUrl || ""),
        direccion: form.direccion?.trim() || "",
        mapsUrl: sanitizeUrl(form.mapsUrl || ""),
        mapsEmbedUrl: sanitizeUrl(extractIframeSrc(form.mapsEmbedUrl || "")),
      };

      await updateDoc(doc(db, "campings", selectedCamping.id), payload);

      setCampings((prev) =>
        prev.map((c) => (c.id === selectedCamping.id ? { ...c, ...payload } : c))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const createCamping = async () => {
    const id = newCampingId.trim().toLowerCase();

    if (!id || !/^[a-z0-9-]+$/.test(id)) {
      setError("El ID debe contener solo letras minúsculas, números y guiones (sin espacios).");
      return;
    }
    if (!newNombre.trim() || !newArea.trim() || !newUbicacion.trim()) {
      setError("Nombre, Área protegida y Ubicación son obligatorios.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await setDoc(doc(db, "campings", id), {
        areaProtegida: newArea.trim(),
        nombre: newNombre.trim(),
        ubicacionTexto: newUbicacion.trim(),
        titular: "-",
        capacidadParcelas: Number(newCapacidad),
        precioNocheArs: Number(newPrecio),
        maxPersonasPorParcela: 6,
        checkInHour: 15,
        checkOutHour: 11,
        activo: true,
        descripcionCorta: "",
        igUrl: "",
        webUrl: "",
        coverImageUrl: "",
        direccion: "",
        mapsUrl: "",
        mapsEmbedUrl: "",
      });

      const list = await fetchCampings();
      setCampings(list);
      setSelectedId(id);

      setNewCampingId("");
      setNewNombre("");
      setNewArea("");
      setNewUbicacion("");
      setNewCapacidad(20);
      setNewPrecio(10000);
      setShowNewCamping(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: 10,
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    background: "var(--color-surface)",
    color: "var(--color-text)",
    boxSizing: "border-box",
    minWidth: 0,
  };

  const textAreaStyle: CSSProperties = {
    ...inputStyle,
    resize: "vertical",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: 12,
    lineHeight: 1.4,
    maxWidth: "100%",
    display: "block",
  };

  if (loading || profileLoading) {
    return <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>Cargando…</main>;
  }

  if (!user) return null;

  if (!profile || !profile.activo) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        <Card title="No autorizado">
          <p style={{ marginTop: 0, color: "var(--color-text-muted)" }}>
            No tenés permisos para acceder a esta sección.
          </p>
          <Button variant="secondary" onClick={() => router.push("/admin")}>
            Volver al admin
          </Button>
        </Card>
      </main>
    );
  }

  if (!isAdminGlobal) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        <Card title="Acceso restringido">
          <p style={{ marginTop: 0, color: "var(--color-text-muted)" }}>
            Solo el rol <strong>admin_global</strong> puede editar campings.
          </p>
          <Button variant="secondary" onClick={() => router.push("/admin")}>
            Volver al admin
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ margin: "0 0 12px 0", color: "var(--color-accent)" }}>
        Editar campings
      </h1>
      <p style={{ marginTop: 0, color: "var(--color-text-muted)" }}>
        Cargá descripción corta, links y portada. Los cambios impactan en la Home y en el detalle del camping.
      </p>

      {error ? (
        <div
          style={{
            border: "1px solid rgba(239,68,68,0.5)",
            background: "rgba(239,68,68,0.08)",
            color: "var(--color-text)",
            padding: 12,
            borderRadius: 12,
            marginBottom: 16,
          }}
        >
          <strong style={{ display: "block", marginBottom: 6 }}>Revisá estos datos</strong>
          <span style={{ color: "var(--color-text-muted)" }}>{error}</span>
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gap: 16,
          alignItems: "start",
          gridTemplateColumns: "1fr",
        }}
        className="admin-campings-grid"
      >
        <Card title="Listado">
          {loadingData ? (
            <p>Cargando…</p>
          ) : showNewCamping ? (
            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700 }}>ID (slug)</span>
                <input
                  value={newCampingId}
                  onChange={(e) => setNewCampingId(e.target.value)}
                  placeholder="ej: mi-camping"
                  style={inputStyle}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700 }}>Nombre</span>
                <input
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  style={inputStyle}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700 }}>Área protegida</span>
                <input
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  style={inputStyle}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700 }}>Ubicación</span>
                <input
                  value={newUbicacion}
                  onChange={(e) => setNewUbicacion(e.target.value)}
                  style={inputStyle}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700 }}>Capacidad (parcelas)</span>
                <input
                  type="number"
                  min={1}
                  value={newCapacidad}
                  onChange={(e) => setNewCapacidad(Number(e.target.value) || 0)}
                  style={inputStyle}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700 }}>Precio/noche (ARS)</span>
                <input
                  type="number"
                  min={0}
                  value={newPrecio}
                  onChange={(e) => setNewPrecio(Number(e.target.value) || 0)}
                  style={inputStyle}
                />
              </label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button variant="primary" onClick={createCamping} disabled={saving}>
                  {saving ? "Creando…" : "Crear"}
                </Button>
                <Button variant="secondary" onClick={() => setShowNewCamping(false)} disabled={saving}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <Button variant="secondary" onClick={() => setShowNewCamping(true)}>
                Crear nuevo camping
              </Button>
              {campings.length === 0 ? (
                <p style={{ margin: 0, color: "var(--color-text-muted)" }}>No hay campings cargados.</p>
              ) : (
                <>
                  <SelectDropdown
                    label="Camping"
                    value={selectedId}
                    options={campingOptions}
                    onChange={setSelectedId}
                    placeholder="Seleccionar camping…"
                    disabled={loadingData || campings.length === 0 || saving}
                    searchable
                  />
                  {selectedCamping ? (
                    <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
                      <strong>{selectedCamping.capacidadParcelas}</strong> parcelas · $
                      {selectedCamping.precioNocheArs}/noche
                    </p>
                  ) : null}
                </>
              )}
              <Button variant="ghost" onClick={() => router.push("/admin")}>
                Volver al panel
              </Button>
            </div>
          )}
        </Card>

        <div style={{ minWidth: 0, overflow: "hidden" }}>
          <Card title="Datos del camping">
          {showNewCamping ? (
            <p style={{ color: "var(--color-text-muted)" }}>Completá el formulario a la izquierda y hacé clic en Crear.</p>
          ) : !selectedCamping ? (
            <p>Seleccioná un camping.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800, color: "var(--color-accent)", fontSize: 16 }}>
                  {selectedCamping.nombre}
                </div>
                <div style={{ color: "var(--color-text-muted)" }}>
                  {selectedCamping.areaProtegida} · {selectedCamping.ubicacionTexto}
                </div>
              </div>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700 }}>Descripción corta</span>
                <textarea
                  value={form.descripcionCorta ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, descripcionCorta: e.target.value }))}
                  rows={3}
                  style={textAreaStyle}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
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

              <label style={{ display: "grid", gap: 6 }}>
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

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700 }}>Imagen de portada (URL opcional)</span>
                <input
                  value={form.coverImageUrl ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, coverImageUrl: e.target.value }))}
                  placeholder="Dejar vacío para usar el placeholder"
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700 }}>Dirección</span>
                <input
                  value={form.direccion ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))}
                  placeholder="Dirección del camping"
                  style={inputStyle}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700 }}>Google Maps (URL)</span>
                <textarea
                  value={form.mapsUrl ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, mapsUrl: e.target.value }))}
                  placeholder="https://maps.google.com/..."
                  rows={2}
                  style={textAreaStyle}
                  spellCheck={false}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700 }}>Google Maps (Embed URL)</span>
                <textarea
                  value={form.mapsEmbedUrl ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, mapsEmbedUrl: e.target.value }))}
                  placeholder="Pegá el iframe completo o el src https://www.google.com/maps/embed?pb=..."
                  rows={2}
                  style={textAreaStyle}
                  spellCheck={false}
                />
              </label>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button variant="primary" onClick={onSave} disabled={saving}>
                  {saving ? "Guardando..." : "Guardar cambios"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setForm({
                      descripcionCorta: selectedCamping.descripcionCorta ?? "",
                      igUrl: selectedCamping.igUrl ?? "",
                      webUrl: selectedCamping.webUrl ?? "",
                      coverImageUrl: selectedCamping.coverImageUrl ?? "",
                      direccion: selectedCamping.direccion ?? "",
                      mapsUrl: selectedCamping.mapsUrl ?? "",
                      mapsEmbedUrl: selectedCamping.mapsEmbedUrl ?? "",
                    })
                  }
                  disabled={saving}
                >
                  Revertir
                </Button>
              </div>

              <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
                Si dejás “Imagen de portada” vacío, se usa <code>/campings/placeholder.jpg</code>.
              </p>
            </div>
          )}
          </Card>
        </div>
      </div>
    </main>
  );
}
