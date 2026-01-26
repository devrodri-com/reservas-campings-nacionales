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

  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontWeight: 700 }}>{props.label}</span>

      <div ref={containerRef} style={{ position: "relative" }}>
        <button
          type="button"
          disabled={props.disabled}
          onClick={() => setOpen((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: 10,
            borderRadius: 10,
            border,
            background: "var(--color-surface)",
            color: "var(--color-text)",
            cursor: props.disabled ? "not-allowed" : "pointer",
            opacity: props.disabled ? 0.6 : 1,
            boxSizing: "border-box",
          }}
        >
          <span style={{ textAlign: "left" }}>
            {selected ? selected.label : props.placeholder ?? "Seleccionar…"}
          </span>
          <span style={{ color: "var(--color-text-muted)" }}>▼</span>
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
