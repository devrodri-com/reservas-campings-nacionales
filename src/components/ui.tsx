import React from "react";

export function Card(props: React.PropsWithChildren<{ title?: string }>) {
  return (
    <section
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-sm)",
        padding: 16,
      }}
    >
      {props.title ? (
        <h2 style={{ margin: "0 0 12px 0", color: "var(--color-accent)" }}>{props.title}</h2>
      ) : null}
      {props.children}
    </section>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost";

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
  }
) {
  const { variant = "primary", style, ...rest } = props;

  const base: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--color-border)",
    cursor: "pointer",
    fontWeight: 600,
    background: "transparent",
    color: "var(--color-text)",
  };

  const styles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: "var(--color-primary)",
      border: "1px solid var(--color-primary)",
      color: "var(--color-primary-contrast)",
    },
    secondary: {
      background: "transparent",
      border: "1px solid var(--color-accent)",
      color: "var(--color-accent)",
    },
    ghost: {
      background: "transparent",
      border: "1px solid var(--color-border)",
      color: "var(--color-text)",
    },
  };

  return (
    <button
      {...rest}
      style={{
        ...base,
        ...styles[variant],
        opacity: props.disabled ? 0.6 : 1,
        ...(style ?? {}),
      }}
    />
  );
}

export function Table(props: React.PropsWithChildren<object>) {
  return (
    <div
      style={{
        overflowX: "auto",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>{props.children}</table>
    </div>
  );
}

export function Th(props: React.PropsWithChildren<object>) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: 12,
        borderBottom: "1px solid var(--color-border)",
        color: "var(--color-accent)",
        fontWeight: 700,
        background: "rgba(44, 100, 101, 0.06)",
      }}
    >
      {props.children}
    </th>
  );
}

export function Td(props: React.PropsWithChildren<object>) {
  return (
    <td
      style={{
        padding: 12,
        borderBottom: "1px solid var(--color-border)",
        color: "var(--color-text)",
      }}
    >
      {props.children}
    </td>
  );
}
