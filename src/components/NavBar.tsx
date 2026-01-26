"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SunIcon, MoonIcon, MenuIcon, CloseIcon } from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
};

const ITEMS: NavItem[] = [
  { href: "/", label: "Inicio" },
  { href: "/reservar", label: "Reservar" },
  { href: "/consultar", label: "Consultar" },
  { href: "/admin", label: "Admin" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function NavBar() {
  const pathname = usePathname();

  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      if (stored === "dark") document.documentElement.setAttribute("data-theme", "dark");
      return;
    }

    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    if (prefersDark) {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);

    if (next === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      window.localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      window.localStorage.setItem("theme", "light");
    }
  };

  return (
    <header
      style={{
        background: "var(--color-primary)",
        borderBottom: "none",
      }}
    >
      <nav
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 700,
            textDecoration: "none",
            color: "var(--color-primary-contrast)",
          }}
        >
          Reservas Campings
        </Link>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div className="nav-links-desktop">
            {ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    textDecoration: "none",
                    padding: "6px 10px",
                    borderRadius: 8,
                    color: "var(--color-primary-contrast)",
                    background: active ? "rgba(255, 255, 255, 0.18)" : "transparent",
                    opacity: active ? 1 : 0.9,
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
            aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.35)",
              background: "rgba(255,255,255,0.10)",
              color: "white",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {theme === "dark" ? <SunIcon title="Modo claro" /> : <MoonIcon title="Modo oscuro" />}
          </button>
          <button
            className="nav-menu-btn"
            onClick={() => setMobileOpen((v) => !v)}
            title={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.35)",
              background: "rgba(255,255,255,0.10)",
              color: "white",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {mobileOpen ? <CloseIcon title="Cerrar" /> : <MenuIcon title="Menú" />}
          </button>
        </div>
      </nav>
      {mobileOpen ? (
        <div className="nav-links-mobile" style={{ background: "var(--color-primary)" }}>
          {ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textDecoration: "none",
                  padding: "10px 12px",
                  borderRadius: 8,
                  color: "var(--color-primary-contrast)",
                  background: active ? "rgba(255, 255, 255, 0.18)" : "transparent",
                  opacity: active ? 1 : 0.9,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </header>
  );
}
