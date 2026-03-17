import { DayOfWeek, MealType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mealTypeLabels, mealTypeOptions } from "@/lib/constants/meal";
import { getCurrentDayOfWeek, getWeekStart } from "@/lib/utils/date";
import {
  addNutrition,
  emptyNutritionVector,
  multiplyNutrition,
  type NutritionVector
} from "@/lib/utils/nutrition";

export type DashboardMeal = {
  id: string;
  recipeName: string;
  mealSlot: MealType;
  mealSlotLabel: string;
  dayOfWeek: DayOfWeek;
  portions: Array<{
    personId: string;
    personName: string;
    servings: number;
    nutrition: NutritionVector;
  }>;
};

export function calculateNutritionByPerson(
  meals: Array<{
    portions: Array<{ personId: string; personName: string; servings: number }>;
    recipe: {
      nutritionCaloriesPerServing: number | null;
      nutritionProteinPerServing: number | null;
      nutritionCarbsPerServing: number | null;
      nutritionFatsPerServing: number | null;
    };
  }>
) {
  const totals = new Map<string, { personId: string; personName: string; totals: NutritionVector }>();

  for (const meal of meals) {
    for (const portion of meal.portions) {
      const current = totals.get(portion.personId) ?? {
        personId: portion.personId,
        personName: portion.personName,
        totals: emptyNutritionVector
      };

      current.totals = addNutrition(
        current.totals,
        multiplyNutrition(
          {
            calories: meal.recipe.nutritionCaloriesPerServing ?? 0,
            protein: meal.recipe.nutritionProteinPerServing ?? 0,
            carbs: meal.recipe.nutritionCarbsPerServing ?? 0,
            fats: meal.recipe.nutritionFatsPerServing ?? 0
          },
          portion.servings
        )
      );

      totals.set(portion.personId, current);
    }
  }

  return Array.from(totals.values()).sort((a, b) => a.personName.localeCompare(b.personName));
}

export async function getDashboardData() {
  const today = new Date();
  const weekStartDate = getWeekStart(today);
  const currentDay = getCurrentDayOfWeek(today);

  const weeklyPlan = await prisma.weeklyPlan.findUnique({
    where: { weekStartDate },
    include: {
      plannedMeals: {
        where: { dayOfWeek: currentDay },
        include: {
          recipe: true,
          portions: {
            include: {
              person: true
            }
          }
        },
        orderBy: {
          mealSlot: "asc"
        }
      }
    }
  });

  const meals: DashboardMeal[] = (weeklyPlan?.plannedMeals ?? [])
    .map((meal) => ({
      id: meal.id,
      recipeName: meal.recipe.name,
      mealSlot: meal.mealSlot,
      mealSlotLabel: mealTypeLabels[meal.mealSlot],
      dayOfWeek: meal.dayOfWeek,
      portions: meal.portions.map((portion) => ({
        personId: portion.personId,
        personName: portion.person.name,
        servings: portion.servings,
        nutrition: multiplyNutrition(
          {
            calories: meal.recipe.nutritionCaloriesPerServing ?? 0,
            protein: meal.recipe.nutritionProteinPerServing ?? 0,
            carbs: meal.recipe.nutritionCarbsPerServing ?? 0,
            fats: meal.recipe.nutritionFatsPerServing ?? 0
          },
          portion.servings
        )
      }))
    }))
    .sort(
      (a, b) =>
        mealTypeOptions.findIndex((option) => option.value === a.mealSlot) -
        mealTypeOptions.findIndex((option) => option.value === b.mealSlot)
    );

  return {
    today,
    currentDay,
    weekStartDate,
    weeklyPlan,
    meals,
    nutritionByPerson: calculateNutritionByPerson(
      (weeklyPlan?.plannedMeals ?? []).map((meal) => ({
        recipe: meal.recipe,
        portions: meal.portions.map((portion) => ({
          personId: portion.personId,
          personName: portion.person.name,
          servings: portion.servings
        }))
      }))
    )
  };
}
