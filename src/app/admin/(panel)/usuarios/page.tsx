"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { fetchUserProfile } from "@/lib/userProfile";
import type { UserProfile } from "@/types/user";
import type { Camping } from "@/types/camping";
import { parseUserProfileFromFirestore } from "@/lib/userProfileDocument";
import { fetchCampings } from "@/lib/campingsRepo";
import { Card } from "@/components/ui";
import type { SelectOption } from "@/components/SelectDropdown";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
import AdminUserCreateForm from "@/components/admin/AdminUserCreateForm";

async function fetchAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, "users"));
  const users: UserProfile[] = [];
  snap.docs.forEach((d) => {
    const parsed = parseUserProfileFromFirestore(d.id, d.data() as Record<string, unknown>);
    if (parsed) users.push(parsed);
  });
  users.sort((a, b) => a.email.localeCompare(b.email, "es"));
  return users;
}

function parseToggleActivoError(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "No se pudo actualizar el usuario.";
  const maybe = (payload as Record<string, unknown>).error;
  return typeof maybe === "string" && maybe.trim() ? maybe : "No se pudo actualizar el usuario.";
}

export default function AdminUsuariosPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [campings, setCampings] = useState<Camping[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/admin/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) {
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setProfileLoading(true);
      const p = await fetchUserProfile(user.uid);
      if (!cancelled) {
        setProfile(p);
        setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const canAccess = useMemo(
    () => Boolean(profile?.activo && profile.role === "admin_global"),
    [profile]
  );

  const loadUsers = useCallback(async () => {
    if (!canAccess) {
      setUsers([]);
      setLoadingUsers(false);
      return;
    }
    setLoadingUsers(true);
    setError(null);
    try {
      const list = await fetchAllUsers();
      setUsers(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los usuarios.");
    } finally {
      setLoadingUsers(false);
    }
  }, [canAccess]);

  const handleToggleActivo = useCallback(
    async (uid: string, activo: boolean) => {
      if (!user) return;
      setError(null);
      setBusyUid(uid);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/admin/users/${encodeURIComponent(uid)}/activo`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ activo }),
        });
        const data: unknown = await res.json().catch(() => null);
        if (!res.ok) {
          setError(parseToggleActivoError(data));
          return;
        }
        await loadUsers();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo actualizar el usuario.");
      } finally {
        setBusyUid(null);
      }
    },
    [user, loadUsers]
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!canAccess) {
      setCampings([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchCampings();
        if (!cancelled) setCampings(list);
      } catch {
        if (!cancelled) setCampings([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canAccess]);

  const campingOptions: SelectOption[] = useMemo(
    () =>
      campings.map((c) => ({
        value: c.id,
        label: `${c.nombre} (${c.areaProtegida})`,
      })),
    [campings]
  );

  const campingLabelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of campings) {
      m.set(c.id, `${c.nombre} (${c.areaProtegida})`);
    }
    return m;
  }, [campings]);

  if (loading || profileLoading) {
    return (
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px" }}>
        Cargando…
      </main>
    );
  }

  if (!user) return null;

  if (!profile || !profile.activo) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        <Card title="No autorizado">
          <p style={{ marginTop: 0, color: "var(--color-text-muted)" }}>
            No tenés permisos para acceder a esta sección.
          </p>
        </Card>
      </main>
    );
  }

  if (!canAccess) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        <Card title="No autorizado">
          <p style={{ marginTop: 0, color: "var(--color-text-muted)" }}>
            Solo el rol <strong>admin_global</strong> puede acceder a esta pantalla.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px", display: "grid", gap: 16 }}>
      <h1 style={{ margin: 0, color: "var(--color-accent)" }}>Usuarios administrativos</h1>
      <p style={{ margin: 0, color: "var(--color-text-muted)" }}>Sesión: {user.email}</p>

      {error ? (
        <div
          style={{
            border: "1px solid rgba(239,68,68,0.5)",
            background: "rgba(239,68,68,0.08)",
            color: "var(--color-text)",
            padding: 12,
            borderRadius: 12,
          }}
        >
          {error}
        </div>
      ) : null}

      <Card title={`Listado (${users.length})`}>
        {loadingUsers ? (
          <p style={{ color: "var(--color-text-muted)" }}>Cargando usuarios…</p>
        ) : (
          <AdminUsersTable
            users={users}
            campingLabelById={campingLabelById}
            sessionUid={user.uid}
            busyUid={busyUid}
            onToggleActivo={(uid, nextActivo) => void handleToggleActivo(uid, nextActivo)}
          />
        )}
      </Card>

      <AdminUserCreateForm user={user} campingOptions={campingOptions} onCreated={loadUsers} />
    </main>
  );
}
