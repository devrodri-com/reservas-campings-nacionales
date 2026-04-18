"use client";

import React from "react";

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

type Props = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  searchable?: boolean;
  /** Alineado a inputs compactos (toolbar / filtros admin). */
  size?: "default" | "compact";
  /** Solo aplica con `size="compact"`: control aún más liviano (p. ej. panel lateral). */
  compactDensity?: "normal" | "minimal";
};

export default function SelectDropdown(props: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const selected = props.options.find((o) => o.value === props.value) ?? null;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!props.searchable || !q) return props.options;
    return props.options.filter((o) => o.label.toLowerCase().includes(q));
  }, [props.options, props.searchable, query]);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const border = props.hasError
    ? "1px solid rgba(239,68,68,0.8)"
    : "1px solid var(--color-border)";
  const borderMinimal =
    "1px solid color-mix(in srgb, var(--color-border) 78%, transparent)";

  const compact = props.size === "compact";
  const minimal = compact && props.compactDensity === "minimal";

  return (
    <label style={{ display: "grid", gap: minimal ? 3 : compact ? 4 : 6 }}>
      {props.label ? (
        <span
          style={
            minimal
              ? { fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)" }
              : compact
                ? { fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)" }
                : { fontWeight: 700 }
          }
        >
          {props.label}
        </span>
      ) : null}

      <div ref={containerRef} style={{ position: "relative" }}>
        <button
          type="button"
          disabled={props.disabled}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: minimal ? 6 : compact ? 8 : 12,
            padding: minimal ? "5px 8px" : compact ? "8px 10px" : 10,
            minHeight: minimal ? 34 : compact ? 40 : undefined,
            borderRadius: minimal ? 7 : compact ? 8 : 10,
            fontSize: minimal ? 13 : compact ? 14 : undefined,
            lineHeight: minimal ? "20px" : compact ? "22px" : undefined,
            border: minimal && !props.hasError ? borderMinimal : border,
            fontWeight: minimal ? 500 : undefined,
            background: minimal
              ? "color-mix(in srgb, var(--color-border) 6%, var(--color-surface))"
              : "var(--color-surface)",
            color: "var(--color-text)",
            cursor: props.disabled ? "not-allowed" : "pointer",
            opacity: props.disabled ? 0.6 : 1,
            boxSizing: "border-box",
          }}
        >
          <span
            style={
              compact
                ? {
                    textAlign: "left",
                    minWidth: 0,
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }
                : { textAlign: "left" }
            }
          >
            {selected ? selected.label : props.placeholder ?? "Seleccionar…"}
          </span>
          <svg
            className="select-dropdown__chevron"
            width={minimal ? 11 : compact ? 12 : 12}
            height={minimal ? 11 : compact ? 12 : 12}
            viewBox="0 0 12 12"
            aria-hidden
            style={{
              flexShrink: 0,
              color: "var(--color-text-muted)",
              transform: open ? "rotate(180deg)" : undefined,
              transition: "transform 0.15s ease",
            }}
          >
            <path
              d="M2.35 4.35L6 7.85L9.65 4.35"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {open ? (
          <div
            style={{
              position: "absolute",
              zIndex: 50,
              marginTop: 8,
              width: "100%",
              borderRadius: 12,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              boxShadow: "var(--shadow-md)",
              overflow: "hidden",
            }}
          >
            {props.searchable ? (
              <div style={{ padding: 10, borderBottom: "1px solid var(--color-border)" }}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar…"
                  autoFocus
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-background)",
                    color: "var(--color-text)",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            ) : null}

            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: 12, color: "var(--color-text-muted)" }}>
                  Sin resultados
                </div>
              ) : (
                filtered.map((o) => {
                  const active = o.value === props.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => {
                        props.onChange(o.value);
                        setOpen(false);
                        setQuery("");
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: 12,
                        border: "none",
                        background: active ? "rgba(44,100,101,0.14)" : "transparent",
                        color: "var(--color-text)",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{o.label}</div>
                      {o.description ? (
                        <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                          {o.description}
                        </div>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
    </label>
  );
}
