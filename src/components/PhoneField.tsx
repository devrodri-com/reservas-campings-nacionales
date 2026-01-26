"use client";

import { PhoneInput } from "react-international-phone";

type PhoneFieldProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
};

export default function PhoneField(props: PhoneFieldProps) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      {props.label ? <span style={{ fontWeight: 700 }}>{props.label}</span> : null}

      <div
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: 10,
          background: "var(--color-surface)",
          padding: 2,
        }}
      >
        <PhoneInput
          defaultCountry="ar"
          value={props.value}
          onChange={props.onChange}
          inputProps={{
            placeholder: props.placeholder ?? "Número de teléfono",
            style: {
              width: "100%",
              padding: 10,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--color-text)",
              fontSize: 14,
            },
          }}
          countrySelectorStyleProps={{
            buttonStyle: {
              border: "none",
              background: "transparent",
              padding: "6px 8px",
              color: "var(--color-text)",
            },
            dropdownStyleProps: {
              style: {
                background: "var(--color-surface)",
                color: "var(--color-text)",
                border: "1px solid var(--color-border)",
                borderRadius: 10,
                boxShadow: "var(--shadow-md)",
              },
            },
          }}
        />
      </div>
    </label>
  );
}
