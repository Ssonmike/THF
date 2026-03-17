import { describe, expect, it } from "vitest";
import { DayOfWeek, MealType } from "@prisma/client";
import { buildShoppingList } from "@/lib/services/shopping";
import { calculateNutritionByPerson } from "@/lib/services/dashboard";

describe("shopping list aggregation", () => {
  it("aggregates ingredients from combined portions", () => {
    const result = buildShoppingList([
      {
        id: "meal-1",
        dayOfWeek: DayOfWeek.MONDAY,
        mealSlot: MealType.LUNCH,
        recipe: {
          id: "recipe-1",
          name: "Arroz con pollo",
          ingredients: [
            { id: "1", itemName: "Pollo", quantity: 200, unit: "g", notes: null },
            { id: "2", itemName: "Arroz", quantity: 100, unit: "g", notes: null }
          ]
        },
        portions: [
          { personId: "miguel", servings: 1 },
          { personId: "ana", servings: 0.75 }
        ]
      }
    ]);

    expect(result).toEqual([
      { itemName: "Arroz", quantity: 175, unit: "g" },
      { itemName: "Pollo", quantity: 350, unit: "g" }
    ]);
  });

  it("normalizes kg and l into base units", () => {
    const result = buildShoppingList([
      {
        id: "meal-1",
        dayOfWeek: DayOfWeek.TUESDAY,
        mealSlot: MealType.DINNER,
        recipe: {
          id: "recipe-2",
          name: "Sopa",
          ingredients: [
            { id: "1", itemName: "Tomate", quantity: 0.5, unit: "kg", notes: null },
            { id: "2", itemName: "Caldo", quantity: 1, unit: "l", notes: null }
          ]
        },
        portions: [{ personId: "miguel", servings: 2 }]
      }
    ]);

    expect(result).toEqual([
      { itemName: "Caldo", quantity: 2000, unit: "ml" },
      { itemName: "Tomate", quantity: 1000, unit: "g" }
    ]);
  });
});

describe("nutrition summary", () => {
  it("calculates totals per person from servings", () => {
    const result = calculateNutritionByPerson([
      {
        recipe: {
          nutritionCaloriesPerServing: 500,
          nutritionProteinPerServing: 35,
          nutritionCarbsPerServing: 40,
          nutritionFatsPerServing: 15
        },
        portions: [
          { personId: "miguel", personName: "Miguel", servings: 1.2 },
          { personId: "ana", personName: "Ana", servings: 0.8 }
        ]
      }
    ]);

    expect(result).toEqual([
      {
        personId: "ana",
        personName: "Ana",
        totals: {
          calories: 400,
          protein: 28,
          carbs: 32,
          fats: 12
        }
      },
      {
        personId: "miguel",
        personName: "Miguel",
        totals: {
          calories: 600,
          protein: 42,
          carbs: 48,
          fats: 18
        }
      }
    ]);
  });
});
