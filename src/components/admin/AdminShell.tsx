"use client";

import type { ReactNode } from "react";

export type AdminShellProps = {
  sidebar: ReactNode;
  children: ReactNode;
};

/**
 * Contenedor del panel admin: columna lateral + área de contenido (sin `<main>`;
 * cada página sigue definiendo el suyo).
 */
export default function AdminShell({ sidebar, children }: AdminShellProps) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        minHeight: "100vh",
        alignItems: "stretch",
        background: "var(--color-background)",
      }}
    >
      {sidebar}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          background: "var(--color-background)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
