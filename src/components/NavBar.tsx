"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

        <div style={{ display: "flex", gap: 12 }}>
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
      </nav>
    </header>
  );
}
