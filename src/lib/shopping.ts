/**
 * Shopping list aggregation logic for TheHomeFood.
 *
 * Rules:
 * 1. The recipe defines ingredients per 1 standard serving.
 * 2. The planned meal defines how many servings each person takes.
 * 3. Shopping list = sum of (ingredient.quantity × totalServings) per recipe per week.
 * 4. Ingredients are normalized and grouped by (name, unit) after unit normalization.
 */

export type RawIngredient = {
  name: string;
  quantity: number;
  unit: string;
};

export type ShoppingItem = {
  key: string; // normalized key for persistence (name__unit)
  name: string; // display name (title-cased)
  quantity: number;
  unit: string;
  displayQuantity: string; // e.g. "500 g", "1.5 kg"
};

// ─── Normalization ─────────────────────────────────────────────────────────────

/**
 * Normalize a unit string to its canonical form.
 * Always returns lowercase.
 */
export function normalizeUnit(unit: string): string {
  const u = unit.trim().toLowerCase();
  const map: Record<string, string> = {
    // Mass
    g: "g",
    gr: "g",
    gram: "g",
    gramo: "g",
    gramos: "g",
    kg: "kg",
    kilo: "kg",
    kilos: "kg",
    kilogram: "kg",
    kilogramo: "kg",
    kilogramos: "kg",
    // Volume
    ml: "ml",
    mililitro: "ml",
    mililitros: "ml",
    l: "l",
    lt: "l",
    liter: "l",
    litre: "l",
    litro: "l",
    litros: "l",
    // Spoons
    tsp: "tsp",
    "cucharadita": "tsp",
    "cucharaditas": "tsp",
    tbsp: "tbsp",
    "cucharada": "tbsp",
    "cucharadas": "tbsp",
    // Other
    cup: "cup",
    taza: "cup",
    tazas: "cup",
    unit: "unit",
    units: "unit",
    unidad: "unit",
    unidades: "unit",
    ud: "unit",
    uds: "unit",
    pinch: "pinch",
    pizca: "pinch",
    "to taste": "to taste",
    "al gusto": "to taste",
  };
  return map[u] ?? u;
}

/**
 * Convert quantity to a canonical base unit for aggregation.
 * Returns { quantity, unit } in the canonical unit.
 *
 * Conversions:
 *   kg → g (×1000)
 *   l  → ml (×1000)
 * Others stay as-is.
 */
export function toBaseUnit(quantity: number, unit: string): { quantity: number; unit: string } {
  const u = normalizeUnit(unit);
  if (u === "kg") return { quantity: quantity * 1000, unit: "g" };
  if (u === "l") return { quantity: quantity * 1000, unit: "ml" };
  return { quantity, unit: u };
}

/**
 * Normalize an ingredient name: lowercase, trim, collapse whitespace.
 */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Generate the persistence key for a shopping item.
 * Format: "{normalizedName}__{canonicalUnit}"
 */
export function ingredientKey(name: string, unit: string): string {
  const { unit: baseUnit } = toBaseUnit(1, unit);
  return `${normalizeName(name)}__${baseUnit}`;
}

// ─── Display formatting ────────────────────────────────────────────────────────

/**
 * Format a quantity for display:
 * - Remove unnecessary decimals
 * - Large g values → kg (if ≥ 1000g)
 * - Large ml values → l (if ≥ 1000ml)
 */
export function formatQuantity(quantity: number, unit: string): { quantity: string; unit: string } {
  let q = quantity;
  let u = unit;

  if (u === "g" && q >= 1000) {
    q = q / 1000;
    u = "kg";
  } else if (u === "ml" && q >= 1000) {
    q = q / 1000;
    u = "l";
  }

  // Round to at most 2 decimal places, removing trailing zeros
  const rounded = Math.round(q * 100) / 100;
  const formatted = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2).replace(/\.?0+$/, "");

  return { quantity: formatted, unit: u };
}

/**
 * Title-case a string (capitalize first letter of each word).
 */
function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

export type PlannedIngredient = {
  name: string;
  quantity: number; // per 1 serving
  unit: string;
  totalServings: number; // across all persons for this meal
};

/**
 * Aggregate a list of planned ingredients into shopping items.
 * Groups by (normalizedName, baseUnit).
 */
export function aggregateShoppingList(ingredients: PlannedIngredient[]): ShoppingItem[] {
  const map = new Map<string, { name: string; quantity: number; unit: string }>();

  for (const ing of ingredients) {
    const { quantity: baseQty, unit: baseUnit } = toBaseUnit(
      ing.quantity * ing.totalServings,
      ing.unit
    );
    const key = `${normalizeName(ing.name)}__${baseUnit}`;

    if (map.has(key)) {
      map.get(key)!.quantity += baseQty;
    } else {
      map.set(key, {
        name: normalizeName(ing.name),
        quantity: baseQty,
        unit: baseUnit,
      });
    }
  }

  return Array.from(map.entries())
    .map(([key, { name, quantity, unit }]) => {
      const { quantity: displayQty, unit: displayUnit } = formatQuantity(quantity, unit);
      return {
        key,
        name: titleCase(name),
        quantity,
        unit,
        displayQuantity: `${displayQty} ${displayUnit}`,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
