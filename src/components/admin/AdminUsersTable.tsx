"use client";

import type { UserProfile } from "@/types/user";
import { Table, Th, Td } from "@/components/ui";

type Props = {
  users: UserProfile[];
};

export default function AdminUsersTable({ users }: Props) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Email</Th>
          <Th>Rol</Th>
          <Th>Camping</Th>
          <Th>Activo</Th>
        </tr>
      </thead>
      <tbody>
        {users.length === 0 ? (
          <tr>
            <td
              colSpan={4}
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
          users.map((u) => (
            <tr key={u.uid}>
              <Td>{u.email}</Td>
              <Td>{u.role}</Td>
              <Td>{u.campingId ?? "-"}</Td>
              <Td>{u.activo ? "Sí" : "No"}</Td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
}
