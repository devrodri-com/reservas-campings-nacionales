import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui";

export default function Footer() {
  return (
    <footer style={{ marginTop: 32, padding: "24px 16px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Card>
          <div className="footer-content">
            <div className="footer-institutional">
              <div className="footer-institutional-lead">
                <Image
                  src="/parques-nacionales-logo.png"
                  alt="Administración de Parques Nacionales"
                  width={64}
                  height={64}
                  style={{ height: "auto", objectFit: "contain" }}
                />

                <div className="footer-institutional-body">
                  <strong>Administración de Parques Nacionales</strong>
                  <br />
                  Organismo responsable de la gestión y conservación de las áreas protegidas de la República Argentina.
                  Promueve la preservación del patrimonio natural y cultural, el turismo sostenible, la educación
                  ambiental y el uso responsable de los espacios naturales.
                  <br />
                  <br />
                  Este sistema forma parte de los servicios digitales para la gestión de campings y áreas recreativas en
                  Parques Nacionales.
                </div>
              </div>
            </div>

            {/* Enlaces institucionales adicionales: incorporar cuando haya material definitivo (rutas y copy). */}
            <div className="footer-operador">
              <p className="footer-operador-kicker">Operadores</p>
              <p className="footer-operador-hint">Acceso para personal autorizado</p>
              <Link
                href="/admin/login"
                className="footer-operador-cta"
                aria-label="Ingresar al panel de gestión para personal autorizado"
              >
                Ingresar al panel de gestión
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </footer>
  );
}
