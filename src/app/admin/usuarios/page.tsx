"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { fetchUserProfile } from "@/lib/userProfile";
import type { UserProfile } from "@/types/user";
import { parseUserProfileFromFirestore } from "@/lib/userProfileDocument";
import { Button, Card } from "@/components/ui";
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

export default function AdminUsuariosPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

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
          <Button variant="secondary" onClick={() => router.push("/admin")}>
            Volver al admin
          </Button>
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
          <Button variant="secondary" onClick={() => router.push("/admin")}>
            Volver al admin
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px", display: "grid", gap: 16 }}>
      <h1 style={{ margin: 0, color: "var(--color-accent)" }}>Usuarios administrativos</h1>
      <p style={{ margin: 0, color: "var(--color-text-muted)" }}>Sesión: {user.email}</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button variant="ghost" onClick={() => router.push("/admin")}>
          Volver al admin
        </Button>
        <Button
          variant="ghost"
          onClick={async () => {
            await signOut(auth);
            router.replace("/admin/login");
          }}
        >
          Cerrar sesión
        </Button>
      </div>

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
          <AdminUsersTable users={users} />
        )}
      </Card>

      <AdminUserCreateForm user={user} onCreated={loadUsers} />
    </main>
  );
}
