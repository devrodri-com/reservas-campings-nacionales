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
        height: "100vh",
        minHeight: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        alignItems: "stretch",
        boxSizing: "border-box",
        background: "var(--color-background)",
      }}
    >
      {sidebar}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          boxSizing: "border-box",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorY: "contain",
          background: "var(--color-background)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
