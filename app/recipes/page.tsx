import { MealType } from "@prisma/client";
import { deleteRecipeAction, duplicateRecipeAction } from "@/app/recipes/actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FlashMessage } from "@/components/ui/FlashMessage";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { mealTypeOptions } from "@/lib/constants/meal";
import { getRecipes } from "@/lib/services/recipes";

type RecipesPageProps = {
  searchParams: Promise<{
    search?: string;
    mealType?: MealType | "ALL";
    favoritesOnly?: string;
    notice?: string;
    tone?: "success" | "error" | "warning";
  }>;
};

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const params = await searchParams;
  const recipes = await getRecipes({
    search: params.search,
    mealType: params.mealType ?? "ALL",
    favoritesOnly: params.favoritesOnly === "true"
  });

  return (
    <div className="pageStack">
      <PageHeader
        title="Recetas"
        description="Repositorio base de recetas con favoritos visibles, búsqueda útil y duplicado rápido para reutilizar sin tocar la original."
        actions={<ButtonLink href="/recipes/new">Nueva receta</ButtonLink>}
      />
      <FlashMessage message={params.notice} tone={params.tone} />

      <Card>
        <form className="inlineFilters">
          <Input
            name="search"
            label="Buscar"
            placeholder="Arroz, yogur, pollo, atun..."
            defaultValue={params.search ?? ""}
          />
          <Select name="mealType" label="Tipo" defaultValue={params.mealType ?? "ALL"}>
            <option value="ALL">Todos</option>
            {mealTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <label className="checkboxLabel">
            <input
              type="checkbox"
              name="favoritesOnly"
              value="true"
              defaultChecked={params.favoritesOnly === "true"}
            />
            Solo favoritas
          </label>
          <div className="cluster">
            <Button type="submit" variant="secondary">
              Aplicar
            </Button>
            <ButtonLink href="/recipes" variant="ghost">
              Limpiar
            </ButtonLink>
          </div>
        </form>
      </Card>

      {recipes.length > 0 ? (
        <div className="contentGrid">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              deleteAction={deleteRecipeAction}
              duplicateAction={duplicateRecipeAction}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Todavia no hay recetas"
          description="Crea tu primera receta base o ajusta los filtros para volver a ver el repositorio."
          action={<ButtonLink href="/recipes/new">Crear receta</ButtonLink>}
        />
      )}
    </div>
  );
}
