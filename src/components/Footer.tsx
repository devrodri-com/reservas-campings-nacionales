import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui";

export default function Footer() {
  return (
    <footer style={{ marginTop: 32, padding: "24px 16px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Card>
          <div className="footer-content">
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <Image
                src="/parques-nacionales-logo.png"
                alt="Administración de Parques Nacionales"
                width={64}
                height={64}
                style={{ height: "auto", objectFit: "contain" }}
              />

              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: "var(--color-text-muted)",
                  maxWidth: 720,
                }}
              >
                <strong>Administración de Parques Nacionales</strong>
                <br />
                Organismo responsable de la gestión y conservación de las áreas protegidas de la República Argentina.
                Promueve la preservación del patrimonio natural y cultural, el turismo sostenible, la educación ambiental
                y el uso responsable de los espacios naturales.
                <br />
                <br />
                Este sistema forma parte de los servicios digitales para la gestión de campings y áreas recreativas en
                Parques Nacionales.
              </div>
            </div>

            {/* Links útiles */}
            <div
              className="footer-links"
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                fontSize: 14,
              }}
            >
              <Link href="#" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>
                (Pendiente) Información institucional
              </Link>
              <Link href="#" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>
                (Pendiente) Turismo responsable
              </Link>
              <Link href="#" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>
                (Pendiente) Prevención de incendios
              </Link>
              <Link href="#" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>
                (Pendiente) Contacto
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </footer>
  );
}
