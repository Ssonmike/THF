import { describe, it, expect } from "vitest";
import {
  normalizeUnit,
  normalizeName,
  toBaseUnit,
  formatQuantity,
  ingredientKey,
  aggregateShoppingList,
  type PlannedIngredient,
} from "@/lib/shopping";

describe("normalizeUnit", () => {
  it("normalizes common variants to canonical form", () => {
    expect(normalizeUnit("g")).toBe("g");
    expect(normalizeUnit("gramos")).toBe("g");
    expect(normalizeUnit("Gramo")).toBe("g");
    expect(normalizeUnit("kg")).toBe("kg");
    expect(normalizeUnit("Kilo")).toBe("kg");
    expect(normalizeUnit("ml")).toBe("ml");
    expect(normalizeUnit("mililitros")).toBe("ml");
    expect(normalizeUnit("l")).toBe("l");
    expect(normalizeUnit("litros")).toBe("l");
    expect(normalizeUnit("tsp")).toBe("tsp");
    expect(normalizeUnit("cucharadita")).toBe("tsp");
    expect(normalizeUnit("cucharadas")).toBe("tbsp");
    expect(normalizeUnit("unit")).toBe("unit");
    expect(normalizeUnit("unidades")).toBe("unit");
  });

  it("passes through unknown units", () => {
    expect(normalizeUnit("unknown-unit")).toBe("unknown-unit");
  });
});

describe("normalizeName", () => {
  it("lowercases and trims", () => {
    expect(normalizeName("  Patatas  ")).toBe("patatas");
    expect(normalizeName("ACEITE DE OLIVA")).toBe("aceite de oliva");
    expect(normalizeName("tomate  cherry")).toBe("tomate cherry");
  });
});

describe("toBaseUnit", () => {
  it("converts kg to g", () => {
    expect(toBaseUnit(1, "kg")).toEqual({ quantity: 1000, unit: "g" });
    expect(toBaseUnit(0.5, "kg")).toEqual({ quantity: 500, unit: "g" });
    expect(toBaseUnit(1.5, "kilo")).toEqual({ quantity: 1500, unit: "g" });
  });

  it("converts l to ml", () => {
    expect(toBaseUnit(1, "l")).toEqual({ quantity: 1000, unit: "ml" });
    expect(toBaseUnit(0.25, "litro")).toEqual({ quantity: 250, unit: "ml" });
  });

  it("keeps g and ml as-is", () => {
    expect(toBaseUnit(200, "g")).toEqual({ quantity: 200, unit: "g" });
    expect(toBaseUnit(150, "ml")).toEqual({ quantity: 150, unit: "ml" });
  });

  it("keeps unknown units as-is", () => {
    expect(toBaseUnit(2, "unit")).toEqual({ quantity: 2, unit: "unit" });
    expect(toBaseUnit(1, "tsp")).toEqual({ quantity: 1, unit: "tsp" });
  });
});

describe("formatQuantity", () => {
  it("shows large grams as kg", () => {
    const { quantity, unit } = formatQuantity(1500, "g");
    expect(quantity).toBe("1.5");
    expect(unit).toBe("kg");
  });

  it("keeps small grams as g", () => {
    const { quantity, unit } = formatQuantity(200, "g");
    expect(quantity).toBe("200");
    expect(unit).toBe("g");
  });

  it("shows large ml as l", () => {
    const { quantity, unit } = formatQuantity(2000, "ml");
    expect(quantity).toBe("2");
    expect(unit).toBe("l");
  });

  it("removes trailing decimal zeros", () => {
    const { quantity } = formatQuantity(1.0, "unit");
    expect(quantity).toBe("1");
  });

  it("rounds to 2 decimal places", () => {
    const { quantity } = formatQuantity(1.333, "unit");
    expect(quantity).toBe("1.33");
  });

  it("shows whole numbers without decimals", () => {
    const { quantity } = formatQuantity(500, "g");
    expect(quantity).toBe("500");
  });
});

describe("ingredientKey", () => {
  it("generates stable key", () => {
    expect(ingredientKey("patatas", "g")).toBe("patatas__g");
    expect(ingredientKey("  Patatas  ", "g")).toBe("patatas__g");
    expect(ingredientKey("patatas", "kg")).toBe("patatas__g"); // kg→g in base
    expect(ingredientKey("aceite de oliva", "ml")).toBe("aceite de oliva__ml");
  });
});

describe("aggregateShoppingList", () => {
  it("aggregates same ingredient + unit", () => {
    const ingredients: PlannedIngredient[] = [
      { name: "patatas", quantity: 300, unit: "g", totalServings: 2 },
      { name: "patatas", quantity: 300, unit: "g", totalServings: 1 },
    ];
    const result = aggregateShoppingList(ingredients);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(900); // 300×2 + 300×1
  });

  it("combines kg and g for same ingredient", () => {
    const ingredients: PlannedIngredient[] = [
      { name: "harina", quantity: 500, unit: "g", totalServings: 1 },
      { name: "harina", quantity: 0.5, unit: "kg", totalServings: 1 },
    ];
    const result = aggregateShoppingList(ingredients);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(1000); // 500g + 500g
  });

  it("treats different units as different items", () => {
    const ingredients: PlannedIngredient[] = [
      { name: "sal", quantity: 1, unit: "tsp", totalServings: 1 },
      { name: "sal", quantity: 1, unit: "unit", totalServings: 1 },
    ];
    const result = aggregateShoppingList(ingredients);
    expect(result).toHaveLength(2);
  });

  it("normalizes names case-insensitively", () => {
    const ingredients: PlannedIngredient[] = [
      { name: "Cebolla", quantity: 100, unit: "g", totalServings: 1 },
      { name: "cebolla", quantity: 100, unit: "g", totalServings: 1 },
    ];
    const result = aggregateShoppingList(ingredients);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(200);
  });

  it("scales by totalServings", () => {
    const ingredients: PlannedIngredient[] = [
      { name: "arroz", quantity: 80, unit: "g", totalServings: 3 },
    ];
    const result = aggregateShoppingList(ingredients);
    expect(result[0].quantity).toBe(240); // 80 × 3
  });

  it("skips zero servings", () => {
    const ingredients: PlannedIngredient[] = [
      { name: "verdura", quantity: 100, unit: "g", totalServings: 0 },
    ];
    const result = aggregateShoppingList(ingredients);
    // 100 × 0 = 0 — still added to list (edge case: we still show it as 0)
    // In practice caller filters out 0-serving meals before calling aggregateShoppingList
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(0);
  });

  it("returns items sorted alphabetically", () => {
    const ingredients: PlannedIngredient[] = [
      { name: "zanahoria", quantity: 100, unit: "g", totalServings: 1 },
      { name: "aceite", quantity: 50, unit: "ml", totalServings: 1 },
      { name: "cebolla", quantity: 80, unit: "g", totalServings: 1 },
    ];
    const result = aggregateShoppingList(ingredients);
    expect(result[0].name).toBe("Aceite");
    expect(result[1].name).toBe("Cebolla");
    expect(result[2].name).toBe("Zanahoria");
  });

  it("handles empty list", () => {
    expect(aggregateShoppingList([])).toEqual([]);
  });

  it("handles multiple meals with same recipe", () => {
    // Same recipe used Monday and Wednesday, same person 1 serving each
    const ingredients: PlannedIngredient[] = [
      { name: "patatas", quantity: 300, unit: "g", totalServings: 1 },
      { name: "huevos", quantity: 3, unit: "unit", totalServings: 1 },
      { name: "patatas", quantity: 300, unit: "g", totalServings: 1 }, // Wednesday
      { name: "huevos", quantity: 3, unit: "unit", totalServings: 1 },
    ];
    const result = aggregateShoppingList(ingredients);
    const patatas = result.find((i) => i.name === "Patatas");
    const huevos = result.find((i) => i.name === "Huevos");
    expect(patatas?.quantity).toBe(600);
    expect(huevos?.quantity).toBe(6);
  });
});
