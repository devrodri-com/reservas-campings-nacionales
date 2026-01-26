import Link from "next/link";
import { Card } from "@/components/ui";

export default function Footer() {
  return (
    <footer style={{ marginTop: 32, padding: "24px 16px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Card>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 800, color: "var(--color-accent)" }}>
              Sistema de Reservas - Parques Nacionales
            </div>

            <div style={{ color: "var(--color-text-muted)", fontSize: 14, lineHeight: 1.5 }}>
              Plataforma centralizada de reservas para campings de Parques Nacionales.
              <br />
              <span style={{ opacity: 0.9 }}>
                (Placeholder) Contacto:{" "}
                <a href="mailto:soporte@parquesnacionales.gob.ar" style={{ textDecoration: "underline" }}>
                  soporte@parquesnacionales.gob.ar
                </a>
              </span>
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 14 }}>
              <Link href="#" style={{ color: "var(--color-text-muted)" }}>
                (Placeholder) Términos y condiciones
              </Link>
              <Link href="#" style={{ color: "var(--color-text-muted)" }}>
                (Placeholder) Política de privacidad
              </Link>
              <Link href="#" style={{ color: "var(--color-text-muted)" }}>
                (Placeholder) Contacto
              </Link>
              <Link href="#" style={{ color: "var(--color-text-muted)" }}>
                (Placeholder) Arrepentimiento de compra
              </Link>
            </div>
          </div>
        </Card>

        <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "var(--color-text-muted)" }}>
          © {new Date().getFullYear()} Parques Nacionales
        </div>
      </div>
    </footer>
  );
}
