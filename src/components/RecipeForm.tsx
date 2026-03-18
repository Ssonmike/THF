"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { RecipeData } from "@/types";
import { MEAL_TYPE_LABELS, MEAL_TYPES } from "@/lib/dates";
import styles from "@/app/recipes/recipes.module.css";

interface Props {
  recipe?: RecipeData;
  onSubmit: (formData: FormData) => Promise<{ success: boolean; data?: { id: string }; error?: string }>;
}

interface IngredientRow {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

function makeId() {
  return Math.random().toString(36).slice(2);
}

const DEFAULT_UNITS = ["g", "kg", "ml", "l", "tsp", "tbsp", "cup", "unit", "pinch", "al gusto"];

export default function RecipeForm({ recipe, onSubmit }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNutritionIngredients, setShowNutritionIngredients] = useState(false);

  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    recipe?.ingredients?.length
      ? recipe.ingredients.map((ing) => ({
          id: makeId(),
          name: ing.name,
          quantity: String(ing.quantity),
          unit: ing.unit,
          calories: ing.calories != null ? String(ing.calories) : "",
          protein: ing.protein != null ? String(ing.protein) : "",
          carbs: ing.carbs != null ? String(ing.carbs) : "",
          fat: ing.fat != null ? String(ing.fat) : "",
        }))
      : [{ id: makeId(), name: "", quantity: "", unit: "g", calories: "", protein: "", carbs: "", fat: "" }]
  );

  function addIngredient() {
    setIngredients((prev) => [
      ...prev,
      { id: makeId(), name: "", quantity: "", unit: "g", calories: "", protein: "", carbs: "", fat: "" },
    ]);
  }

  function removeIngredient(id: string) {
    setIngredients((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));
  }

  function updateIngredient(id: string, field: keyof IngredientRow, value: string) {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (submitting) return; // prevent double submit
    setSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);

      // Inject ingredient count + data
      formData.set("ingredientCount", String(ingredients.length));
      ingredients.forEach((ing, i) => {
        formData.set(`ingredients[${i}].name`, ing.name);
        formData.set(`ingredients[${i}].quantity`, ing.quantity);
        formData.set(`ingredients[${i}].unit`, ing.unit);
        formData.set(`ingredients[${i}].calories`, ing.calories);
        formData.set(`ingredients[${i}].protein`, ing.protein);
        formData.set(`ingredients[${i}].carbs`, ing.carbs);
        formData.set(`ingredients[${i}].fat`, ing.fat);
      });

      const result = await onSubmit(formData);

      if (result.success && result.data) {
        router.push(`/recipes/${result.data.id}`);
        router.refresh();
      } else {
        setError(result.error ?? "Error al guardar la receta");
        setSubmitting(false);
      }
    } catch {
      setError("Error inesperado. Inténtalo de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={styles.form} noValidate>
      {error && (
        <div className="alert alert-error" style={{ marginBottom: "var(--space-6)" }}>
          {error}
        </div>
      )}

      {/* Basic info */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div className="form-group">
          <label htmlFor="name">Nombre de la receta *</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={recipe?.name ?? ""}
            placeholder="Tortilla española, Lentejas con verduras…"
            autoFocus={!recipe}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Descripción</label>
          <textarea
            id="description"
            name="description"
            defaultValue={recipe?.description ?? ""}
            placeholder="Breve descripción de la receta…"
            style={{ minHeight: "80px" }}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="mealType">Tipo de comida *</label>
            <select id="mealType" name="mealType" defaultValue={recipe?.mealType ?? "LUNCH"}>
              {MEAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {MEAL_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row" style={{ gap: "var(--space-3)" }}>
            <div className="form-group">
              <label htmlFor="prepTime">Prep (min)</label>
              <input
                id="prepTime"
                name="prepTime"
                type="number"
                min="0"
                max="1440"
                defaultValue={recipe?.prepTime ?? ""}
                placeholder="15"
              />
            </div>
            <div className="form-group">
              <label htmlFor="cookTime">Cocción (min)</label>
              <input
                id="cookTime"
                name="cookTime"
                type="number"
                min="0"
                max="1440"
                defaultValue={recipe?.cookTime ?? ""}
                placeholder="20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <p className={styles.sectionDivider}>
          Ingredientes <span style={{ fontStyle: "italic", textTransform: "none", letterSpacing: 0 }}>por 1 ración estándar</span>
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {/* Header row */}
          <div className={styles.ingredientFormRow} style={{ marginBottom: "-var(--space-1)" }}>
            <label style={{ margin: 0 }}>Ingrediente *</label>
            <label style={{ margin: 0 }}>Cantidad *</label>
            <label style={{ margin: 0 }}>Unidad *</label>
            <span />
          </div>

          {ingredients.map((ing, i) => (
            <div key={ing.id}>
              <div className={styles.ingredientFormRow}>
                <input
                  type="text"
                  value={ing.name}
                  onChange={(e) => updateIngredient(ing.id, "name", e.target.value)}
                  placeholder="patatas, aceite…"
                  aria-label={`Ingrediente ${i + 1} nombre`}
                />
                <input
                  type="number"
                  value={ing.quantity}
                  onChange={(e) => updateIngredient(ing.id, "quantity", e.target.value)}
                  placeholder="100"
                  min="0"
                  step="any"
                  aria-label={`Ingrediente ${i + 1} cantidad`}
                />
                <select
                  value={ing.unit}
                  onChange={(e) => updateIngredient(ing.id, "unit", e.target.value)}
                  aria-label={`Ingrediente ${i + 1} unidad`}
                >
                  {DEFAULT_UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeIngredient(ing.id)}
                  aria-label={`Eliminar ingrediente ${i + 1}`}
                  disabled={ingredients.length === 1}
                >
                  ×
                </button>
              </div>

              {showNutritionIngredients && (
                <div className="form-row-3" style={{ marginTop: "var(--space-2)", paddingLeft: "0" }}>
                  <div className="form-group">
                    <label>kcal</label>
                    <input
                      type="number"
                      value={ing.calories}
                      onChange={(e) => updateIngredient(ing.id, "calories", e.target.value)}
                      placeholder="0"
                      min="0"
                      step="any"
                    />
                  </div>
                  <div className="form-group">
                    <label>Proteína (g)</label>
                    <input
                      type="number"
                      value={ing.protein}
                      onChange={(e) => updateIngredient(ing.id, "protein", e.target.value)}
                      placeholder="0"
                      min="0"
                      step="any"
                    />
                  </div>
                  <div className="form-group">
                    <label>Carbos (g)</label>
                    <input
                      type="number"
                      value={ing.carbs}
                      onChange={(e) => updateIngredient(ing.id, "carbs", e.target.value)}
                      placeholder="0"
                      min="0"
                      step="any"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.ingredientFormActions}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={addIngredient}>
            + Añadir ingrediente
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowNutritionIngredients((v) => !v)}
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {showNutritionIngredients ? "▲ Ocultar nutrición ingredientes" : "▼ Nutrición por ingrediente"}
          </button>
        </div>
      </div>

      {/* Nutrition per serving */}
      <div>
        <p className={styles.sectionDivider}>Nutrición por ración (opcional)</p>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="caloriesPerServing">Calorías (kcal)</label>
            <input
              id="caloriesPerServing"
              name="caloriesPerServing"
              type="number"
              min="0"
              step="any"
              defaultValue={recipe?.caloriesPerServing ?? ""}
              placeholder="380"
            />
          </div>
          <div className="form-group">
            <label htmlFor="proteinPerServing">Proteína (g)</label>
            <input
              id="proteinPerServing"
              name="proteinPerServing"
              type="number"
              min="0"
              step="any"
              defaultValue={recipe?.proteinPerServing ?? ""}
              placeholder="14"
            />
          </div>
        </div>
        <div className="form-row" style={{ marginTop: "var(--space-3)" }}>
          <div className="form-group">
            <label htmlFor="carbsPerServing">Carbohidratos (g)</label>
            <input
              id="carbsPerServing"
              name="carbsPerServing"
              type="number"
              min="0"
              step="any"
              defaultValue={recipe?.carbsPerServing ?? ""}
              placeholder="28"
            />
          </div>
          <div className="form-group">
            <label htmlFor="fatPerServing">Grasa (g)</label>
            <input
              id="fatPerServing"
              name="fatPerServing"
              type="number"
              min="0"
              step="any"
              defaultValue={recipe?.fatPerServing ?? ""}
              placeholder="22"
            />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <p className={styles.sectionDivider}>Instrucciones (opcional)</p>
        <div className="form-group">
          <textarea
            id="instructions"
            name="instructions"
            defaultValue={recipe?.instructions ?? ""}
            placeholder="1. Paso a paso…&#10;2. Cada paso en una línea nueva…"
            style={{ minHeight: "160px" }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className={styles.formActions}>
        <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
          {submitting ? "Guardando…" : recipe ? "Guardar cambios" : "Crear receta"}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-lg"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
