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
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "grid", gap: 10, justifyItems: "start", marginBottom: 12 }}>
        <Image
          src="/parques-nacionales-logo.png"
          alt="Administración de Parques Nacionales"
          width={72}
          height={72}
          style={{ height: "auto", objectFit: "contain" }}
          priority
        />
        <div>
          <h1 style={{ margin: 0, color: "var(--color-accent)" }}>Acceso de operadores</h1>
          <p style={{ margin: "6px 0 0 0", color: "var(--color-text-muted)" }}>
            Solo personal autorizado. Si sos visitante, consultá tu reserva con el código.
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label>
            Email
            <input
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

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <Link href="/consultar" style={{ textDecoration: "none" }}>
              <Button variant="secondary" type="button">Consultar reserva</Button>
            </Link>
            <Link href="/" style={{ textDecoration: "none" }}>
              <Button variant="ghost" type="button">Volver al inicio</Button>
            </Link>
          </div>
        </form>
      </Card>
    </main>
  );
}
