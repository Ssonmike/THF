import { notFound } from "next/navigation";
import Link from "next/link";
import { getRecipeById } from "@/actions/recipes";
import { deleteRecipe, toggleFavorite, duplicateRecipe } from "@/actions/recipes";
import { MEAL_TYPE_LABELS } from "@/lib/dates";
import styles from "../recipes.module.css";
import DeleteRecipeButton from "./DeleteRecipeButton";
import FavoriteButton from "./FavoriteButton";
import DuplicateButton from "./DuplicateButton";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  return { title: recipe?.name ?? "Receta no encontrada" };
}

export default async function RecipeDetailPage({ params }: Props) {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  if (!recipe) notFound();

  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  const hasNutrition =
    recipe.caloriesPerServing !== null ||
    recipe.proteinPerServing !== null ||
    recipe.carbsPerServing !== null ||
    recipe.fatPerServing !== null;

  return (
    <div className="page-container">
      {/* Back link */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <Link href="/recipes" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }}>
          ← Recetas
        </Link>
      </div>

      <div className={styles.detail}>
        {/* Header */}
        <div className="page-header" style={{ marginBottom: "var(--space-4)" }}>
          <h1 className="page-title">{recipe.name}</h1>
          <div className={styles.detailActions}>
            <FavoriteButton
              recipeId={recipe.id}
              isFavorite={recipe.isFavorite}
              action={toggleFavorite}
            />
            <DuplicateButton recipeId={recipe.id} action={duplicateRecipe} />
            <Link href={`/recipes/${recipe.id}/edit`} className="btn btn-secondary btn-sm">
              Editar
            </Link>
            <DeleteRecipeButton
              recipeId={recipe.id}
              plannedCount={recipe._count.plannedMeals}
              action={deleteRecipe}
            />
          </div>
        </div>

        {/* Meta */}
        <div className={styles.detailMeta}>
          <span className="badge badge-default">
            {MEAL_TYPE_LABELS[recipe.mealType] ?? recipe.mealType}
          </span>
          {recipe.prepTime && (
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-tertiary)" }}>
              Prep: {recipe.prepTime} min
            </span>
          )}
          {recipe.cookTime && (
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-tertiary)" }}>
              Cocción: {recipe.cookTime} min
            </span>
          )}
          {totalTime > 0 && (
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-tertiary)" }}>
              Total: {totalTime} min
            </span>
          )}
          {recipe._count.plannedMeals > 0 && (
            <span className="badge badge-success">
              Usada {recipe._count.plannedMeals}×
            </span>
          )}
        </div>

        {recipe.description && (
          <p className={styles.detailDescription}>{recipe.description}</p>
        )}

        {/* Ingredients */}
        <div className={styles.detailSection}>
          <p className={styles.detailSectionTitle}>
            Ingredientes — por 1 ración estándar
          </p>
          <div className={styles.ingredientList}>
            {recipe.ingredients.map((ing) => (
              <div key={ing.id} className={styles.ingredientRow}>
                <span className={styles.ingredientName}>{ing.name}</span>
                <span className={styles.ingredientQty}>
                  {ing.quantity % 1 === 0 ? ing.quantity : ing.quantity.toFixed(2).replace(/\.?0+$/, "")}{" "}
                  {ing.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Nutrition */}
        {hasNutrition && (
          <div className={styles.detailSection}>
            <p className={styles.detailSectionTitle}>Nutrición — por 1 ración</p>
            <div className={styles.nutritionGrid}>
              {recipe.caloriesPerServing !== null && (
                <div className={styles.nutritionCard}>
                  <span className={styles.nutritionCardValue}>
                    {Math.round(recipe.caloriesPerServing)}
                  </span>
                  <span className={styles.nutritionCardLabel}>kcal</span>
                </div>
              )}
              {recipe.proteinPerServing !== null && (
                <div className={styles.nutritionCard}>
                  <span className={styles.nutritionCardValue}>
                    {Math.round(recipe.proteinPerServing)}g
                  </span>
                  <span className={styles.nutritionCardLabel}>proteína</span>
                </div>
              )}
              {recipe.carbsPerServing !== null && (
                <div className={styles.nutritionCard}>
                  <span className={styles.nutritionCardValue}>
                    {Math.round(recipe.carbsPerServing)}g
                  </span>
                  <span className={styles.nutritionCardLabel}>carbos</span>
                </div>
              )}
              {recipe.fatPerServing !== null && (
                <div className={styles.nutritionCard}>
                  <span className={styles.nutritionCardValue}>
                    {Math.round(recipe.fatPerServing)}g
                  </span>
                  <span className={styles.nutritionCardLabel}>grasa</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        {recipe.instructions && (
          <div className={styles.detailSection}>
            <p className={styles.detailSectionTitle}>Instrucciones</p>
            <p className={styles.instructions}>{recipe.instructions}</p>
          </div>
        )}
      </div>
    </div>
  );
}
