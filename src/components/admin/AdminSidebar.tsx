"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminSidebarProps = {
  /** Mostrar enlaces solo para rol `admin_global` (misma regla que el panel principal). */
  showCampingsAndUsuarios: boolean;
  sessionEmail?: string;
  onSignOut: () => void;
};

/** Solo longhand en bordes/padding para evitar warnings por mezcla con shorthand en rerenders. */
const linkBox: CSSProperties = {
  display: "block",
  paddingTop: 6,
  paddingRight: 10,
  paddingBottom: 6,
  paddingLeft: 10,
  borderRadius: 4,
  textDecoration: "none",
  fontSize: 13,
  lineHeight: 1.35,
  borderTopWidth: 0,
  borderRightWidth: 0,
  borderBottomWidth: 0,
  borderLeftWidth: 0,
  borderTopStyle: "solid",
  borderRightStyle: "solid",
  borderBottomStyle: "solid",
  borderLeftStyle: "solid",
  borderTopColor: "transparent",
  borderRightColor: "transparent",
  borderBottomColor: "transparent",
  borderLeftColor: "transparent",
};

export default function AdminSidebar({
  showCampingsAndUsuarios,
  sessionEmail,
  onSignOut,
}: AdminSidebarProps) {
  const pathname = usePathname() ?? "";

  const isPanel = pathname === "/admin";
  const isReservas = pathname.startsWith("/admin/reservas");
  const isCampings = pathname.startsWith("/admin/campings");
  const isUsuarios = pathname.startsWith("/admin/usuarios");

  const activeStyle: CSSProperties = {
    ...linkBox,
    borderLeftWidth: 3,
    borderLeftColor: "var(--color-accent)",
    paddingLeft: 7,
    background: "color-mix(in srgb, var(--color-border) 28%, var(--color-surface))",
    color: "var(--color-text)",
    fontWeight: 600,
  };

  const inactiveStyle: CSSProperties = {
    ...linkBox,
    color: "var(--color-text-muted)",
    fontWeight: 500,
  };

  const signOutBtn: CSSProperties = {
    margin: 0,
    marginTop: 2,
    paddingTop: 6,
    paddingRight: 10,
    paddingBottom: 6,
    paddingLeft: 10,
    width: "100%",
    boxSizing: "border-box",
    textAlign: "left",
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.35,
    color: "var(--color-text-muted)",
    cursor: "pointer",
    background: "transparent",
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderStyle: "none",
    borderRadius: 4,
  };

  return (
    <aside
      style={{
        width: 200,
        flexShrink: 0,
        borderRightWidth: 1,
        borderRightStyle: "solid",
        borderRightColor: "var(--color-border)",
        background: "var(--color-surface)",
        display: "flex",
        flexDirection: "column",
        paddingTop: 14,
        paddingRight: 10,
        paddingBottom: 12,
        paddingLeft: 10,
      }}
    >
      <header
        style={{
          paddingBottom: 12,
          marginBottom: 2,
          borderBottomWidth: 1,
          borderBottomStyle: "solid",
          borderBottomColor: "var(--color-border)",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: 0.02,
            color: "var(--color-accent)",
          }}
        >
          Panel Admin
        </div>
        {sessionEmail ? (
          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              color: "var(--color-text-muted)",
              wordBreak: "break-word",
              lineHeight: 1.4,
              fontWeight: 500,
            }}
            title={sessionEmail}
          >
            {sessionEmail}
          </div>
        ) : null}
      </header>

      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flex: 1,
          paddingTop: 10,
          paddingBottom: 8,
        }}
      >
        <Link href="/admin" style={isPanel ? activeStyle : inactiveStyle}>
          Panel
        </Link>
        <Link href="/admin/reservas" style={isReservas ? activeStyle : inactiveStyle}>
          Reservas
        </Link>
        {showCampingsAndUsuarios ? (
          <Link href="/admin/campings" style={isCampings ? activeStyle : inactiveStyle}>
            Campings
          </Link>
        ) : null}
        {showCampingsAndUsuarios ? (
          <Link href="/admin/usuarios" style={isUsuarios ? activeStyle : inactiveStyle}>
            Usuarios
          </Link>
        ) : null}
      </nav>

      <footer
        style={{
          borderTopWidth: 1,
          borderTopStyle: "solid",
          borderTopColor: "var(--color-border)",
          paddingTop: 10,
        }}
      >
        <button type="button" onClick={onSignOut} style={signOutBtn}>
          Cerrar sesión
        </button>
      </footer>
    </aside>
  );
}
