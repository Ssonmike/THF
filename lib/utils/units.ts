import { roundTo, titleCase } from "@/lib/utils/format";

type UnitNormalization = {
  unit: string;
  quantity: number;
};

const unitAliases: Record<string, string> = {
  unidad: "unit",
  unidades: "unit",
  uds: "unit",
  cucharada: "tbsp",
  cucharadas: "tbsp",
  cucharadita: "tsp",
  cucharaditas: "tsp",
  cucharadta: "tbsp"
};

const ingredientAliases: Record<string, string> = {
  huevos: "huevo",
  tomates: "tomate",
  cebollas: "cebolla",
  zanahorias: "zanahoria",
  pimientos: "pimiento",
  platanos: "platano",
  bananas: "platano",
  "aceite oliva": "aceite de oliva",
  "aceite de oliva virgen extra": "aceite de oliva",
  atun: "atun",
  brocoli: "brocoli"
};

export function normalizeFreeText(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeUnit(input: string): string {
  const normalized = normalizeFreeText(input);
  return unitAliases[normalized] ?? normalized;
}

export function normalizeIngredientName(itemName: string) {
  const normalized = normalizeFreeText(itemName);
  return ingredientAliases[normalized] ?? normalized;
}

export function normalizeQuantityToBaseUnit(quantity: number, unit: string): UnitNormalization {
  const normalizedUnit = normalizeUnit(unit);

  if (normalizedUnit === "kg") {
    return { quantity: roundTo(quantity * 1000, 3), unit: "g" };
  }

  if (normalizedUnit === "l") {
    return { quantity: roundTo(quantity * 1000, 3), unit: "ml" };
  }

  return { quantity: roundTo(quantity, 3), unit: normalizedUnit };
}

export function buildIngredientAggregateKey(itemName: string, unit: string) {
  return `${normalizeIngredientName(itemName)}::${normalizeUnit(unit)}`;
}

export function presentIngredientName(itemName: string) {
  return titleCase(normalizeIngredientName(itemName));
}
