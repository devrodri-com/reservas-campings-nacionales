export type UserRole = "admin_global" | "admin_camping" | "viewer";

export type UserProfile = {
  uid: string;
  email: string;
  role: UserRole;
  campingId?: string; // requerido si role === "admin_camping"
  activo: boolean;
};
