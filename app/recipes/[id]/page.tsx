import { notFound } from "next/navigation";
import { deleteRecipeAction, duplicateRecipeAction } from "@/app/recipes/actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { FlashMessage } from "@/components/ui/FlashMessage";
import { mealTypeLabels } from "@/lib/constants/meal";
import { getRecipeById } from "@/lib/services/recipes";
import { formatQuantity } from "@/lib/utils/format";

type RecipeDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    notice?: string;
    tone?: "success" | "error" | "warning";
  }>;
};

export default async function RecipeDetailPage({
  params,
  searchParams
}: RecipeDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const recipe = await getRecipeById(id);

  if (!recipe) {
    notFound();
  }

  return (
    <div className="pageStack">
      <PageHeader
        title={recipe.name}
        description={
          recipe.description ||
          "Receta base lista para escalar cantidades por persona y por dia sin duplicar datos."
        }
        actions={
          <>
            <ButtonLink href={`/recipes/${recipe.id}/edit`} variant="secondary">
              Editar
            </ButtonLink>
            <ButtonLink href="/recipes" variant="ghost">
              Volver
            </ButtonLink>
          </>
        }
      />
      <FlashMessage message={query.notice} tone={query.tone} />

      <Card>
        <div className="splitRow">
          <div className="cluster">
            <Badge>{mealTypeLabels[recipe.mealType]}</Badge>
            {recipe.isFavorite ? <Badge neutral>Favorita</Badge> : null}
            <Badge neutral>{recipe._count.plannedMeals} usos en planner</Badge>
          </div>
          <form action={duplicateRecipeAction}>
            <input type="hidden" name="recipeId" value={recipe.id} />
            <button type="submit" className="plainAction">
              Duplicar receta
            </button>
          </form>
        </div>
      </Card>

      <div className="twoColumnGrid">
        <Card>
          <h2 className="sectionHeading">Ingredientes por serving</h2>
          <ul className="cleanList">
            {recipe.ingredients.map((ingredient) => (
              <li key={ingredient.id} className="listRow">
                <div>
                  <strong>{ingredient.itemName}</strong>
                  {ingredient.notes ? <p className="mutedText">{ingredient.notes}</p> : null}
                </div>
                <span>
                  {formatQuantity(ingredient.quantity)} {ingredient.unit}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="sectionHeading">Nutricion por serving</h2>
          <dl className="metricList">
            <div>
              <dt>Calorias</dt>
              <dd>
                {recipe.nutritionCaloriesPerServing !== null
                  ? `${formatQuantity(recipe.nutritionCaloriesPerServing)} kcal`
                  : "N/D"}
              </dd>
            </div>
            <div>
              <dt>Proteina</dt>
              <dd>
                {recipe.nutritionProteinPerServing !== null
                  ? `${formatQuantity(recipe.nutritionProteinPerServing)} g`
                  : "N/D"}
              </dd>
            </div>
            <div>
              <dt>Carbohidratos</dt>
              <dd>
                {recipe.nutritionCarbsPerServing !== null
                  ? `${formatQuantity(recipe.nutritionCarbsPerServing)} g`
                  : "N/D"}
              </dd>
            </div>
            <div>
              <dt>Grasas</dt>
              <dd>
                {recipe.nutritionFatsPerServing !== null
                  ? `${formatQuantity(recipe.nutritionFatsPerServing)} g`
                  : "N/D"}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card>
        <h2 className="sectionHeading">Preparacion</h2>
        <p className="richText">
          {recipe.instructions || "Sin instrucciones registradas todavia."}
        </p>
      </Card>

      <Card>
        <h2 className="sectionHeading">Notas</h2>
        <p className="richText">{recipe.notes || "Sin notas adicionales."}</p>
      </Card>

      <Card>
        <div className="splitRow">
          <div>
            <h2 className="sectionHeading">Accion destructiva</h2>
            <p className="mutedText">
              El borrado es seguro. Si la receta esta en uso dentro del planner, el servidor lo bloqueara.
            </p>
          </div>
          <form action={deleteRecipeAction}>
            <input type="hidden" name="recipeId" value={recipe.id} />
            <input type="hidden" name="redirectTo" value="/recipes" />
            <input type="hidden" name="errorRedirectTo" value={`/recipes/${recipe.id}`} />
            <ConfirmSubmitButton
              type="submit"
              message={`Delete ${recipe.name}? This action is permanent.`}
            >
              Borrar receta
            </ConfirmSubmitButton>
          </form>
        </div>
      </Card>
    </div>
  );
}
