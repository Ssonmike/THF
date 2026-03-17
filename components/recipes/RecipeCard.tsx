import Link from "next/link";
import { MealType } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { mealTypeLabels } from "@/lib/constants/meal";
import { formatQuantity } from "@/lib/utils/format";
import styles from "@/components/recipes/RecipeCard.module.css";

type RecipeCardProps = {
  recipe: {
    id: string;
    name: string;
    mealType: MealType;
    description: string | null;
    isFavorite: boolean;
    ingredients: Array<{
      id: string;
      itemName: string;
      quantity: number;
      unit: string;
    }>;
    nutritionCaloriesPerServing: number | null;
    _count: {
      plannedMeals: number;
    };
  };
  deleteAction: (formData: FormData) => Promise<void>;
};

export function RecipeCard({ recipe, deleteAction }: RecipeCardProps) {
  return (
    <Card className={styles.card}>
      <div className={styles.top}>
        <div>
          <h2 className={styles.title}>
            <Link href={`/recipes/${recipe.id}`}>{recipe.name}</Link>
          </h2>
          <div className={styles.meta}>
            <Badge>{mealTypeLabels[recipe.mealType]}</Badge>
            {recipe.isFavorite ? <Badge neutral>Favorita</Badge> : null}
            {recipe.nutritionCaloriesPerServing !== null ? (
              <Badge neutral>{formatQuantity(recipe.nutritionCaloriesPerServing)} kcal</Badge>
            ) : null}
          </div>
        </div>
        <Badge neutral>{recipe._count.plannedMeals} planes</Badge>
      </div>

      <p className={styles.description}>
        {recipe.description || "Sin descripción. Se puede editar para añadir contexto o preparación."}
      </p>

      <div className={styles.ingredients}>
        {recipe.ingredients.slice(0, 4).map((ingredient) => (
          <span key={ingredient.id} className={styles.ingredient}>
            {ingredient.itemName} · {formatQuantity(ingredient.quantity)} {ingredient.unit}
          </span>
        ))}
      </div>

      <div className={styles.actions}>
        <Link href={`/recipes/${recipe.id}`}>Ver detalle</Link>
        <Link href={`/recipes/${recipe.id}/edit`}>Editar</Link>
        <form action={deleteAction}>
          <input type="hidden" name="recipeId" value={recipe.id} />
          <input type="hidden" name="redirectTo" value="/recipes" />
          <ConfirmSubmitButton
            type="submit"
            message={`Delete ${recipe.name}? This cannot be undone.`}
          >
            Borrar
          </ConfirmSubmitButton>
        </form>
      </div>
    </Card>
  );
}
