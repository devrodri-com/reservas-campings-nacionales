"use client";

import React from "react";
import { Card, Button } from "@/components/ui";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Si se pasa, reemplaza el pie con el botón "Cerrar" por defecto (p. ej. confirmación). */
  footer?: React.ReactNode;
};

export default function Modal(props: Props) {
  React.useEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.open, props.onClose]);

  if (!props.open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
      onMouseDown={(e) => {
        // cerrar si clickea overlay
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div
        style={{
          width: "min(720px, 100%)",
          maxWidth: "100%",
          maxHeight: "calc(100dvh - 32px)",
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        <Card title={props.title}>
          <div style={{ display: "grid", gap: 12 }}>
            {props.children}
            {props.footer ?? (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button variant="secondary" onClick={props.onClose}>
                  Cerrar
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
