export default function DevCredits() {
  return (
    <div
      style={{
        textAlign: "center",
        marginTop: 16,
        padding: "16px",
        fontSize: 12,
        color: "var(--color-text-muted)",
      }}
    >
      Desarrollado con <strong>Next.js</strong> por{" "}
      <a
        href="https://www.devrodri.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "var(--color-text-muted)",
          textDecoration: "none",
          fontWeight: 700,
        }}
      >
        Rodrigo Opalo
      </a>
    </div>
  );
}
