"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: (nextOpen: boolean) => void;
  children: ReactNode;
};

export default function AdminCollapsibleSection(props: Props) {
  return (
    <section
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        background: "var(--color-surface)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => props.onToggle(!props.isOpen)}
        aria-expanded={props.isOpen}
        style={{
          width: "100%",
          border: "none",
          background: "transparent",
          textAlign: "left",
          font: "inherit",
          cursor: "pointer",
          display: "grid",
          gap: 4,
          padding: "12px 14px",
          borderBottom: props.isOpen ? "1px solid var(--color-border)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 14, textAlign: "center", color: "var(--color-text-muted)" }}>
            {props.isOpen ? "▼" : "▶"}
          </span>
          <span style={{ fontWeight: 800, color: "var(--color-text)" }}>{props.title}</span>
        </div>
        {props.subtitle ? (
          <div style={{ color: "var(--color-text-muted)", fontSize: 13, lineHeight: 1.45 }}>
            {props.subtitle}
          </div>
        ) : null}
      </button>

      {props.isOpen ? <div style={{ display: "grid", gap: 12, padding: 14 }}>{props.children}</div> : null}
    </section>
  );
}
