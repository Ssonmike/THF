import { DayOfWeek, MealType } from "@prisma/client";
import { deletePlannedMealAction, savePlannedMealAction } from "@/app/planner/actions";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/Textarea";
import { dayOfWeekLabels, mealTypeLabels } from "@/lib/constants/meal";
import styles from "@/components/planner/PlannerForm.module.css";

type PlannerFormProps = {
  weekStart: string;
  weeklyPlanId: string;
  persons: Array<{
    id: string;
    name: string;
    defaultPortionMultiplier: number | null;
  }>;
  recipes: Array<{
    id: string;
    name: string;
    mealType: MealType;
    isFavorite: boolean;
  }>;
  selectedDay?: DayOfWeek;
  selectedSlot?: MealType;
  existingMeal?: {
    id: string;
    recipeId: string;
    notes: string | null;
    portions: Array<{
      personId: string;
      servings: number;
    }>;
  } | null;
};

export function PlannerForm({
  weekStart,
  weeklyPlanId,
  persons,
  recipes,
  selectedDay,
  selectedSlot,
  existingMeal
}: PlannerFormProps) {
  if (!selectedDay || !selectedSlot) {
    return (
      <div className={styles.panel}>
        <EmptyState
          title="Selecciona un hueco"
          description="Haz clic en cualquier bloque del planner para asignar una receta y definir cuántos servings toma cada persona."
        />
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className={styles.panel}>
        <EmptyState
          title="Primero hace falta al menos una receta"
          description="El planner usa recetas base. Crea una receta y vuelve aquí para asignarla a la semana."
          action={<ButtonLink href="/recipes/new">Crear receta</ButtonLink>}
        />
      </div>
    );
  }

  const suggestedRecipes = recipes.filter((recipe) => recipe.mealType === selectedSlot);
  const recipePool = suggestedRecipes.length > 0 ? suggestedRecipes : recipes;

  return (
    <div className={styles.panel}>
      <Card>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {existingMeal ? "Editar comida" : "Nueva comida"} · {dayOfWeekLabels[selectedDay]} ·{" "}
            {mealTypeLabels[selectedSlot]}
          </h2>
          <p className={styles.description}>
            La receta define el serving base. Aquí solo ajustas cuánto come Miguel y cuánto come Ana en esta comida concreta.
          </p>
        </div>
      </Card>

      <Card>
        <form action={savePlannedMealAction} className={styles.form}>
          <input type="hidden" name="weekStart" value={weekStart} />
          <input type="hidden" name="weeklyPlanId" value={weeklyPlanId} />
          <input type="hidden" name="dayOfWeek" value={selectedDay} />
          <input type="hidden" name="mealSlot" value={selectedSlot} />

          <Select
            name="recipeId"
            label="Receta"
            defaultValue={existingMeal?.recipeId ?? recipePool[0]?.id}
            required
          >
            {recipePool.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.isFavorite ? "★ " : ""}
                {recipe.name}
              </option>
            ))}
          </Select>

          <div className={styles.personGrid}>
            {persons.map((person) => {
              const existingPortion = existingMeal?.portions.find(
                (portion) => portion.personId === person.id
              );

              return (
                <Input
                  key={person.id}
                  type="number"
                  step="0.05"
                  min="0.05"
                  name={`servings:${person.id}`}
                  label={`${person.name} servings`}
                  defaultValue={
                    existingPortion?.servings ??
                    person.defaultPortionMultiplier ??
                    1
                  }
                  required
                />
              );
            })}
          </div>

          <Textarea
            name="notes"
            label="Notas"
            defaultValue={existingMeal?.notes ?? ""}
            hint="Opcional"
          />

          <div className={styles.actions}>
            <SubmitButton label={existingMeal ? "Guardar cambios" : "Guardar comida"} pendingLabel="Guardando..." />
            <ButtonLink href={`/planner?weekStart=${weekStart}`} variant="secondary">
              Cerrar
            </ButtonLink>
          </div>
        </form>
      </Card>

      {existingMeal ? (
        <Card>
          <form action={deletePlannedMealAction} className={styles.actions}>
            <input type="hidden" name="plannedMealId" value={existingMeal.id} />
            <input type="hidden" name="weekStart" value={weekStart} />
            <ConfirmSubmitButton
              type="submit"
              message="Delete this planned meal from the week?"
            >
              Eliminar comida
            </ConfirmSubmitButton>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
