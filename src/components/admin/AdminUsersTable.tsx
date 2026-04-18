"use client";

import { useState, type CSSProperties } from "react";
import type { UserProfile, UserRole } from "@/types/user";
import Modal from "@/components/Modal";
import { Button, Table, Th, Td } from "@/components/ui";

function roleDisplayLabel(role: UserRole): string {
  switch (role) {
    case "admin_global":
      return "Administrador global";
    case "admin_camping":
      return "Operador de camping";
    case "viewer":
      return "Consulta por camping";
    case "viewer_global":
      return "Consulta global";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

type Props = {
  users: UserProfile[];
  campingLabelById: Map<string, string>;
  sessionUid: string;
  busyUid: string | null;
  onToggleActivo: (uid: string, activo: boolean) => void;
};

const btnCompact: CSSProperties = {
  padding: "6px 10px",
  fontSize: 13,
};

type PendingToggle = {
  uid: string;
  email: string;
  nextActivo: boolean;
};

export default function AdminUsersTable({
  users,
  campingLabelById,
  sessionUid,
  busyUid,
  onToggleActivo,
}: Props) {
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(null);

  const closeConfirm = () => setPendingToggle(null);

  return (
    <>
    <Table>
      <thead>
        <tr>
          <Th>Email</Th>
          <Th>Rol</Th>
          <Th>Camping</Th>
          <Th>Estado</Th>
          <Th>Acciones</Th>
        </tr>
      </thead>
      <tbody>
        {users.length === 0 ? (
          <tr>
            <td
              colSpan={5}
              style={{
                padding: 16,
                textAlign: "center",
                color: "var(--color-text-muted)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              No hay usuarios para mostrar.
            </td>
          </tr>
        ) : (
          users.map((u) => {
            const campingLabel =
              u.campingId != null && u.campingId !== ""
                ? (campingLabelById.get(u.campingId) ?? u.campingId)
                : "-";
            const isSelf = u.uid === sessionUid;
            const rowBusy = busyUid === u.uid;

            return (
              <tr key={u.uid}>
                <Td>{u.email}</Td>
                <Td>{roleDisplayLabel(u.role)}</Td>
                <Td>{campingLabel}</Td>
                <Td>
                  <span
                    style={{
                      fontWeight: 600,
                      color: u.activo ? "var(--color-accent)" : "var(--color-text-muted)",
                    }}
                  >
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </Td>
                <Td>
                  {u.activo ? (
                    <Button
                      type="button"
                      variant="secondary"
                      style={btnCompact}
                      disabled={rowBusy || isSelf}
                      title={
                        isSelf
                          ? "No podés desactivar tu propia cuenta desde aquí."
                          : "Desactivar cuenta (no podrá acceder hasta reactivarla)"
                      }
                      onClick={() => setPendingToggle({ uid: u.uid, email: u.email, nextActivo: false })}
                    >
                      {rowBusy ? "…" : "Desactivar"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      style={btnCompact}
                      disabled={rowBusy}
                      title="Restaurar acceso al panel"
                      onClick={() => setPendingToggle({ uid: u.uid, email: u.email, nextActivo: true })}
                    >
                      {rowBusy ? "…" : "Activar"}
                    </Button>
                  )}
                </Td>
              </tr>
            );
          })
        )}
      </tbody>
    </Table>

    {pendingToggle ? (
      <Modal
        open
        title={pendingToggle.nextActivo ? "Activar usuario" : "Desactivar cuenta"}
        onClose={closeConfirm}
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <Button type="button" variant="ghost" onClick={closeConfirm}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant={pendingToggle.nextActivo ? "primary" : "secondary"}
              disabled={busyUid === pendingToggle.uid}
              onClick={() => {
                const { uid, nextActivo } = pendingToggle;
                closeConfirm();
                onToggleActivo(uid, nextActivo);
              }}
            >
              {pendingToggle.nextActivo ? "Activar" : "Desactivar"}
            </Button>
          </div>
        }
      >
        <p style={{ margin: 0, lineHeight: 1.5, color: "var(--color-text)" }}>
          {pendingToggle.nextActivo ? (
            <>
              Se restaurará el acceso al panel administrativo para{" "}
              <strong>{pendingToggle.email}</strong>.
            </>
          ) : (
            <>
              <strong>{pendingToggle.email}</strong> no podrá acceder al panel administrativo hasta que un
              administrador reactive la cuenta.
            </>
          )}
        </p>
      </Modal>
    ) : null}
    </>
  );
}
