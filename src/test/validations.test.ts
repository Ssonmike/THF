import { describe, it, expect } from "vitest";
import { RecipeSchema, PlannedMealSchema, ChecklistUpdateSchema, parseNumericField, parseIntField } from "@/lib/validations";

describe("RecipeSchema", () => {
  const validRecipe = {
    name: "Tortilla española",
    mealType: "LUNCH" as const,
    ingredients: [
      { name: "patatas", quantity: 300, unit: "g" },
    ],
  };

  it("accepts a valid recipe", () => {
    expect(() => RecipeSchema.parse(validRecipe)).not.toThrow();
  });

  it("rejects empty name", () => {
    const result = RecipeSchema.safeParse({ ...validRecipe, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only name", () => {
    const result = RecipeSchema.safeParse({ ...validRecipe, name: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects invalid mealType", () => {
    const result = RecipeSchema.safeParse({ ...validRecipe, mealType: "PIZZA" });
    expect(result.success).toBe(false);
  });

  it("rejects empty ingredients array", () => {
    const result = RecipeSchema.safeParse({ ...validRecipe, ingredients: [] });
    expect(result.success).toBe(false);
  });

  it("rejects negative quantity in ingredient", () => {
    const result = RecipeSchema.safeParse({
      ...validRecipe,
      ingredients: [{ name: "patatas", quantity: -100, unit: "g" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero quantity in ingredient", () => {
    const result = RecipeSchema.safeParse({
      ...validRecipe,
      ingredients: [{ name: "patatas", quantity: 0, unit: "g" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects ingredient with empty name", () => {
    const result = RecipeSchema.safeParse({
      ...validRecipe,
      ingredients: [{ name: "", quantity: 100, unit: "g" }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional nutrition fields", () => {
    const result = RecipeSchema.safeParse({
      ...validRecipe,
      caloriesPerServing: 380,
      proteinPerServing: 14.5,
      carbsPerServing: 28,
      fatPerServing: 22,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative calorie values", () => {
    const result = RecipeSchema.safeParse({
      ...validRecipe,
      caloriesPerServing: -100,
    });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from name", () => {
    const result = RecipeSchema.safeParse({ ...validRecipe, name: "  Tortilla  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Tortilla");
    }
  });

  it("accepts all valid meal types", () => {
    for (const mealType of ["BREAKFAST", "LUNCH", "DINNER", "SNACK"]) {
      const result = RecipeSchema.safeParse({ ...validRecipe, mealType });
      expect(result.success).toBe(true);
    }
  });
});

describe("PlannedMealSchema", () => {
  const cuid = "cjld2cjxh0000qzrmn831i7rn"; // valid cuid

  const validMeal = {
    recipeId: cuid,
    date: "2026-03-18",
    slot: "LUNCH" as const,
    portions: [{ personId: cuid, servings: 1.5 }],
  };

  it("accepts a valid planned meal", () => {
    expect(() => PlannedMealSchema.parse(validMeal)).not.toThrow();
  });

  it("rejects invalid date format", () => {
    const result = PlannedMealSchema.safeParse({ ...validMeal, date: "18/03/2026" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slot", () => {
    const result = PlannedMealSchema.safeParse({ ...validMeal, slot: "BRUNCH" });
    expect(result.success).toBe(false);
  });

  it("rejects zero servings", () => {
    const result = PlannedMealSchema.safeParse({
      ...validMeal,
      portions: [{ personId: cuid, servings: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative servings", () => {
    const result = PlannedMealSchema.safeParse({
      ...validMeal,
      portions: [{ personId: cuid, servings: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty portions array", () => {
    const result = PlannedMealSchema.safeParse({ ...validMeal, portions: [] });
    expect(result.success).toBe(false);
  });
});

describe("ChecklistUpdateSchema", () => {
  const cuid = "cjld2cjxh0000qzrmn831i7rn";

  it("accepts valid input", () => {
    const result = ChecklistUpdateSchema.safeParse({
      weeklyPlanId: cuid,
      ingredientKey: "patatas__g",
      checked: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty ingredientKey", () => {
    const result = ChecklistUpdateSchema.safeParse({
      weeklyPlanId: cuid,
      ingredientKey: "",
      checked: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("parseNumericField", () => {
  it("parses standard decimals", () => {
    expect(parseNumericField("3.14")).toBe(3.14);
    expect(parseNumericField("100")).toBe(100);
  });

  it("accepts comma as decimal separator", () => {
    expect(parseNumericField("3,14")).toBe(3.14);
  });

  it("returns undefined for empty input", () => {
    expect(parseNumericField("")).toBeUndefined();
    expect(parseNumericField(null)).toBeUndefined();
    expect(parseNumericField(undefined)).toBeUndefined();
    expect(parseNumericField("  ")).toBeUndefined();
  });

  it("returns undefined for non-numeric input", () => {
    expect(parseNumericField("abc")).toBeUndefined();
  });
});

describe("parseIntField", () => {
  it("parses integers", () => {
    expect(parseIntField("15")).toBe(15);
    expect(parseIntField("0")).toBe(0);
  });

  it("returns undefined for empty input", () => {
    expect(parseIntField("")).toBeUndefined();
    expect(parseIntField(null)).toBeUndefined();
  });

  it("truncates decimals", () => {
    expect(parseIntField("15.9")).toBe(15);
  });
});
