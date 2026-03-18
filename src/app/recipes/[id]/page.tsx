import { notFound } from "next/navigation";
import Link from "next/link";
import { getRecipeById } from "@/actions/recipes";
import { deleteRecipe, toggleFavorite, duplicateRecipe } from "@/actions/recipes";
import { MEAL_TYPE_LABELS } from "@/lib/dates";
import styles from "./recipe-detail.module.css";
import DeleteRecipeButton from "./DeleteRecipeButton";
import FavoriteButton from "./FavoriteButton";
import DuplicateButton from "./DuplicateButton";
import RecipeIngredients from "./RecipeIngredients";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  return { title: recipe?.name ?? "Receta no encontrada" };
}

/** Parse "1. texto\n2. texto" → ["texto", "texto"] */
function parseSteps(instructions: string): string[] {
  return instructions
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

const MEAL_TYPE_ICONS: Record<string, string> = {
  BREAKFAST: "☀️",
  LUNCH: "🍽️",
  SNACK: "🍎",
  DINNER: "🌙",
};

export default async function RecipeDetailPage({ params }: Props) {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  if (!recipe) notFound();

  const prepTime = recipe.prepTime ?? 0;
  const cookTime = recipe.cookTime ?? 0;
  const totalTime = prepTime + cookTime;

  const steps = recipe.instructions ? parseSteps(recipe.instructions) : [];

  const hasNutrition =
    recipe.caloriesPerServing !== null ||
    recipe.proteinPerServing !== null ||
    recipe.carbsPerServing !== null ||
    recipe.fatPerServing !== null;

  return (
    <div className="page-container">
      {/* Top bar: back + actions */}
      <div className={styles.topBar}>
        <Link href="/recipes" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }}>
          ← Recetas
        </Link>
        <div className={styles.topBarActions}>
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

      {/* Hero */}
      <header className={styles.hero}>
        <h1 className={styles.heroTitle}>{recipe.name}</h1>
        {recipe.description && (
          <p className={styles.heroDesc}>{recipe.description}</p>
        )}

        {/* Meta chips */}
        <div className={styles.metaChips}>
          <span className={styles.metaChip}>
            <span className={styles.metaChipIcon}>
              {MEAL_TYPE_ICONS[recipe.mealType] ?? "🍴"}
            </span>
            {MEAL_TYPE_LABELS[recipe.mealType] ?? recipe.mealType}
          </span>

          {prepTime > 0 && (
            <span className={styles.metaChip}>
              <span className={styles.metaChipIcon}>🔪</span>
              <span>
                <span>{prepTime} min</span>{" "}
                <span className={styles.metaChipLabel}>prep</span>
              </span>
            </span>
          )}

          {cookTime > 0 && (
            <span className={styles.metaChip}>
              <span className={styles.metaChipIcon}>🔥</span>
              <span>
                <span>{cookTime} min</span>{" "}
                <span className={styles.metaChipLabel}>cocción</span>
              </span>
            </span>
          )}

          {totalTime > 0 && (
            <span className={styles.metaChip}>
              <span className={styles.metaChipIcon}>⏱</span>
              <span>
                <strong>{totalTime} min</strong>{" "}
                <span className={styles.metaChipLabel}>total</span>
              </span>
            </span>
          )}

          {recipe.isFavorite && (
            <span className={styles.metaChip}>
              <span className={styles.metaChipIcon}>★</span>
              Favorita
            </span>
          )}

          {recipe._count.plannedMeals > 0 && (
            <span className={styles.metaChip}>
              <span className={styles.metaChipIcon}>📅</span>
              Usada {recipe._count.plannedMeals}×
            </span>
          )}
        </div>
      </header>

      {/* Nutrition bar */}
      {hasNutrition && (
        <div className={styles.nutritionBar}>
          {recipe.caloriesPerServing !== null && (
            <div className={`${styles.nutritionBarItem} ${styles.nutritionBarItemCal}`}>
              <span className={styles.nutritionBarValue}>
                {Math.round(recipe.caloriesPerServing)}
              </span>
              <span className={styles.nutritionBarUnit}>kcal</span>
            </div>
          )}
          {recipe.proteinPerServing !== null && (
            <div className={styles.nutritionBarItem}>
              <span className={styles.nutritionBarValue}>
                {Math.round(recipe.proteinPerServing)}g
              </span>
              <span className={styles.nutritionBarUnit}>proteína</span>
            </div>
          )}
          {recipe.carbsPerServing !== null && (
            <div className={styles.nutritionBarItem}>
              <span className={styles.nutritionBarValue}>
                {Math.round(recipe.carbsPerServing)}g
              </span>
              <span className={styles.nutritionBarUnit}>carbos</span>
            </div>
          )}
          {recipe.fatPerServing !== null && (
            <div className={styles.nutritionBarItem}>
              <span className={styles.nutritionBarValue}>
                {Math.round(recipe.fatPerServing)}g
              </span>
              <span className={styles.nutritionBarUnit}>grasa</span>
            </div>
          )}
        </div>
      )}

      {/* Two-column: ingredients (sticky) + steps */}
      <div className={styles.contentLayout}>
        {/* ── Ingredients ── */}
        <RecipeIngredients ingredients={recipe.ingredients} />

        {/* ── Instructions ── */}
        <div className={styles.instructionsPanel}>
          <p className={styles.instructionsPanelTitle}>
            Pasos — {steps.length} {steps.length === 1 ? "paso" : "pasos"}
          </p>

          {steps.length > 0 ? (
            <ol className={styles.stepsList}>
              {steps.map((step, i) => (
                <li key={i} className={styles.stepCard}>
                  <div className={styles.stepNumber}>{i + 1}</div>
                  <div className={styles.stepBody}>
                    <p className={styles.stepText}>{step}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--text-sm)" }}>
              Sin instrucciones añadidas aún.{" "}
              <Link href={`/recipes/${recipe.id}/edit`} style={{ color: "var(--color-accent)" }}>
                Editar receta
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
