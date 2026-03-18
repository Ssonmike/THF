"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  recipeId: string;
  action: (id: string) => Promise<{ success: boolean; data?: { id: string }; error?: string }>;
}

export default function DuplicateButton({ recipeId, action }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      className="btn btn-ghost btn-sm"
      title="Duplicar receta"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const result = await action(recipeId);
        if (result.success && result.data) {
          router.push(`/recipes/${result.data.id}/edit`);
        }
        setLoading(false);
      }}
    >
      {loading ? "…" : "Duplicar"}
    </button>
  );
}
