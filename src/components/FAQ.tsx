import { Card } from "@/components/ui";

type FAQItem = { q: string; a: string };

const ITEMS: FAQItem[] = [
  {
    q: "¿Cómo funciona la reserva?",
    a: "Seleccionás el camping, elegís fechas y cantidad de parcelas, completás tus datos y realizás el pago online.",
  },
  {
    q: "¿Cuánto tiempo tengo para completar el pago?",
    a: "El sistema mantiene un hold temporal de 15 minutos. Si el pago no se completa en ese plazo, la disponibilidad se libera automáticamente.",
  },
  {
    q: "¿La parcela queda asignada al reservar?",
    a: "No. La asignación de parcela se realiza en recepción al momento del check-in, respetando la reserva y disponibilidad del camping.",
  },
  {
    q: "¿Cómo consulto mi reserva?",
    a: "Podés consultar el estado con el código de reserva en la sección “Consultar”.",
  },
  {
    q: "¿Qué pasa si no puedo asistir?",
    a: "(Placeholder) Las políticas de cancelación dependen de cada camping. La plataforma permite gestionar cancelaciones y reintegros según reglas definidas por Parques Nacionales.",
  },
];

export default function FAQ() {
  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ margin: "0 0 12px 0", color: "var(--color-accent)" }}>Preguntas frecuentes</h2>

      <div style={{ display: "grid", gap: 12 }}>
        {ITEMS.map((it) => (
          <Card key={it.q}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>{it.q}</div>
              <div style={{ color: "var(--color-text-muted)", lineHeight: 1.5 }}>{it.a}</div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
