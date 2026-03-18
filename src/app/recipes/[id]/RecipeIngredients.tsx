"use client";

import { useState } from "react";
import styles from "./recipe-detail.module.css";

interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface Props {
  ingredients: Ingredient[];
  servings?: number;
}

export default function RecipeIngredients({ ingredients }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allChecked = ingredients.length > 0 && checked.size === ingredients.length;

  function toggleAll() {
    if (allChecked) setChecked(new Set());
    else setChecked(new Set(ingredients.map((i) => i.id)));
  }

  return (
    <div className={styles.ingredientsPanel}>
      <div className={styles.ingredientsPanelHeader}>
        <p className={styles.panelTitle}>Ingredientes</p>
        <button className={styles.checkAllBtn} onClick={toggleAll}>
          {allChecked ? "Desmarcar todo" : "Marcar todo"}
        </button>
      </div>

      <ul className={styles.ingredientsList}>
        {ingredients.map((ing) => {
          const isChecked = checked.has(ing.id);
          const qty =
            ing.quantity % 1 === 0
              ? String(ing.quantity)
              : ing.quantity.toFixed(2).replace(/\.?0+$/, "");

          return (
            <li
              key={ing.id}
              className={`${styles.ingredientItem} ${isChecked ? styles.ingredientItemChecked : ""}`}
              onClick={() => toggle(ing.id)}
            >
              <span className={`${styles.ingredientCheck} ${isChecked ? styles.ingredientCheckDone : ""}`}>
                {isChecked ? "✓" : ""}
              </span>
              <span className={styles.ingredientItemName}>{ing.name}</span>
              <span className={styles.ingredientItemQty}>
                {qty} {ing.unit}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
