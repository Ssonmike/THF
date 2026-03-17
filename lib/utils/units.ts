import { titleCase } from "@/lib/utils/format";

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
  cucharaditas: "tsp"
};

export function normalizeUnit(input: string): string {
  const normalized = input.trim().toLowerCase();
  return unitAliases[normalized] ?? normalized;
}

export function normalizeIngredientName(itemName: string) {
  return itemName.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeQuantityToBaseUnit(quantity: number, unit: string): UnitNormalization {
  const normalizedUnit = normalizeUnit(unit);

  if (normalizedUnit === "kg") {
    return { quantity: quantity * 1000, unit: "g" };
  }

  if (normalizedUnit === "l") {
    return { quantity: quantity * 1000, unit: "ml" };
  }

  return { quantity, unit: normalizedUnit };
}

export function buildIngredientAggregateKey(itemName: string, unit: string) {
  return `${normalizeIngredientName(itemName)}::${normalizeUnit(unit)}`;
}

export function presentIngredientName(itemName: string) {
  return titleCase(normalizeIngredientName(itemName));
}
