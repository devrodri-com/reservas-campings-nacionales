type FAQItem = { q: string; a: string };

const ITEMS: FAQItem[] = [
  {
    q: "¿Cómo funciona la reserva?",
    a: "Seleccionás el camping, elegís fechas y cantidad de parcelas, completás tus datos y realizás el pago online.",
  },
  {
    q: "¿Cómo sé qué servicios tiene cada camping?",
    a: "En la ficha de cada camping podés consultar la información general, servicios disponibles, ubicación y condiciones de reserva.",
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
    a: "Las políticas de cancelación dependen de cada camping. Podés gestionar cancelaciones y reintegros según las reglas vigentes. ",
  },
];

export default function FAQ() {
  return (
    <section className="home-faq">
      <h2 className="home-faq-title">Preguntas frecuentes</h2>

      <div className="home-faq-list">
        {ITEMS.map((it) => (
          <article className="home-faq-item" key={it.q}>
            <h3 className="home-faq-q">{it.q}</h3>
            <p className="home-faq-a">{it.a}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
