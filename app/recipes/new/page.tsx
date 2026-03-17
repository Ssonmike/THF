import { PageHeader } from "@/components/layout/PageHeader";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { FlashMessage } from "@/components/ui/FlashMessage";
import { createRecipeAction } from "@/app/recipes/actions";

type RecipeNewPageProps = {
  searchParams: Promise<{
    notice?: string;
    tone?: "success" | "error";
  }>;
};

export default async function RecipeNewPage({ searchParams }: RecipeNewPageProps) {
  const params = await searchParams;

  return (
    <div className="pageStack">
      <PageHeader
        title="Nueva receta"
        description="Define la receta base por 1 serving estándar. Las porciones reales se ajustarán después en el planner."
      />
      <FlashMessage message={params.notice} tone={params.tone} />
      <RecipeForm action={createRecipeAction} submitLabel="Guardar receta" cancelHref="/recipes" />
    </div>
  );
}
