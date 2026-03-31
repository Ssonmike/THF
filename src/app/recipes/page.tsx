import Link from "next/link";
import { getRecipes } from "@/actions/recipes";
import { MEAL_TYPE_LABELS } from "@/lib/dates";
import styles from "./recipes.module.css";

export const metadata = {
  title: "Recetas",
};

const FILTER_OPTIONS = [
  { value: "ALL", label: "Todas" },
  { value: "BREAKFAST", label: "Desayuno" },
  { value: "LUNCH", label: "Almuerzo" },
  { value: "SNACK", label: "Merienda" },
  { value: "DINNER", label: "Cena" },
];

interface Props {
  searchParams: Promise<{ mealType?: string; search?: string }>;
}

export default async function RecipesPage({ searchParams }: Props) {
  const { mealType, search } = await searchParams;
  const recipes = await getRecipes(mealType, search);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Recetas</h1>
          <p className="page-subtitle">
            {recipes.length === 0
              ? "Sin recetas"
              : `${recipes.length} receta${recipes.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/recipes/new" className="btn btn-primary">
          + Nueva receta
        </Link>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <form action="/recipes" className={styles.searchInput}>
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Buscar receta…"
            style={{ paddingLeft: "var(--space-3)" }}
          />
          {mealType && <input type="hidden" name="mealType" value={mealType} />}
        </form>

        <div className={styles.filterChips}>
          {FILTER_OPTIONS.map((opt) => {
            const isActive = (opt.value === "ALL" && !mealType) || mealType === opt.value;
            const href =
              opt.value === "ALL"
                ? search ? `/recipes?search=${encodeURIComponent(search)}` : "/recipes"
                : search
                  ? `/recipes?mealType=${opt.value}&search=${encodeURIComponent(search)}`
                  : `/recipes?mealType=${opt.value}`;
            return (
              <Link
                key={opt.value}
                href={href}
                className={`${styles.filterChip} ${isActive ? styles.filterChipActive : ""}`}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {recipes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">☰</span>
          <p className="empty-state-title">
            {search || mealType ? "Sin resultados" : "Sin recetas aún"}
          </p>
          <p className="empty-state-desc">
            {search || mealType
              ? "Prueba otros filtros o términos de búsqueda."
              : "Crea tu primera receta para empezar a planificar."}
          </p>
          {!search && !mealType && (
            <Link href="/recipes/new" className="btn btn-primary" style={{ marginTop: "var(--space-4)" }}>
              Crear receta
            </Link>
          )}
        </div>
      ) : (
        <div className={styles.recipesGrid}>
          {recipes.map((recipe) => {
            const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
            return (
              <Link key={recipe.id} href={`/recipes/${recipe.id}`} className={styles.recipeCard}>
                <div className={styles.recipeCardHeader}>
                  <h2 className={styles.recipeCardName}>{recipe.name}</h2>
                  {recipe.isFavorite && (
                    <span className={styles.recipeCardFav} title="Favorita">
                      ★
                    </span>
                  )}
                </div>

                <div>
                  <span className={`badge badge-default ${styles.filterChip}`} style={{ border: "none", fontSize: "var(--text-xs)" }}>
                    {MEAL_TYPE_LABELS[recipe.mealType] ?? recipe.mealType}
                  </span>
                </div>

                {recipe.description && (
                  <p className={styles.recipeCardDesc}>{recipe.description}</p>
                )}

                <div className={styles.recipeCardMeta}>
                  {totalTime > 0 && (
                    <span className={styles.recipeCardTime}>⏱ {totalTime} min</span>
                  )}
                  <span className={styles.recipeCardTime}>
                    {recipe.ingredients.length} ingredientes
                  </span>
                </div>

                {recipe.caloriesPerServing && (
                  <div className={styles.recipeCardNutrition}>
                    <div className={styles.nutritionItem}>
                      <span className={styles.nutritionValue}>{Math.round(recipe.caloriesPerServing)}</span>
                      <span className={styles.nutritionLabel}>kcal</span>
                    </div>
                    {recipe.proteinPerServing && (
                      <div className={styles.nutritionItem}>
                        <span className={styles.nutritionValue}>{Math.round(recipe.proteinPerServing)}g</span>
                        <span className={styles.nutritionLabel}>proteína</span>
                      </div>
                    )}
                    {recipe.carbsPerServing && (
                      <div className={styles.nutritionItem}>
                        <span className={styles.nutritionValue}>{Math.round(recipe.carbsPerServing)}g</span>
                        <span className={styles.nutritionLabel}>carbos</span>
                      </div>
                    )}
                    {recipe.fatPerServing && (
                      <div className={styles.nutritionItem}>
                        <span className={styles.nutritionValue}>{Math.round(recipe.fatPerServing)}g</span>
                        <span className={styles.nutritionLabel}>grasa</span>
                      </div>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
