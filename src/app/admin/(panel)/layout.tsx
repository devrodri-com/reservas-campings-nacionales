import type { ReactNode } from "react";
import AdminPanelLayout from "@/components/admin/AdminPanelLayout";

export default function AdminPanelRouteLayout({ children }: { children: ReactNode }) {
  return <AdminPanelLayout>{children}</AdminPanelLayout>;
}
