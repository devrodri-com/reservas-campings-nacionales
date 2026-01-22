"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Reserva, ReservaEstado, CreatedByMode } from "@/types/reserva";
import type { Camping } from "@/types/camping";
import { formatArs } from "@/lib/money";
import { formatYmdToDmy } from "@/lib/dates";
import { useParams, useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";

type ReservaDoc = Omit<Reserva, "id">;

function isReservaEstado(v: unknown): v is ReservaEstado {
  return v === "confirmada" || v === "cancelada";
}

function isCreatedByMode(v: unknown): v is CreatedByMode {
  return v === "public" || v === "admin";
}

function isReservaDoc(v: unknown): v is ReservaDoc {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;

  return (
    typeof o.campingId === "string" &&
    typeof o.checkInDate === "string" &&
    typeof o.checkOutDate === "string" &&
    typeof o.parcelas === "number" &&
    typeof o.adultos === "number" &&
    typeof o.menores === "number" &&
    typeof o.titularNombre === "string" &&
    typeof o.titularEmail === "string" &&
    typeof o.titularTelefono === "string" &&
    typeof o.titularEdad === "number" &&
    isReservaEstado(o.estado) &&
    typeof o.montoTotalArs === "number" &&
    typeof o.createdAtMs === "number" &&
    (o.createdByUid === undefined || typeof o.createdByUid === "string") &&
    (o.createdByMode === undefined || isCreatedByMode(o.createdByMode))
  );
}

type CampingDoc = Omit<Camping, "id">;

function isCampingDoc(v: unknown): v is CampingDoc {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.areaProtegida === "string" &&
    typeof o.nombre === "string" &&
    typeof o.ubicacionTexto === "string" &&
    typeof o.titular === "string" &&
    typeof o.capacidadParcelas === "number" &&
    typeof o.precioNocheArs === "number" &&
    typeof o.maxPersonasPorParcela === "number" &&
    typeof o.checkInHour === "number" &&
    typeof o.checkOutHour === "number" &&
    typeof o.activo === "boolean"
  );
}

export default function ConfirmadaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const reservaId = params.id;

  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [camping, setCamping] = useState<Camping | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "reservas", reservaId));
        if (!snap.exists()) {
          setError("Reserva no encontrada.");
          return;
        }
        const data = snap.data();
        if (!isReservaDoc(data)) {
          setError("La reserva no tiene el formato esperado.");
          return;
        }
        setReserva({ id: snap.id, ...data });

        // Cargar camping
        const campSnap = await getDoc(doc(db, "campings", data.campingId));
        if (campSnap.exists()) {
          const campData = campSnap.data();
          if (isCampingDoc(campData)) {
            setCamping({ id: campSnap.id, ...campData });
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      }
    };

    load();
  }, [reservaId]);

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1>Reserva confirmada</h1>

      {error ? <p style={{ color: "red" }}>{error}</p> : null}

      {!reserva ? (
        <p>Cargando…</p>
      ) : (
        <Card>
          <p>
            <strong>ID:</strong> {reserva.id}
          </p>
          <p>
            <strong>Camping:</strong> {camping ? `${camping.nombre} - ${camping.areaProtegida}` : reserva.campingId}
          </p>
          <p>
            <strong>Fechas:</strong> {formatYmdToDmy(reserva.checkInDate)} → {formatYmdToDmy(reserva.checkOutDate)}
          </p>
          <p>
            <strong>Parcelas:</strong> {reserva.parcelas}
          </p>
          <p>
            <strong>Personas:</strong> {reserva.adultos} adultos / {reserva.menores} menores
          </p>
          <p>
            <strong>Titular:</strong> {reserva.titularNombre} ({reserva.titularEmail})
          </p>
          <p>
            <strong>Total:</strong> ${formatArs(reserva.montoTotalArs)} (pago simulado)
          </p>

          <div style={{ marginTop: 16, padding: 16, border: "1px dashed var(--color-border)" }}>
            <p style={{ margin: 0 }}><strong>Código de reserva (demo):</strong></p>
            <p style={{ margin: 0, fontFamily: "monospace", fontSize: 18 }}>{reserva.id}</p>
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
            <Button variant="secondary" onClick={() => router.push("/admin")}>
              Ir a admin
            </Button>
            <Button variant="secondary" onClick={() => router.push("/reservar")}>
              Nueva reserva
            </Button>
          </div>
        </Card>
      )}
    </main>
  );
}
