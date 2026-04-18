"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
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
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- sincronizar perfil con sesión Firebase */
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
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hidratar tema desde localStorage / prefers-color-scheme */
    const stored = window.localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      if (stored === "dark") document.documentElement.setAttribute("data-theme", "dark");
      return;
    }
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    if (prefersDark) {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (next === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        window.localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
        window.localStorage.setItem("theme", "light");
      }
      return next;
    });
  }, []);

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
      mobileNavOpen={mobileNavOpen}
      onMobileNavOpenChange={setMobileNavOpen}
      sidebar={
        <AdminSidebar
          showCampingsAndUsuarios={!profileLoading && showCampingsAndUsuarios}
          sessionEmail={user.email ?? undefined}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSignOut={onSignOut}
          onAfterNavigate={() => setMobileNavOpen(false)}
        />
      }
    >
      {children}
    </AdminShell>
  );
}
