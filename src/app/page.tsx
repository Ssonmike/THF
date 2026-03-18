import Link from "next/link";
import { getMealsForDate } from "@/actions/planner";
import { getOrCreateWeeklyPlan } from "@/actions/planner";
import { getTodayUTC, toDateString, getWeekStart, formatDayLong, SLOT_LABELS } from "@/lib/dates";
import styles from "./page.module.css";

export const metadata = {
  title: "Hoy — TheHomeFood",
};

export default async function DashboardPage() {
  const today = getTodayUTC();
  const todayStr = toDateString(today);
  const weekStart = getWeekStart(today);
  const weekStartStr = toDateString(weekStart);

  const [todayMeals, weeklyPlan] = await Promise.all([
    getMealsForDate(todayStr),
    getOrCreateWeeklyPlan(weekStartStr),
  ]);

  const dayLabel = formatDayLong(today);

  return (
    <div className="page-container">
      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.heroDate}>{dayLabel}</p>
        <h1 className={styles.heroTitle}>Hola, ¿qué comemos hoy?</h1>
        {todayMeals.length === 0 && (
          <p className={styles.heroSub}>Aún no hay nada planificado para hoy.</p>
        )}
      </section>

      {/* Today's meals */}
      <section className={styles.mealsSection}>
        <p className={styles.sectionLabel}>Hoy</p>

        {todayMeals.length === 0 ? (
          <div className="empty-state" style={{ padding: "var(--space-12) var(--space-8)" }}>
            <span className="empty-state-icon">○</span>
            <p className="empty-state-title">Sin comidas planificadas</p>
            <p className="empty-state-desc">
              Ve al planner y añade recetas para el día de hoy.
            </p>
            <Link href="/planner" className="btn btn-primary" style={{ marginTop: "var(--space-4)" }}>
              Ir al planner
            </Link>
          </div>
        ) : (
          <div className={styles.mealsGrid}>
            {todayMeals.map((meal) => {
              const totalServings = meal.portions.reduce((s, p) => s + p.servings, 0);

              // Calculate nutrition per person if available
              const recipe = meal.recipe;
              const hasNutrition = recipe.caloriesPerServing !== null;

              return (
                <Link key={meal.id} href={`/recipes/${recipe.id}`} className={styles.mealCard}>
                  <p className={styles.mealSlot}>
                    {SLOT_LABELS[meal.slot] ?? meal.slot}
                  </p>
                  <h3 className={styles.mealName}>{recipe.name}</h3>

                  <div className={styles.mealPortions}>
                    {meal.portions.map((portion) => (
                      <div key={portion.id} className={styles.mealPortion}>
                        <span className={styles.mealPortionPerson}>{portion.person.name}</span>
                        <span className={styles.mealPortionServings}>
                          {portion.servings === 1
                            ? "1 ración"
                            : `${portion.servings} raciones`}
                        </span>
                      </div>
                    ))}
                    {meal.portions.length === 0 && (
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                        Sin porciones definidas
                      </p>
                    )}
                  </div>

                  {hasNutrition && totalServings > 0 && (
                    <div className={styles.mealNutrition}>
                      {recipe.caloriesPerServing && (
                        <div className={styles.mealNutritionItem}>
                          <span className={styles.mealNutritionValue}>
                            {Math.round(recipe.caloriesPerServing * totalServings)} kcal
                          </span>
                          <span className={styles.mealNutritionLabel}>total</span>
                        </div>
                      )}
                      {recipe.proteinPerServing && (
                        <div className={styles.mealNutritionItem}>
                          <span className={styles.mealNutritionValue}>
                            {Math.round(recipe.proteinPerServing * totalServings)}g
                          </span>
                          <span className={styles.mealNutritionLabel}>proteína</span>
                        </div>
                      )}
                      {recipe.carbsPerServing && (
                        <div className={styles.mealNutritionItem}>
                          <span className={styles.mealNutritionValue}>
                            {Math.round(recipe.carbsPerServing * totalServings)}g
                          </span>
                          <span className={styles.mealNutritionLabel}>carbos</span>
                        </div>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick nav */}
      <section className={styles.mealsSection}>
        <p className={styles.sectionLabel}>Accesos rápidos</p>
        <div className={styles.shortcuts}>
          <Link href={`/planner?week=${weekStartStr}`} className={styles.shortcut}>
            <span className={styles.shortcutIcon}>▦</span>
            <div>
              <p className={styles.shortcutLabel}>Planner semanal</p>
              <p className={styles.shortcutSub}>
                {weeklyPlan.meals.length > 0
                  ? `${weeklyPlan.meals.length} comidas esta semana`
                  : "Semana vacía"}
              </p>
            </div>
          </Link>

          <Link href="/shopping" className={styles.shortcut}>
            <span className={styles.shortcutIcon}>◻</span>
            <div>
              <p className={styles.shortcutLabel}>Lista de compra</p>
              <p className={styles.shortcutSub}>Ingredientes de la semana</p>
            </div>
          </Link>

          <Link href="/recipes" className={styles.shortcut}>
            <span className={styles.shortcutIcon}>☰</span>
            <div>
              <p className={styles.shortcutLabel}>Recetas</p>
              <p className={styles.shortcutSub}>Gestionar y buscar</p>
            </div>
          </Link>

          <Link href="/recipes/new" className={styles.shortcut}>
            <span className={styles.shortcutIcon}>+</span>
            <div>
              <p className={styles.shortcutLabel}>Nueva receta</p>
              <p className={styles.shortcutSub}>Añadir a la biblioteca</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
