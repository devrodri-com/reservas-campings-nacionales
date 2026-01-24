"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Reserva, ReservaEstado, CreatedByMode } from "@/types/reserva";
import type { Camping } from "@/types/camping";
import { formatArs } from "@/lib/money";
import { formatYmdToDmy } from "@/lib/dates";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button, Card } from "@/components/ui";

type ReservaDoc = Omit<Reserva, "id">;

function isReservaEstado(v: unknown): v is ReservaEstado {
  return (
    v === "pendiente_pago" ||
    v === "pagada" ||
    v === "fallida" ||
    v === "cancelada"
  );
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
    (o.createdByMode === undefined || isCreatedByMode(o.createdByMode)) &&
    (o.paymentProvider === undefined || o.paymentProvider === "mercadopago") &&
    (o.paymentStatus === undefined ||
      (o.paymentStatus === "pending" ||
        o.paymentStatus === "approved" ||
        o.paymentStatus === "rejected" ||
        o.paymentStatus === "cancelled")) &&
    (o.mpPreferenceId === undefined || typeof o.mpPreferenceId === "string") &&
    (o.mpPaymentId === undefined || typeof o.mpPaymentId === "string") &&
    (o.paidAtMs === undefined || typeof o.paidAtMs === "number") &&
    (o.expiresAtMs === undefined || typeof o.expiresAtMs === "number")
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

export default function ConfirmadaClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reservaId = params.id;
  const paid = searchParams.get("paid");

  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [camping, setCamping] = useState<Camping | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const markedPaidRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
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
  }, [reservaId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!reserva || paid !== "1" || reserva.estado !== "pendiente_pago" || markedPaidRef.current) return;

    markedPaidRef.current = true;

    (async () => {
      try {
        await updateDoc(doc(db, "reservas", reserva.id), {
          estado: "pagada",
          paymentProvider: "mercadopago",
          paymentStatus: "approved",
          paidAtMs: Date.now(),
          expiresAtMs: deleteField(),
        });
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      }
    })();
  }, [reserva, paid, load]);

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

          {reserva.estado === "pendiente_pago" ? (
            <div style={{ marginTop: 16 }}>
              {typeof reserva.expiresAtMs === "number" && reserva.expiresAtMs <= Date.now() ? (
                <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
                  La reserva expiró. El hold de 15 minutos ya venció.
                </p>
              ) : (
                <>
                  {payError ? <p style={{ color: "red", margin: "0 0 8px 0" }}>{payError}</p> : null}
                  <Button
                    variant="primary"
                    disabled={payLoading}
                    onClick={async () => {
                      setPayLoading(true);
                      setPayError(null);
                      try {
                        const res = await fetch("/api/payments/mercadopago/create", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ reservaId: reserva.id }),
                        });
                        const json = (await res.json()) as { error?: string; checkoutUrl?: string; preferenceId?: string };
                        if (!res.ok) {
                          setPayError(json.error ?? "Error al crear pago");
                          return;
                        }
                        const { checkoutUrl, preferenceId } = json;
                        if (!checkoutUrl || !preferenceId) {
                          setPayError("Respuesta inválida del servidor");
                          return;
                        }
                        await updateDoc(doc(db, "reservas", reserva.id), {
                          mpPreferenceId: preferenceId,
                        });
                        router.push(checkoutUrl);
                      } catch (e) {
                        setPayError(e instanceof Error ? e.message : "Error desconocido");
                      } finally {
                        setPayLoading(false);
                      }
                    }}
                  >
                    {payLoading ? "Redirigiendo…" : "Pagar ahora"}
                  </Button>
                </>
              )}
            </div>
          ) : null}

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
