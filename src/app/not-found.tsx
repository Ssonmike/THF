import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-container">
      <div className="empty-state" style={{ marginTop: "4rem" }}>
        <span className="empty-state-icon">○</span>
        <h2 className="empty-state-title">Página no encontrada</h2>
        <p className="empty-state-desc">
          Esta página no existe o ha sido movida.
        </p>
        <Link href="/" className="btn btn-primary" style={{ marginTop: "var(--space-2)" }}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
