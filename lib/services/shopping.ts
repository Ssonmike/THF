import { DayOfWeek, MealType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildIngredientAggregateKey,
  normalizeQuantityToBaseUnit,
  presentIngredientName
} from "@/lib/utils/units";

export type PlannedMealForAggregation = {
  id: string;
  dayOfWeek: DayOfWeek;
  mealSlot: MealType;
  recipe: {
    id: string;
    name: string;
    ingredients: Array<{
      id: string;
      itemName: string;
      quantity: number;
      unit: string;
      notes: string | null;
    }>;
  };
  portions: Array<{
    personId: string;
    servings: number;
  }>;
};

export type ShoppingListItem = {
  itemName: string;
  unit: string;
  quantity: number;
};

export function buildShoppingList(plannedMeals: PlannedMealForAggregation[]): ShoppingListItem[] {
  const aggregate = new Map<string, ShoppingListItem>();

  for (const meal of plannedMeals) {
    const totalServings = meal.portions.reduce((sum, portion) => sum + portion.servings, 0);

    for (const ingredient of meal.recipe.ingredients) {
      const normalized = normalizeQuantityToBaseUnit(
        ingredient.quantity * totalServings,
        ingredient.unit
      );
      const key = buildIngredientAggregateKey(ingredient.itemName, normalized.unit);
      const current = aggregate.get(key);

      if (current) {
        current.quantity += normalized.quantity;
        continue;
      }

      aggregate.set(key, {
        itemName: presentIngredientName(ingredient.itemName),
        unit: normalized.unit,
        quantity: normalized.quantity
      });
    }
  }

  return Array.from(aggregate.values()).sort((a, b) => a.itemName.localeCompare(b.itemName));
}

export async function getShoppingListForWeek(weekStartDate: Date) {
  const weeklyPlan = await prisma.weeklyPlan.findUnique({
    where: { weekStartDate },
    include: {
      plannedMeals: {
        include: {
          recipe: {
            include: {
              ingredients: {
                orderBy: {
                  sortOrder: "asc"
                }
              }
            }
          },
          portions: true
        }
      }
    }
  });

  if (!weeklyPlan) {
    return {
      weeklyPlan: null,
      items: []
    };
  }

  return {
    weeklyPlan,
    items: buildShoppingList(weeklyPlan.plannedMeals)
  };
}
