"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import type { Camping } from "@/types/camping";
import type { UserProfile } from "@/types/user";
import { fetchCampings } from "@/lib/campingsRepo";
import { fetchUserProfile } from "@/lib/userProfile";
import { Button, Card } from "@/components/ui";

type EditableFields = Pick<
  Camping,
  "descripcionCorta" | "igUrl" | "webUrl" | "coverImageUrl"
>;

function sanitizeUrl(url: string): string {
  const v = url.trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://${v}`;
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
  });

  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    if (!selectedCamping) return;
    setForm({
      descripcionCorta: selectedCamping.descripcionCorta ?? "",
      igUrl: selectedCamping.igUrl ?? "",
      webUrl: selectedCamping.webUrl ?? "",
      coverImageUrl: selectedCamping.coverImageUrl ?? "",
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

      {error ? <p style={{ color: "red" }}>{error}</p> : null}

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "start" }}>
        <Card title="Listado">
          {loadingData ? (
            <p>Cargando…</p>
          ) : campings.length === 0 ? (
            <p>No hay campings cargados.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700 }}>Camping</span>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                  }}
                >
                  {campings.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.areaProtegida})
                    </option>
                  ))}
                </select>
              </label>

              {selectedCamping ? (
                <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
                  <strong>{selectedCamping.capacidadParcelas}</strong> parcelas · ${selectedCamping.precioNocheArs}/noche
                </p>
              ) : null}

              <Button variant="ghost" onClick={() => router.push("/admin")}>
                Volver al panel
              </Button>
            </div>
          )}
        </Card>

        <Card title="Datos del camping">
          {!selectedCamping ? (
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
                <span style={{ fontWeight: 700 }}>Instagram (URL)</span>
                <input
                  value={form.igUrl ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, igUrl: e.target.value }))}
                  placeholder="https://instagram.com/..."
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
                <span style={{ fontWeight: 700 }}>Sitio oficial (URL)</span>
                <input
                  value={form.webUrl ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, webUrl: e.target.value }))}
                  placeholder="https://..."
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

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
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
    </main>
  );
}
