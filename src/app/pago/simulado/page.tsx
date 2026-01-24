import { Suspense } from "react";
import PagoSimuladoClient from "./PagoSimuladoClient";

export default function PagoSimuladoPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}>Cargando…</main>}>
      <PagoSimuladoClient />
    </Suspense>
  );
}
