"use client";

import { useCallback, useEffect, type ReactNode } from "react";

export type AdminShellProps = {
  sidebar: ReactNode;
  children: ReactNode;
  /** Drawer de navegación en viewport estrecho (≤900px) */
  mobileNavOpen: boolean;
  onMobileNavOpenChange: (open: boolean) => void;
};

/**
 * Contenedor del panel admin: columna lateral + área de contenido (sin `<main>`;
 * cada página sigue definiendo el suyo).
 */
export default function AdminShell({
  sidebar,
  children,
  mobileNavOpen,
  onMobileNavOpenChange,
}: AdminShellProps) {
  const closeNav = useCallback(() => onMobileNavOpenChange(false), [onMobileNavOpenChange]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNav();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen, closeNav]);

  return (
    <div
      className={`admin-shell${mobileNavOpen ? " admin-shell--nav-open" : ""}`}
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
      <button
        type="button"
        className="admin-shell-backdrop"
        aria-label="Cerrar menú de navegación"
        tabIndex={-1}
        onClick={closeNav}
      />
      <div className="admin-sidebar-drawer">{sidebar}</div>
      <div className="admin-shell-main">
        <div className="admin-shell-mobile-topbar">
          <button
            type="button"
            className="admin-shell-menu-btn"
            onClick={() => onMobileNavOpenChange(!mobileNavOpen)}
            aria-expanded={mobileNavOpen}
            aria-controls="admin-sidebar-nav"
          >
            Menú
          </button>
        </div>
        <div
          className="admin-shell-content"
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
    </div>
  );
}
