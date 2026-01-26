"use client";

import React, { useMemo } from "react";

export type PhoneCountry = {
  code: string;      // ISO 2: "ar"
  label: string;     // "Argentina"
  dialCode: string;  // "+54"
};

const COUNTRIES: PhoneCountry[] = [
  { code: "intl", label: "Internacional (manual)", dialCode: "+" },
  { code: "ar", label: "Argentina", dialCode: "+54" },
  { code: "uy", label: "Uruguay", dialCode: "+598" },
  { code: "br", label: "Brasil", dialCode: "+55" },
  { code: "cl", label: "Chile", dialCode: "+56" },
  { code: "py", label: "Paraguay", dialCode: "+595" },
  { code: "bo", label: "Bolivia", dialCode: "+591" },
  { code: "ve", label: "Venezuela", dialCode: "+58" },
  { code: "ec", label: "Ecuador", dialCode: "+593" },
  { code: "pe", label: "Perú", dialCode: "+51" },
  { code: "co", label: "Colombia", dialCode: "+57" },
  { code: "mx", label: "México", dialCode: "+52" },
  { code: "es", label: "España", dialCode: "+34" },
  { code: "us", label: "Estados Unidos", dialCode: "+1" },
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
};

export default function PhoneFieldSimple(props: Props) {
  const selected = useMemo(() => {
    return COUNTRIES.find((c) => c.code === props.countryCode) ?? COUNTRIES[0];
  }, [props.countryCode]);

  const isManual = selected.code === "intl";

  return (
    <label style={{ display: "grid", gap: 6 }}>
      {props.label ? <span style={{ fontWeight: 700 }}>{props.label}</span> : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <select
          value={selected.code}
          onChange={(e) => props.onCountryCodeChange(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            background: "var(--color-surface)",
            color: "var(--color-text)",
          }}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label} ({c.dialCode})
            </option>
          ))}
        </select>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            background: "var(--color-surface)",
            padding: "0 10px",
          }}
        >
          {isManual && props.onManualDialCodeChange ? (
            <input
              value={props.manualDialCode ?? "+"}
              onChange={(e) => props.onManualDialCodeChange?.(e.target.value)}
              placeholder="+"
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
            onChange={(e) => props.onNumberChange(e.target.value)}
            placeholder={props.placeholder ?? "Ej: 11 1234 5678"}
            required={props.required}
            style={{
              width: "100%",
              padding: "10px 0",
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--color-text)",
            }}
            autoComplete="tel"
            inputMode="tel"
          />
        </div>
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
