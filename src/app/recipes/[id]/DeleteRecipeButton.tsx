"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  recipeId: string;
  plannedCount: number;
  action: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export default function DeleteRecipeButton({ recipeId, plannedCount, action }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (plannedCount > 0) {
    return (
      <span
        className="btn btn-danger btn-sm"
        style={{ opacity: 0.45, cursor: "not-allowed" }}
        title={`En uso en ${plannedCount} comida(s) planificada(s)`}
      >
        Eliminar
      </span>
    );
  }

  if (!confirming) {
    return (
      <button
        className="btn btn-danger btn-sm"
        onClick={() => { setConfirming(true); setError(null); }}
      >
        Eliminar
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {error && <p className="form-error">{error}</p>}
      <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
          ¿Seguro?
        </span>
        <button
          className="btn btn-danger btn-sm"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            const result = await action(recipeId);
            if (result.success) {
              router.push("/recipes");
              router.refresh();
            } else {
              setError(result.error ?? "Error al eliminar");
              setLoading(false);
              setConfirming(false);
            }
          }}
        >
          {loading ? "…" : "Sí, eliminar"}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setConfirming(false)}
          disabled={loading}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
