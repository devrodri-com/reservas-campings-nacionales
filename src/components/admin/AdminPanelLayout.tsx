"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { fetchUserProfile } from "@/lib/userProfile";
import type { UserProfile } from "@/types/user";
import AdminShell from "@/components/admin/AdminShell";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    void (async () => {
      const p = await fetchUserProfile(user.uid);
      if (!cancelled) {
        setProfile(p);
        setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const showCampingsAndUsuarios = Boolean(profile?.activo && profile.role === "admin_global");

  const onSignOut = () => {
    void signOut(auth).then(() => {
      router.replace("/admin/login");
    });
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <AdminShell
      sidebar={
        <AdminSidebar
          showCampingsAndUsuarios={!profileLoading && showCampingsAndUsuarios}
          sessionEmail={user.email ?? undefined}
          onSignOut={onSignOut}
        />
      }
    >
      {children}
    </AdminShell>
  );
}
