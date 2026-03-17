import { describe, expect, it } from "vitest";
import { DayOfWeek, MealType } from "@prisma/client";
import { calculateNutritionByPerson } from "@/lib/services/dashboard";
import {
  buildDuplicateMealPayload,
  buildPlannedMealPortionInputs,
  resolveDuplicateWeekStrategy
} from "@/lib/services/planner";
import {
  assertRecipeCanBeDeleted,
  sanitizeRecipeForPersistence
} from "@/lib/services/recipes";
import {
  applyShoppingItemStates,
  buildShoppingList
} from "@/lib/services/shopping";
import { formatQuantity } from "@/lib/utils/format";

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
      {
        aggregateKey: "arroz::g",
        checked: false,
        itemName: "Arroz",
        quantity: 175,
        unit: "g"
      },
      {
        aggregateKey: "pollo::g",
        checked: false,
        itemName: "Pollo",
        quantity: 350,
        unit: "g"
      }
    ]);
  });

  it("normalizes names and units consistently", () => {
    const result = buildShoppingList([
      {
        id: "meal-1",
        dayOfWeek: DayOfWeek.TUESDAY,
        mealSlot: MealType.DINNER,
        recipe: {
          id: "recipe-2",
          name: "Sopa",
          ingredients: [
            { id: "1", itemName: "  TOMATES  ", quantity: 0.5, unit: "kg", notes: null },
            { id: "2", itemName: "tomate", quantity: 250, unit: "g", notes: null }
          ]
        },
        portions: [{ personId: "miguel", servings: 1 }]
      }
    ]);

    expect(result).toEqual([
      {
        aggregateKey: "tomate::g",
        checked: false,
        itemName: "Tomate",
        quantity: 750,
        unit: "g"
      }
    ]);
  });

  it("applies persisted checklist state to aggregated items", () => {
    const result = applyShoppingItemStates(
      [
        {
          aggregateKey: "pollo::g",
          checked: false,
          itemName: "Pollo",
          quantity: 350,
          unit: "g"
        }
      ],
      [{ aggregateKey: "pollo::g", isChecked: true }]
    );

    expect(result[0]?.checked).toBe(true);
  });

  it("formats rounded quantities cleanly", () => {
    expect(formatQuantity(233.333333)).toBe("233,3");
    expect(formatQuantity(349.999999)).toBe("350");
  });
});

describe("planner helpers", () => {
  it("builds portion inputs for a new or existing slot", () => {
    expect(
      buildPlannedMealPortionInputs([
        { personId: "miguel", servings: 1.15 },
        { personId: "ana", servings: 0.85 }
      ])
    ).toEqual([
      { personId: "miguel", servings: 1.15 },
      { personId: "ana", servings: 0.85 }
    ]);
  });

  it("requires confirmation before overwriting an existing week", () => {
    expect(
      resolveDuplicateWeekStrategy({
        sourceMealCount: 4,
        targetMealCount: 3,
        overwrite: false
      })
    ).toBe("needs_confirmation");
  });

  it("builds duplicated meals with portions intact", () => {
    const result = buildDuplicateMealPayload(
      [
        {
          recipeId: "recipe-1",
          dayOfWeek: DayOfWeek.MONDAY,
          mealSlot: MealType.LUNCH,
          notes: "Batch cooking",
          portions: [
            { personId: "miguel", servings: 1.1 },
            { personId: "ana", servings: 0.8 }
          ]
        }
      ],
      "week-2"
    );

    expect(result).toEqual([
      {
        weeklyPlanId: "week-2",
        recipeId: "recipe-1",
        dayOfWeek: DayOfWeek.MONDAY,
        mealSlot: MealType.LUNCH,
        notes: "Batch cooking",
        portions: {
          create: [
            { personId: "miguel", servings: 1.1 },
            { personId: "ana", servings: 0.8 }
          ]
        }
      }
    ]);
  });
});

describe("recipe safeguards", () => {
  it("sanitizes recipe payloads before persistence", () => {
    const result = sanitizeRecipeForPersistence({
      name: "  Pasta con atun  ",
      mealType: MealType.LUNCH,
      description: "  rapido  ",
      instructions: "  cocer y mezclar  ",
      notes: "  nota  ",
      imageUrl: "",
      nutritionCaloriesPerServing: 500,
      nutritionProteinPerServing: 25,
      nutritionCarbsPerServing: 60,
      nutritionFatsPerServing: 10,
      isFavorite: false,
      ingredients: [
        { itemName: "  atun  ", quantity: 120, unit: "g", notes: "  escurrido " }
      ]
    });

    expect(result.name).toBe("Pasta con atun");
    expect(result.ingredients[0]?.itemName).toBe("atun");
    expect(result.ingredients[0]?.notes).toBe("escurrido");
  });

  it("blocks deleting a recipe that is still planned", () => {
    expect(() => assertRecipeCanBeDeleted(1)).toThrowError(
      /already used in the planner/i
    );
  });
});

describe("nutrition summary", () => {
  it("returns an empty summary when there is no data", () => {
    expect(calculateNutritionByPerson([])).toEqual([]);
  });

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
