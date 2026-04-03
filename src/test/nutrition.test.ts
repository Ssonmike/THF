import { describe, expect, it } from "vitest";
import {
  buildRecipeName,
  extractIngredients,
  parseWeeklyPlan,
  structureRecipeDeterministic,
} from "@/lib/nutrition-plan";
import {
  GenerateNutritionBodySchema,
  NutritionPlanContentSchema,
  NutritionProfileSchema,
} from "@/lib/nutrition";

describe("nutrition validation", () => {
  it("accepts a valid nutrition profile", () => {
    const result = NutritionProfileSchema.safeParse({
      age: 36,
      sex: "MALE",
      heightCm: 180,
      weightKg: 82,
      stressLevel: "moderate",
      cookingStyle: "quick",
      snackPreference: "sweet",
      lateNightSnacking: false,
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid enum values in nutrition profile", () => {
    const result = NutritionProfileSchema.safeParse({
      sex: "OTHER",
      stressLevel: "extreme",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty generated plans", () => {
    const result = NutritionPlanContentSchema.safeParse("   ");
    expect(result.success).toBe(false);
  });

  it("validates generate body payload", () => {
    const result = GenerateNutritionBodySchema.safeParse({
      personName: "Miguel",
      profile: { age: 36, sex: "MALE" },
    });

    expect(result.success).toBe(true);
  });
});

describe("nutrition weekly plan parsing", () => {
  it("extracts meals from markdown weekly plan", () => {
    const plan = parseWeeklyPlan(`
### Lunes Mediterráneo
Desayuno: Yogur griego + 30 g avena + arándanos
Comida: Ensalada de quinoa: 100 g quinoa + tomate + pepino
Cena: Tortilla de espinacas - 450 kcal
Postre: Manzana con yogur
`);

    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({
      day: "lunes",
      breakfast: "Yogur griego + 30 g avena + arándanos",
      lunch: "Ensalada de quinoa: 100 g quinoa + tomate + pepino",
      dinner: "Tortilla de espinacas - 450 kcal",
      snack: "Manzana con yogur",
    });
  });

  it("extracts ingredients from free text meal", () => {
    const ingredients = extractIngredients("Overnight oats: 60 g avena + 200 ml leche + arándanos");

    expect(ingredients).toEqual([
      { name: "avena", quantity: 60, unit: "g" },
      { name: "leche", quantity: 200, unit: "ml" },
      { name: "arándanos", quantity: 1, unit: "unit" },
    ]);
  });



  it("cleans meal-prep notes and salesy filler from parsed meals", () => {
    const plan = parseWeeklyPlan(`
### Martes Fit Gourmet 🍕
**Desayuno:** Avena proteica: 50g copos de avena + 1 scoop proteína sabor vainilla + 200ml leche desnatada + arándanos (80g) | 420 kcal | P: 40g | C: 52g | G: 8g
**Comida:** **PIZZA PROTEICA** (masa fitness con harina integral y queso bajo en grasa, salsa tomate, champiñones, jamón york magro, 40g mozzarella light). Te prometo que sabe a pizza real. *MEAL PREP: haz 4 bases y congela.* | 620 kcal | P: 48g | C: 65g | G: 18g
`);

    expect(plan).toHaveLength(1);
    expect(plan[0]?.lunch).toBe("PIZZA PROTEICA (masa fitness con harina integral y queso bajo en grasa, salsa tomate, champiñones, jamón york magro, 40g mozzarella light). | 620 kcal | P: 48g | C: 65g | G: 18g");
  });

  it("builds cleaner recipe names from noisy AI meal lines", () => {
    const recipe = structureRecipeDeterministic(
      "**PIZZA PROTEICA** (masa fitness con harina integral y queso bajo en grasa, salsa tomate, champiñones, jamón york magro, 40g mozzarella light). Te prometo que sabe a pizza real. *MEAL PREP: haz 4 bases y congela.* | 620 kcal | P: 48g | C: 65g | G: 18g",
      "LUNCH"
    );

    expect(recipe.name).toBe("PIZZA PROTEICA");
    expect(recipe.ingredients[0]?.name).toBe("pizza proteica");
  });

  it("builds a usable recipe name and deterministic recipe structure", () => {
    const name = buildRecipeName("Ensalada templada: quinoa + salmón + espinacas");
    const recipe = structureRecipeDeterministic(
      "Ensalada templada: quinoa + salmón + espinacas - 520 kcal - 35 g proteína",
      "LUNCH"
    );

    expect(name).toContain("Ensalada templada");
    expect(recipe.name).toContain("Ensalada templada");
    expect(recipe.caloriesPerServing).toBe(520);
    expect(recipe.proteinPerServing).toBe(35);
    expect(recipe.ingredients.length).toBeGreaterThan(0);
    expect(recipe.instructions.startsWith("1. ")).toBe(true);
  });
});


describe("nutrition plan persistence", () => {
  it("rejects plans larger than the persistence limit", () => {
    const tooLargePlan = "a".repeat(50001);
    const result = NutritionPlanContentSchema.safeParse(tooLargePlan);

    expect(result.success).toBe(false);
  });
});
