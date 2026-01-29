"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/components/ui";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 10,
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  background: "var(--color-surface)",
  color: "var(--color-text)",
  boxSizing: "border-box",
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="admin-login-page">
      {/* Desktop: barra superior institucional mínima */}
      <header className="admin-login-header admin-login-header-desktop">
        <Image
          src="/parques-nacionales-logo.png"
          alt="Administración de Parques Nacionales"
          width={36}
          height={36}
          className="admin-login-logo-desktop"
          style={{ height: "auto", objectFit: "contain" }}
          priority
        />
        <span className="admin-login-org-name">Administración de Parques Nacionales</span>
      </header>

      {/* Mobile: logo chico centrado, mínimo margen */}
      <div className="admin-login-header admin-login-header-mobile">
        <Image
          src="/parques-nacionales-logo.png"
          alt="Administración de Parques Nacionales"
          width={28}
          height={28}
          className="admin-login-logo-mobile"
          style={{ height: "auto", objectFit: "contain" }}
          priority
        />
      </div>

      <div className="admin-login-content">
        <h1 className="admin-login-title">Acceso exclusivo para operadores</h1>
        <p className="admin-login-subtitle">
          Sistema de Reservas - Administración de Parques Nacionales.
        </p>
      </div>

      <Card>
        <form onSubmit={onSubmit} className="admin-login-form">
          <label>
            Email
            <input
              className="admin-login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
              style={inputStyle}
            />
          </label>

          <label>
            Contraseña
            <input
              className="admin-login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
              style={inputStyle}
            />
          </label>

          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? "Ingresando..." : "Ingresar"}
          </Button>

          {error ? (
            <div
              role="alert"
              style={{
                border: "1px solid rgba(239,68,68,0.5)",
                background: "rgba(239,68,68,0.08)",
                color: "var(--color-text)",
                padding: 12,
                borderRadius: 12,
              }}
            >
              <strong style={{ display: "block", marginBottom: 6 }}>No se pudo iniciar sesión</strong>
              <span style={{ color: "var(--color-text-muted)" }}>{error}</span>
            </div>
          ) : null}

          <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", opacity: 0.85 }}>
              Visitantes
            </div>
            <Link href="/consultar" style={{ color: "var(--color-text-muted)", textDecoration: "underline" }}>
              Consultar reserva con código
            </Link>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/" style={{ textDecoration: "none" }}>
                <Button variant="ghost" type="button">Volver al inicio</Button>
              </Link>
            </div>
          </div>

          <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
            La actividad es registrada con fines de auditoría.
          </p>
        </form>
      </Card>
    </main>
  );
}
