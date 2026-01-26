"use client";

import React from "react";

type Props = {
  text: string;
};

export default function InfoTooltip(props: Props) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement | null>(null);

  React.useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <span ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Ayuda"
        title="Ayuda"
        style={{
          width: 20,
          height: 20,
          borderRadius: 999,
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          color: "var(--color-text-muted)",
          fontSize: 12,
          lineHeight: "18px",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ?
      </button>

      {open ? (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            top: "110%",
            left: 0,
            zIndex: 1000,
            minWidth: 220,
            maxWidth: 280,
            padding: 10,
            borderRadius: 12,
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            boxShadow: "var(--shadow-md)",
            color: "var(--color-text)",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          {props.text}
        </div>
      ) : null}
    </span>
  );
}
