"use client";

import { useMemo, useState } from "react";
import type { User } from "firebase/auth";
import type { UserRole } from "@/types/user";
import SelectDropdown, { type SelectOption } from "@/components/SelectDropdown";
import { Button, Card } from "@/components/ui";

type CreatableRole = "admin_camping" | "viewer" | "viewer_global";

type Props = {
  user: User;
  onCreated: () => Promise<void>;
};

const ROLE_OPTIONS: SelectOption[] = [
  { value: "admin_camping", label: "admin_camping" },
  { value: "viewer", label: "viewer" },
  { value: "viewer_global", label: "viewer_global" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 10,
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  background: "var(--color-surface)",
  color: "var(--color-text)",
  boxSizing: "border-box",
};

function requiresCamping(role: CreatableRole): boolean {
  return role === "admin_camping" || role === "viewer";
}

function parseApiError(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "No se pudo crear el usuario.";
  const maybeError = (payload as Record<string, unknown>).error;
  if (typeof maybeError !== "string" || !maybeError.trim()) return "No se pudo crear el usuario.";
  return maybeError;
}

export default function AdminUserCreateForm({ user, onCreated }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<CreatableRole>("viewer");
  const [campingId, setCampingId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showCampingId = useMemo(() => requiresCamping(role), [role]);

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password.trim()) return false;
    if (showCampingId && !campingId.trim()) return false;
    return true;
  }, [email, password, showCampingId, campingId]);

  const handleCreate = async () => {
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!canSubmit) {
      setErrorMsg("Completá los campos obligatorios.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const payload: {
        email: string;
        password: string;
        role: UserRole;
        campingId?: string;
      } = {
        email: email.trim(),
        password: password.trim(),
        role,
      };
      if (showCampingId) {
        payload.campingId = campingId.trim();
      }

      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        setErrorMsg(parseApiError(data));
        return;
      }

      setEmail("");
      setPassword("");
      setRole("viewer");
      setCampingId("");
      setSuccessMsg("Usuario creado correctamente.");
      await onCreated();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "No se pudo crear el usuario.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title="Crear usuario">
      <div style={{ display: "grid", gap: 12 }}>
        {successMsg ? (
          <div
            style={{
              border: "1px solid rgba(34,197,94,0.45)",
              background: "rgba(34,197,94,0.10)",
              color: "var(--color-text)",
              padding: 10,
              borderRadius: 10,
            }}
          >
            {successMsg}
          </div>
        ) : null}
        {errorMsg ? (
          <div
            style={{
              border: "1px solid rgba(239,68,68,0.45)",
              background: "rgba(239,68,68,0.10)",
              color: "var(--color-text)",
              padding: 10,
              borderRadius: 10,
            }}
          >
            {errorMsg}
          </div>
        ) : null}

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@dominio.com"
            style={inputStyle}
            disabled={submitting}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            style={inputStyle}
            disabled={submitting}
          />
        </label>

        <SelectDropdown
          label="Rol"
          value={role}
          options={ROLE_OPTIONS}
          onChange={(v) => {
            if (v === "admin_camping" || v === "viewer" || v === "viewer_global") {
              setRole(v);
              if (v === "viewer_global") setCampingId("");
            }
          }}
          disabled={submitting}
        />

        {showCampingId ? (
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700 }}>Camping ID</span>
            <input
              type="text"
              value={campingId}
              onChange={(e) => setCampingId(e.target.value)}
              placeholder="talampaya-campamento-agreste"
              style={inputStyle}
              disabled={submitting}
            />
          </label>
        ) : null}

        <div>
          <Button variant="primary" disabled={submitting || !canSubmit} onClick={() => void handleCreate()}>
            {submitting ? "Creando..." : "Crear usuario"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
