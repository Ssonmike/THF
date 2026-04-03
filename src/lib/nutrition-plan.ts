export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export type DayPlan = {
  day: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snack?: string;
};

export type StructuredRecipe = {
  name: string;
  mealType: MealType;
  description?: string;
  instructions: string;
  prepTime?: number;
  cookTime?: number;
  caloriesPerServing?: number;
  proteinPerServing?: number;
  carbsPerServing?: number;
  fatPerServing?: number;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
};

export const DAY_ORDER = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
export const AUTO_DESCRIPTION = "Creada automáticamente desde el plan nutricional.";


const MEAL_NOTES_PATTERNS = [
  /\*MEAL PREP:[^*]*\*/gi,
  /\*MEAL PREP[^*]*\*/gi,
  /MEAL PREP:\s*[^|]+/gi,
  /MEAL PREP\s*:\s*[^.]+\.?/gi,
  /Te prometo que[^|.]+[.]?/gi,
  /\p{Extended_Pictographic}+/gu,
];

function stripMealNotes(value: string) {
  if (!value) return value;
  let result = value;
  for (const pattern of MEAL_NOTES_PATTERNS) {
    result = result.replace(pattern, " ");
  }

  return result
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function stripOuterParens(value: string) {
  let result = value.trim();
  while (result.startsWith("(") && result.endsWith(")")) {
    result = result.slice(1, -1).trim();
  }
  return result;
}

function sanitizeIngredientName(value: string) {
  const cleaned = stripOuterParens(
    value
      .replace(/\*+/g, " ")
      .replace(/[_`~]+/g, " ")
      .replace(/(?:meal prep|batch cooked?|haz\s+\d+[^,.]*|cocina\s+\d+[^,.]*)/gi, " ")
      .replace(/(?:te prometo que[^,.]*)/gi, " ")
      .replace(/[.!]+$/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );

  return cleaned;
}


function normalizeDay(input: string) {
  return input.toLowerCase().trim();
}

function stripMarkdown(line: string) {
  return sanitizeIngredientName(line).replace(/^[-*]\s*/, "").trim();
}

function cleanMealLine(line: string) {
  return stripMealNotes(
    stripMarkdown(line).replace(/^(desayuno|comida|almuerzo|cena|postre|snack|merienda)\s*[:\-–]?\s*/i, "")
  );
}

export function parseWeeklyPlan(content: string): DayPlan[] {
  const lines = content.split("\n");
  const days: DayPlan[] = [];
  let current: DayPlan | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const normalizedLine = stripMarkdown(line);
    const dayMatch = normalizedLine.match(/^(?:###\s*)?(lunes|martes|miércoles|jueves|viernes|sábado|domingo)\b/i);
    if (dayMatch) {
      if (current) days.push(current);
      current = { day: normalizeDay(dayMatch[1]) };
      continue;
    }

    if (!current) continue;

    if (/^desayuno\s*:/i.test(normalizedLine)) current.breakfast = cleanMealLine(normalizedLine);
    else if (/^(comida|almuerzo)\s*:/i.test(normalizedLine)) current.lunch = cleanMealLine(normalizedLine);
    else if (/^cena\s*:/i.test(normalizedLine)) current.dinner = cleanMealLine(normalizedLine);
    else if (/^(postre|snack|merienda)\s*:/i.test(normalizedLine)) current.snack = cleanMealLine(normalizedLine);
  }

  if (current) days.push(current);
  return days.filter((d) => DAY_ORDER.includes(d.day));
}

function cleanTitlePart(value: string) {
  return stripMealNotes(value)
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(?:versi[oó]n fit|fit)\b/gi, " ")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:kcal|kcals|cal|g|gr|gramos?|kg|ml|l|cl|unidad(?:es)?|u\.?|cucharadas?|cucharaditas?|scoop|taza?s?)\b/gi, " ")
    .replace(/[+|/]/g, " ")
    .replace(/[:;,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeIngredientName(value: string) {
  return sanitizeIngredientName(value)
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(?:de|del|la|el|los|las|unos?|unas?)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function singularizeIngredient(name: string) {
  const trimmed = name.trim();
  const keepPlural = [
    "arándanos",
    "copos",
    "frutos rojos",
    "frutos secos",
    "espinacas",
    "lentejas",
    "garbanzos",
    "judías",
    "guisantes",
    "setas",
    "verduras",
    "toppings",
  ];

  if (keepPlural.includes(trimmed)) return trimmed;
  if (trimmed.endsWith("es") && trimmed.length > 4 && !trimmed.endsWith("nes")) return trimmed.slice(0, -2);
  if (trimmed.endsWith("s") && trimmed.length > 3 && !trimmed.endsWith("as") && !trimmed.endsWith("os")) return trimmed.slice(0, -1);
  return trimmed;
}

function removeNutritionSuffixes(text: string) {
  return stripMealNotes(text)
    .replace(/\|.*$/g, "")
    .replace(/[-–—]?\s*\d{2,4}\s*kcal.*$/i, "")
    .replace(/[-–—]?\s*\d{1,3}\s*g\s*(?:de\s*)?(?:prote[ií]na|prot|carbohidratos|hidratos|carbs|grasas?|fat).*$/i, "")
    .trim();
}

function splitMealParts(mealText: string) {
  const source = removeNutritionSuffixes(mealText);
  const [titleMaybe, restMaybe] = source.split(/:\s*/, 2);

  if (restMaybe) {
    return {
      lead: cleanTitlePart(titleMaybe),
      ingredientZone: restMaybe,
    };
  }

  return {
    lead: cleanTitlePart(source.split(/[+|]/)[0] ?? source),
    ingredientZone: source,
  };
}

function wordToQuantity(word?: string) {
  switch ((word ?? "").toLowerCase()) {
    case "un":
    case "una":
    case "uno":
      return 1;
    case "dos":
      return 2;
    case "tres":
      return 3;
    case "cuatro":
      return 4;
    default:
      return 1;
  }
}

function normalizeUnit(unit?: string) {
  const value = (unit ?? "unit").toLowerCase();
  if (["g", "gr", "gramo", "gramos"].includes(value)) return "g";
  if (["kg", "kilo", "kilos"].includes(value)) return "kg";
  if (["ml"].includes(value)) return "ml";
  if (["l", "lt", "litro", "litros"].includes(value)) return "l";
  if (["cl"].includes(value)) return "ml";
  if (["tsp", "cucharadita", "cucharaditas"].includes(value)) return "tsp";
  if (["tbsp", "cucharada", "cucharadas"].includes(value)) return "tbsp";
  if (["cup", "cups", "taza", "tazas"].includes(value)) return "cup";
  if (["scoop", "scoops"].includes(value)) return "scoop";
  return "unit";
}

function parseIngredientChunk(chunk: string) {
  const cleaned = chunk
    .replace(/^[\-•*]\s*/, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/(?:meal prep|batch cooked?|bajo en calorías|alto en proteína)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return null;

  const quantityMatch = cleaned.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|gr|ml|l|cl|tsp|tbsp|cup|cups|unidad(?:es)?|uds?|u\.?|scoop|scoops|cucharada(?:s)?|cucharadita(?:s)?)?\s+(.*)$/i);
  const halfMatch = cleaned.match(/^(media|medio)\s+(.*)$/i);
  const articleMatch = cleaned.match(/^(un|una|uno|dos|tres|cuatro)\s+(.*)$/i);

  let quantity = 1;
  let unit = "unit";
  let name = cleaned;

  if (quantityMatch) {
    quantity = Number(quantityMatch[1].replace(",", "."));
    unit = normalizeUnit(quantityMatch[2]);
    name = quantityMatch[3].trim();
  } else if (halfMatch) {
    quantity = 0.5;
    name = halfMatch[2].trim();
  } else if (articleMatch) {
    quantity = wordToQuantity(articleMatch[1]);
    name = articleMatch[2].trim();
  }

  name = singularizeIngredient(normalizeIngredientName(name));
  name = sanitizeIngredientName(name);
  if (!name) return null;

  return { name, quantity, unit };
}

export function extractIngredients(mealText: string) {
  const { ingredientZone } = splitMealParts(mealText);
  const parts = ingredientZone
    .split(/[+•·]/)
    .map((part) => part.trim())
    .filter(Boolean);

  const parsed = parts
    .map(parseIngredientChunk)
    .filter((value): value is NonNullable<typeof value> => Boolean(value));

  const deduped = parsed.filter((ingredient, index, arr) =>
    arr.findIndex((candidate) => candidate.name === ingredient.name) === index
  );

  if (deduped.length > 0) return deduped.slice(0, 12);

  const fallbackName = singularizeIngredient(normalizeIngredientName(splitMealParts(mealText).lead || "ingrediente principal"));
  return [{ name: fallbackName || "ingrediente principal", quantity: 1, unit: "unit" }];
}

function humanizeRecipeTitle(text: string) {
  return sanitizeIngredientName(stripMealNotes(text))
    .replace(/proteina/gi, "proteína")
    .replace(/andanos/gi, "arándanos")
    .replace(/yogur/gi, "yogur")
    .replace(/\s+/g, " ")
    .replace(/[.:;,]+$/g, "")
    .trim();
}

export function buildRecipeName(mealText: string) {
  const { lead, ingredientZone } = splitMealParts(mealText);
  const parsedIngredients = extractIngredients(mealText).map((ing) => ing.name);
  const topIngredients = parsedIngredients
    .filter((name) => !/(agua|sal|pimienta|aceite)/i.test(name))
    .slice(0, 4);

  const normalizedLead = humanizeRecipeTitle(lead)
    .replace(/\s+/g, " ")
    .trim();

  if (normalizedLead) {
    const leadWords = new Set(normalizedLead.toLowerCase().split(/\s+/).filter(Boolean));
    const extra = topIngredients.filter((name) => {
      const nameWords = name.toLowerCase().split(/\s+/).filter(Boolean);
      return !nameWords.every((word) => leadWords.has(word));
    });

    if (extra.length === 1 && /(avena proteica|pudding|batido|smoothie|ensalada|sándwich|sandwich|wrap|tortilla|hamburguesa|pizza)/i.test(normalizedLead)) {
      return normalizedLead.slice(0, 120);
    }

    if (extra.length > 0 && normalizedLead.split(/\s+/).length <= 4) {
      return humanizeRecipeTitle(`${normalizedLead} con ${extra.slice(0, 2).join(" y ")}`).slice(0, 120);
    }

    return normalizedLead.slice(0, 120);
  }

  const ingredientLead = cleanTitlePart(ingredientZone);
  return humanizeRecipeTitle(ingredientLead || "Receta nutritiva").slice(0, 120);
}

function inferPrepAndCookTime(mealText: string, mealType: MealType) {
  const text = mealText.toLowerCase();
  let prepTime = mealType === "BREAKFAST" ? 5 : 10;
  let cookTime = mealType === "BREAKFAST" ? 5 : 15;

  if (/horno|asad|gratina/.test(text)) cookTime = 25;
  else if (/ensalada|yogur|batido|overnight|fruta/.test(text)) cookTime = 0;
  else if (/saltead|plancha|tortilla|revuelto/.test(text)) cookTime = 10;
  else if (/guiso|crema|arroz|pasta/.test(text)) cookTime = 20;

  if (/meal prep|batch|preparado/.test(text)) prepTime += 5;

  return { prepTime, cookTime };
}

function extractNutrition(mealText: string) {
  const calories = mealText.match(/(\d{2,4})\s*kcal/i);
  const protein = mealText.match(/(\d{1,3})\s*g\s*(?:de\s*)?(?:prote[ií]na|prot)/i);
  const carbs = mealText.match(/(\d{1,3})\s*g\s*(?:de\s*)?(?:carbohidratos|hidratos|carbs)/i);
  const fat = mealText.match(/(\d{1,3})\s*g\s*(?:de\s*)?(?:grasas|grasa|fat)/i);

  return {
    caloriesPerServing: calories ? Number(calories[1]) : undefined,
    proteinPerServing: protein ? Number(protein[1]) : undefined,
    carbsPerServing: carbs ? Number(carbs[1]) : undefined,
    fatPerServing: fat ? Number(fat[1]) : undefined,
  };
}

function formatIngredientList(ingredients: StructuredRecipe["ingredients"]) {
  return ingredients
    .map((ing) => ing.name)
    .slice(0, 6)
    .join(", ");
}

function buildInstructions(name: string, ingredients: StructuredRecipe["ingredients"], mealText: string, mealType: MealType) {
  const ingredientList = formatIngredientList(ingredients);
  const lower = mealText.toLowerCase();

  const steps = [`Prepara y mide los ingredientes: ${ingredientList}.`];

  if (/overnight|avena/.test(lower)) {
    steps.push("Mezcla la avena con la leche y la proteína hasta que no queden grumos.");
    steps.push("Calienta unos minutos o deja reposar la mezcla, según prefieras una textura caliente o tipo overnight oats.");
    steps.push("Añade la fruta o toppings al final y sirve.");
  } else if (/ensalada/.test(lower)) {
    steps.push("Corta y prepara los ingredientes principales en trozos cómodos para comer.");
    steps.push("Mezcla todo en un bol, aliña al gusto y sirve al momento.");
  } else if (/batido|smoothie/.test(lower)) {
    steps.push("Introduce los ingredientes en la batidora empezando por los líquidos.");
    steps.push("Tritura hasta obtener una textura homogénea y sirve bien frío.");
  } else if (/tortilla|revuelto/.test(lower)) {
    steps.push("Bate o mezcla los ingredientes principales mientras calientas una sartén con unas gotas de aceite.");
    steps.push("Cocina a fuego medio hasta que esté cuajado a tu gusto y sirve recién hecho.");
  } else {
    steps.push("Combina los ingredientes principales siguiendo el orden lógico de cocción y sazona al gusto.");
    steps.push("Cocina hasta que los ingredientes estén hechos y la textura sea la adecuada.");
  }

  if (mealType === "SNACK") {
    steps.push("Sirve en una ración individual para dejar el snack listo y evitar picar de más.");
  } else {
    steps.push(`Emplata ${name.toLowerCase()} y ajusta sal, especias o toppings antes de servir.`);
  }

  return steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
}

export function structureRecipeDeterministic(mealText: string, mealType: MealType): StructuredRecipe {
  const ingredients = extractIngredients(mealText);
  const name = buildRecipeName(mealText);
  const { prepTime, cookTime } = inferPrepAndCookTime(mealText, mealType);

  return {
    name,
    mealType,
    description: AUTO_DESCRIPTION,
    instructions: buildInstructions(name, ingredients, mealText, mealType),
    prepTime,
    cookTime,
    ...extractNutrition(mealText),
    ingredients,
  };
}
