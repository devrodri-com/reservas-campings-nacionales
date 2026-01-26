"use client";

import React, { useMemo, useRef, useEffect } from "react";

export type PhoneCountry = {
  code: string;      // ISO 2: "ar"
  label: string;     // "Argentina"
  dialCode: string;  // "+54"
  flag: string;      // "🇦🇷"
};

const COUNTRIES: PhoneCountry[] = [
  { code: "intl", label: "Internacional (manual)", dialCode: "+", flag: "🌐" },
  { code: "ar", label: "Argentina", dialCode: "+54", flag: "🇦🇷" },
  { code: "uy", label: "Uruguay", dialCode: "+598", flag: "🇺🇾" },
  { code: "br", label: "Brasil", dialCode: "+55", flag: "🇧🇷" },
  { code: "cl", label: "Chile", dialCode: "+56", flag: "🇨🇱" },
  { code: "py", label: "Paraguay", dialCode: "+595", flag: "🇵🇾" },
  { code: "bo", label: "Bolivia", dialCode: "+591", flag: "🇧🇴" },
  { code: "ve", label: "Venezuela", dialCode: "+58", flag: "🇻🇪" },
  { code: "ec", label: "Ecuador", dialCode: "+593", flag: "🇪🇨" },
  { code: "pe", label: "Perú", dialCode: "+51", flag: "🇵🇪" },
  { code: "co", label: "Colombia", dialCode: "+57", flag: "🇨🇴" },
  { code: "mx", label: "México", dialCode: "+52", flag: "🇲🇽" },
  { code: "es", label: "España", dialCode: "+34", flag: "🇪🇸" },
  { code: "us", label: "Estados Unidos", dialCode: "+1", flag: "🇺🇸" },
];

type Props = {
  label?: string;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  number: string;
  onNumberChange: (n: string) => void;
  manualDialCode?: string;
  onManualDialCodeChange?: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  hasError?: boolean;
  layout?: "compact";
};

export default function PhoneFieldSimple(props: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => {
    return COUNTRIES.find((c) => c.code === props.countryCode) ?? COUNTRIES[0];
  }, [props.countryCode]);

  const isManual = selected.code === "intl";

  const filtered = useMemo(() => {
    if (!query.trim()) return COUNTRIES;
    const q = query.toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const handleSelect = (code: string) => {
    props.onCountryCodeChange(code);
    setOpen(false);
    setQuery("");
  };

  const useCompactLayout = props.layout === "compact";

  return (
    <label style={{ display: "grid", gap: 6 }}>
      {props.label ? <span style={{ fontWeight: 700 }}>{props.label}</span> : null}

      <div
        className={
          useCompactLayout
            ? isManual
              ? "phone-grid phone-grid-intl"
              : "phone-grid"
            : undefined
        }
        style={
          useCompactLayout
            ? undefined
            : {
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }
        }
      >
        <div ref={containerRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            disabled={props.disabled}
            style={{
              width: "100%",
              padding: 10,
              border: props.hasError ? "1px solid rgba(239,68,68,0.8)" : "1px solid var(--color-border)",
              borderRadius: 10,
              background: "var(--color-surface)",
              color: "var(--color-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              cursor: props.disabled ? "not-allowed" : "pointer",
              opacity: props.disabled ? 0.6 : 1,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>{selected.flag}</span>
              <span style={{ fontSize: 14 }}>
                {selected.label} ({selected.dialCode})
              </span>
            </span>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>▼</span>
          </button>

          {open ? (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: 4,
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 10,
                boxShadow: "var(--shadow-md)",
                zIndex: 1000,
                maxHeight: 300,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ padding: 8, borderBottom: "1px solid var(--color-border)" }}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar país..."
                  style={{
                    width: "100%",
                    padding: 8,
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    fontSize: 14,
                  }}
                  autoFocus
                />
              </div>
              <div
                style={{
                  overflowY: "auto",
                  maxHeight: 250,
                }}
              >
                {filtered.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c.code)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "none",
                      background: c.code === selected.code ? "var(--color-primary)" : "transparent",
                      color: c.code === selected.code ? "var(--color-primary-contrast)" : "var(--color-text)",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 14,
                    }}
                    onMouseEnter={(e) => {
                      if (c.code !== selected.code) {
                        e.currentTarget.style.background = "var(--color-background)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (c.code !== selected.code) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <span>{c.flag}</span>
                    <span style={{ flex: 1 }}>{c.label}</span>
                    <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>{c.dialCode}</span>
                  </button>
                ))}
                {filtered.length === 0 ? (
                  <div
                    style={{
                      padding: 12,
                      textAlign: "center",
                      color: "var(--color-text-muted)",
                      fontSize: 14,
                    }}
                  >
                    No se encontraron países
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {useCompactLayout && isManual && props.onManualDialCodeChange ? (
          <input
            value={props.manualDialCode ?? "+"}
            onChange={(e) => props.onManualDialCodeChange?.(e.target.value)}
            placeholder="+"
            disabled={props.disabled}
            style={{
              width: "100%",
              padding: 10,
              border: props.hasError ? "1px solid rgba(239,68,68,0.8)" : "1px solid var(--color-border)",
              borderRadius: 10,
              background: "var(--color-surface)",
              color: "var(--color-text-muted)",
              opacity: props.disabled ? 0.6 : 1,
            }}
            inputMode="text"
          />
        ) : null}

        {useCompactLayout ? (
          <input
            value={props.number}
            onChange={(e) => {
              const onlyDigits = e.target.value.replace(/\D/g, "");
              props.onNumberChange(onlyDigits);
            }}
            placeholder={props.placeholder ?? "Ej: 11 1234 5678"}
            required={props.required}
            disabled={props.disabled}
            style={{
              width: "100%",
              padding: 10,
              border: props.hasError ? "1px solid rgba(239,68,68,0.8)" : "1px solid var(--color-border)",
              borderRadius: 10,
              background: "var(--color-surface)",
              color: "var(--color-text)",
              opacity: props.disabled ? 0.6 : 1,
            }}
            autoComplete="tel"
            inputMode="numeric"
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: props.hasError ? "1px solid rgba(239,68,68,0.8)" : "1px solid var(--color-border)",
              borderRadius: 10,
              background: "var(--color-surface)",
              padding: "0 10px",
              opacity: props.disabled ? 0.6 : 1,
            }}
          >
            {isManual && props.onManualDialCodeChange ? (
              <input
                value={props.manualDialCode ?? "+"}
                onChange={(e) => props.onManualDialCodeChange?.(e.target.value)}
                placeholder="+"
                disabled={props.disabled}
                style={{
                  width: 70,
                  padding: "10px 0",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "var(--color-text-muted)",
                }}
                inputMode="text"
              />
            ) : (
              <span style={{ color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                {selected.dialCode}
              </span>
            )}

            <input
              value={props.number}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/\D/g, "");
                props.onNumberChange(onlyDigits);
              }}
              placeholder={props.placeholder ?? "Ej: 11 1234 5678"}
              required={props.required}
              disabled={props.disabled}
              style={{
                width: "100%",
                padding: "10px 0",
                border: "none",
                outline: "none",
                background: "transparent",
                color: "var(--color-text)",
              }}
              autoComplete="tel"
              inputMode="numeric"
            />
          </div>
        )}
      </div>
    </label>
  );
}

export function composePhone(params: {
  countryCode: string;
  number: string;
  manualDialCode?: string;
}): string {
  const n = params.number.trim();
  if (!n) return "";

  const c = COUNTRIES.find((x) => x.code === params.countryCode) ?? COUNTRIES[0];

  if (params.countryCode === "intl") {
    const dc = (params.manualDialCode ?? "+").trim();
    return `${dc} ${n}`.trim();
  }

  return `${c.dialCode} ${n}`.trim();
}
