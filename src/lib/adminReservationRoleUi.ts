import type { UserRole } from "@/types/user";

/** Roles de solo lectura en reservas del panel (sin PII de contacto, sin acciones operativas ni export CSV). */
export function isReservationViewerRole(role: UserRole): boolean {
  return role === "viewer" || role === "viewer_global";
}

export function canOperateReservations(role: UserRole): boolean {
  return role === "admin_global" || role === "admin_camping";
}

export function canExportReservationsCsv(role: UserRole): boolean {
  return !isReservationViewerRole(role);
}

/** CSV multi-camping: solo operación global. */
export function canExportReservationsCsvGlobal(role: UserRole): boolean {
  return role === "admin_global";
}
