"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page-container">
      <div className="empty-state" style={{ marginTop: "4rem" }}>
        <span className="empty-state-icon">⚠</span>
        <h2 className="empty-state-title">Algo ha ido mal</h2>
        <p className="empty-state-desc">
          {error.message || "Ha ocurrido un error inesperado."}
        </p>
        <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
          <button className="btn btn-primary" onClick={reset}>
            Intentar de nuevo
          </button>
          <Link href="/" className="btn btn-secondary">
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
