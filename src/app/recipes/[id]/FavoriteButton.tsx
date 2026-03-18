"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  recipeId: string;
  isFavorite: boolean;
  action: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export default function FavoriteButton({ recipeId, isFavorite, action }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      className="btn btn-ghost btn-sm"
      title={isFavorite ? "Quitar de favoritas" : "Marcar como favorita"}
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await action(recipeId);
        router.refresh();
        setLoading(false);
      }}
      style={{ color: isFavorite ? "var(--color-accent)" : undefined }}
    >
      {isFavorite ? "★ Favorita" : "☆ Favorita"}
    </button>
  );
}
