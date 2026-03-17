"use client";

import { useState } from "react";
import { MealType } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/Textarea";
import { mealTypeOptions, supportedUnits } from "@/lib/constants/meal";
import styles from "@/components/recipes/RecipeForm.module.css";

type IngredientDraft = {
  itemName: string;
  quantity: string;
  unit: string;
  notes: string;
};

type RecipeFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  cancelHref: string;
  initialValues?: {
    name?: string;
    mealType?: MealType;
    description?: string | null;
    instructions?: string | null;
    notes?: string | null;
    imageUrl?: string | null;
    nutritionCaloriesPerServing?: number | null;
    nutritionProteinPerServing?: number | null;
    nutritionCarbsPerServing?: number | null;
    nutritionFatsPerServing?: number | null;
    isFavorite?: boolean;
    ingredients?: Array<{
      itemName: string;
      quantity: number;
      unit: string;
      notes?: string | null;
    }>;
  };
};

const emptyIngredient: IngredientDraft = {
  itemName: "",
  quantity: "1",
  unit: "g",
  notes: ""
};

export function RecipeForm({
  action,
  submitLabel,
  cancelHref,
  initialValues
}: RecipeFormProps) {
  const [ingredients, setIngredients] = useState<IngredientDraft[]>(
    initialValues?.ingredients?.length
      ? initialValues.ingredients.map((ingredient) => ({
          itemName: ingredient.itemName,
          quantity: String(ingredient.quantity),
          unit: ingredient.unit,
          notes: ingredient.notes ?? ""
        }))
      : [emptyIngredient]
  );

  function updateIngredient(index: number, nextValue: Partial<IngredientDraft>) {
    setIngredients((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...nextValue } : item
      )
    );
  }

  function moveIngredient(index: number, direction: -1 | 1) {
    setIngredients((current) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const currentItem = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = currentItem;
      return next;
    });
  }

  return (
    <form action={action} className={styles.form}>
      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Base recipe</h2>
        <div className={styles.grid}>
          <Input id="name" name="name" label="Nombre" defaultValue={initialValues?.name} required />
          <Select
            id="mealType"
            name="mealType"
            label="Tipo de comida"
            defaultValue={initialValues?.mealType ?? MealType.LUNCH}
            required
          >
            {mealTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Input
            id="imageUrl"
            name="imageUrl"
            label="Imagen URL"
            defaultValue={initialValues?.imageUrl ?? ""}
            hint="Opcional"
          />
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              name="isFavorite"
              defaultChecked={initialValues?.isFavorite ?? false}
            />
            Marcar como favorita
          </label>
        </div>
        <Textarea
          id="description"
          name="description"
          label="Descripcion"
          defaultValue={initialValues?.description ?? ""}
        />
        <Textarea
          id="instructions"
          name="instructions"
          label="Instrucciones"
          defaultValue={initialValues?.instructions ?? ""}
        />
        <Textarea id="notes" name="notes" label="Notas" defaultValue={initialValues?.notes ?? ""} />
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Ingredientes por 1 serving</h2>
        <input
          type="hidden"
          name="ingredients"
          value={JSON.stringify(
            ingredients.map((ingredient) => ({
              itemName: ingredient.itemName,
              quantity: Number(ingredient.quantity),
              unit: ingredient.unit,
              notes: ingredient.notes
            }))
          )}
        />
        {ingredients.map((ingredient, index) => (
          <div key={`${index}-${ingredient.itemName}`} className={styles.ingredientCard}>
            <div className={styles.ingredientRow}>
              <Input
                label="Ingrediente"
                value={ingredient.itemName}
                onChange={(event) => updateIngredient(index, { itemName: event.target.value })}
                required
              />
              <Input
                label="Cantidad"
                type="number"
                min="0.01"
                step="0.01"
                value={ingredient.quantity}
                onChange={(event) => updateIngredient(index, { quantity: event.target.value })}
                required
              />
              <Select
                label="Unidad"
                value={ingredient.unit}
                onChange={(event) => updateIngredient(index, { unit: event.target.value })}
              >
                {supportedUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </div>
            <Textarea
              label="Notas del ingrediente"
              value={ingredient.notes}
              onChange={(event) => updateIngredient(index, { notes: event.target.value })}
            />
            <div className={styles.actions}>
              <Button type="button" variant="ghost" onClick={() => moveIngredient(index, -1)}>
                Subir
              </Button>
              <Button type="button" variant="ghost" onClick={() => moveIngredient(index, 1)}>
                Bajar
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setIngredients((current) =>
                    current.length === 1
                      ? current
                      : current.filter((_, itemIndex) => itemIndex !== index)
                  )
                }
              >
                Eliminar ingrediente
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() => setIngredients((current) => [...current, emptyIngredient])}
        >
          Anadir ingrediente
        </Button>
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Nutricion por 1 serving</h2>
        <div className={styles.grid}>
          <Input
            type="number"
            step="0.1"
            min="0"
            name="nutritionCaloriesPerServing"
            label="Calorias"
            defaultValue={initialValues?.nutritionCaloriesPerServing ?? ""}
          />
          <Input
            type="number"
            step="0.1"
            min="0"
            name="nutritionProteinPerServing"
            label="Proteina (g)"
            defaultValue={initialValues?.nutritionProteinPerServing ?? ""}
          />
          <Input
            type="number"
            step="0.1"
            min="0"
            name="nutritionCarbsPerServing"
            label="Carbohidratos (g)"
            defaultValue={initialValues?.nutritionCarbsPerServing ?? ""}
          />
          <Input
            type="number"
            step="0.1"
            min="0"
            name="nutritionFatsPerServing"
            label="Grasas (g)"
            defaultValue={initialValues?.nutritionFatsPerServing ?? ""}
          />
        </div>
      </Card>

      <div className={styles.footer}>
        <div className={styles.actions}>
          <SubmitButton label={submitLabel} pendingLabel="Guardando..." />
          <ButtonLink href={cancelHref} variant="secondary">
            Cancelar
          </ButtonLink>
        </div>
      </div>
    </form>
  );
}
