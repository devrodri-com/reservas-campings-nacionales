"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import DevCredits from "@/components/DevCredits";

export default function GlobalFooter() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  if (isAdmin) return null;

  return (
    <>
      <Footer />
      <DevCredits />
    </>
  );
}
