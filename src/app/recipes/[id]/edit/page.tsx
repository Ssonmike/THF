import { notFound } from "next/navigation";
import Link from "next/link";
import { getRecipeById, updateRecipe } from "@/actions/recipes";
import RecipeForm from "@/components/RecipeForm";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  return { title: recipe ? `Editar — ${recipe.name}` : "Receta no encontrada" };
}

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  if (!recipe) notFound();

  const boundUpdate = updateRecipe.bind(null, id);

  return (
    <div className="page-container">
      <div style={{ marginBottom: "var(--space-6)" }}>
        <Link href={`/recipes/${id}`} className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }}>
          ← {recipe.name}
        </Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Editar receta</h1>
          <p className="page-subtitle">{recipe.name}</p>
        </div>
      </div>

      <RecipeForm recipe={recipe} onSubmit={boundUpdate} />
    </div>
  );
}
