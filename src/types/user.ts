export type UserRole = "admin_global" | "admin_camping" | "viewer" | "viewer_global";

export type UserProfile = {
  uid: string;
  email: string;
  role: UserRole;
  activo: boolean;
  /** Obligatorio para `admin_camping` y `viewer`; no aplica a `admin_global` ni `viewer_global`. */
  campingId?: string;
};
