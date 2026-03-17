import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { FlashMessage } from "@/components/ui/FlashMessage";
import { getRecipeById } from "@/lib/services/recipes";
import { updateRecipeAction } from "@/app/recipes/actions";

type RecipeEditPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    notice?: string;
    tone?: "success" | "error";
  }>;
};

export default async function RecipeEditPage({
  params,
  searchParams
}: RecipeEditPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const recipe = await getRecipeById(id);

  if (!recipe) {
    notFound();
  }

  return (
    <div className="pageStack">
      <PageHeader
        title={`Editar ${recipe.name}`}
        description="Ajusta la receta base manteniendo una estructura clara y consistente."
      />
      <FlashMessage message={query.notice} tone={query.tone} />
      <RecipeForm
        action={updateRecipeAction.bind(null, recipe.id)}
        submitLabel="Guardar cambios"
        cancelHref={`/recipes/${recipe.id}`}
        initialValues={recipe}
      />
    </div>
  );
}
