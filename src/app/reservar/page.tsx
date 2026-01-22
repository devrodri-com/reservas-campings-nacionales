import { Suspense } from "react";
import ReservarClient from "./ReservarClient";

export default function ReservarPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}>Cargando…</main>}>
      <ReservarClient />
    </Suspense>
  );
}
