import Link from "next/link";
import { createRecipe } from "@/actions/recipes";
import RecipeForm from "@/components/RecipeForm";

export const metadata = {
  title: "Nueva receta",
};

export default function NewRecipePage() {
  return (
    <div className="page-container">
      <div style={{ marginBottom: "var(--space-6)" }}>
        <Link href="/recipes" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }}>
          ← Recetas
        </Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Nueva receta</h1>
          <p className="page-subtitle">Define ingredientes por 1 ración estándar</p>
        </div>
      </div>

      <RecipeForm onSubmit={createRecipe} />
    </div>
  );
}
