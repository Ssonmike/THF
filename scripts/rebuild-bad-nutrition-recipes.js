#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const AUTO_DESCRIPTION = 'Creada automáticamente desde el plan nutricional.';
const DAY_ORDER = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];

function stripMarkdown(line) {
  return String(line || '').replace(/\*+/g, ' ').replace(/^[-*]\s*/, '').trim();
}
function stripMealNotes(value) {
  return String(value || '')
    .replace(/\*+/g, ' ')
    .replace(/[_`~]+/g, ' ')
    .replace(/te prometo que[^|.]*(?:\.|$)/gi, ' ')
    .replace(/meal\s*prep[^|.]*(?:\.|$)/gi, ' ')
    .replace(/(?:haz\s+\d+[^,.|]*|cocina\s+\d+[^,.|]*)/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();
}
function cleanMealLine(line) {
  return stripMealNotes(stripMarkdown(line).replace(/^(desayuno|comida|almuerzo|cena|postre|snack|merienda)\s*[:\-–]?\s*/i, ''));
}
function parseWeeklyPlan(content) {
  const lines = content.split('\n');
  const days = [];
  let current = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const normalizedLine = stripMarkdown(line);
    const m = normalizedLine.match(/^(?:###\s*)?(lunes|martes|miércoles|jueves|viernes|sábado|domingo)\b/i);
    if (m) {
      if (current) days.push(current);
      current = { day: m[1].toLowerCase() };
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
function cleanTitlePart(value) {
  return stripMealNotes(value)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:kcal|kcals|cal|g|gr|gramos?|kg|ml|l|cl|unidad(?:es)?|u\.?|cucharadas?|cucharaditas?|scoop|taza?s?)\b/gi, ' ')
    .replace(/[+|/]/g, ' ')
    .replace(/[:;,]/g, ' ')
    .replace(/\b(?:versi[oó]n fit|fit)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function sanitizeIngredientName(value) {
  return String(value || '')
    .replace(/\*+/g, ' ')
    .replace(/[_`~]+/g, ' ')
    .replace(/(?:meal prep|batch cooked?|haz\s+\d+[^,.]*|cocina\s+\d+[^,.]*)/gi, ' ')
    .replace(/(?:te prometo que[^,.]*)/gi, ' ')
    .replace(/[.!]+$/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function normalizeIngredientName(value) {
  return sanitizeIngredientName(value)
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(?:de|del|la|el|los|las|unos?|unas?)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function singularizeIngredient(name) {
  const trimmed = name.trim();
  const keepPlural = ['arándanos','copos','frutos rojos','frutos secos','espinacas','lentejas','garbanzos','judías','guisantes','setas','verduras','toppings'];
  if (keepPlural.includes(trimmed)) return trimmed;
  if (trimmed.endsWith('es') && trimmed.length > 4 && !trimmed.endsWith('nes')) return trimmed.slice(0, -2);
  if (trimmed.endsWith('s') && trimmed.length > 3 && !trimmed.endsWith('as') && !trimmed.endsWith('os')) return trimmed.slice(0, -1);
  return trimmed;
}
function removeNutritionSuffixes(text) {
  return stripMealNotes(text)
    .replace(/\|.*$/g, '')
    .replace(/[-–—]?\s*\d{2,4}\s*kcal.*$/i, '')
    .replace(/[-–—]?\s*\d{1,3}\s*g\s*(?:de\s*)?(?:prote[ií]na|prot|carbohidratos|hidratos|carbs|grasas?|fat).*$/i, '')
    .trim();
}
function splitMealParts(mealText) {
  const source = removeNutritionSuffixes(mealText);
  const [titleMaybe, restMaybe] = source.split(/:\s*/, 2);
  if (restMaybe) return { lead: cleanTitlePart(titleMaybe), ingredientZone: restMaybe };
  return { lead: cleanTitlePart(source.split(/[+|]/)[0] ?? source), ingredientZone: source };
}
function wordToQuantity(word) {
  switch ((word ?? '').toLowerCase()) {
    case 'un': case 'una': case 'uno': return 1;
    case 'dos': return 2;
    case 'tres': return 3;
    case 'cuatro': return 4;
    default: return 1;
  }
}
function normalizeUnit(unit) {
  const value = (unit ?? 'unit').toLowerCase();
  if (['g','gr','gramo','gramos'].includes(value)) return 'g';
  if (['kg','kilo','kilos'].includes(value)) return 'kg';
  if (['ml'].includes(value)) return 'ml';
  if (['l','lt','litro','litros'].includes(value)) return 'l';
  if (['cl'].includes(value)) return 'ml';
  if (['tsp','cucharadita','cucharaditas'].includes(value)) return 'tsp';
  if (['tbsp','cucharada','cucharadas'].includes(value)) return 'tbsp';
  if (['cup','cups','taza','tazas'].includes(value)) return 'cup';
  if (['scoop','scoops'].includes(value)) return 'scoop';
  return 'unit';
}
function parseIngredientChunk(chunk) {
  const cleaned = chunk
    .replace(/^[\-•*]\s*/, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/(?:meal prep|batch cooked?|bajo en calorías|alto en proteína)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return null;
  const quantityMatch = cleaned.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|gr|ml|l|cl|tsp|tbsp|cup|cups|unidad(?:es)?|uds?|u\.?|scoop|scoops|cucharada(?:s)?|cucharadita(?:s)?)?\s+(.*)$/i);
  const halfMatch = cleaned.match(/^(media|medio)\s+(.*)$/i);
  const articleMatch = cleaned.match(/^(un|una|uno|dos|tres|cuatro)\s+(.*)$/i);
  let quantity = 1;
  let unit = 'unit';
  let name = cleaned;
  if (quantityMatch) {
    quantity = Number(quantityMatch[1].replace(',', '.'));
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
function extractIngredients(mealText) {
  const { ingredientZone } = splitMealParts(mealText);
  const parts = ingredientZone.split(/[+•·]/).map((part) => part.trim()).filter(Boolean);
  const parsed = parts.map(parseIngredientChunk).filter(Boolean);
  const deduped = parsed.filter((ingredient, index, arr) => arr.findIndex((candidate) => candidate.name === ingredient.name) === index);
  if (deduped.length > 0) return deduped.slice(0, 12);
  const fallbackName = singularizeIngredient(normalizeIngredientName(splitMealParts(mealText).lead || 'ingrediente principal'));
  return [{ name: fallbackName || 'ingrediente principal', quantity: 1, unit: 'unit' }];
}
function humanizeRecipeTitle(text) {
  return sanitizeIngredientName(stripMealNotes(text))
    .replace(/proteina/gi, 'proteína')
    .replace(/andanos/gi, 'arándanos')
    .replace(/yogur/gi, 'yogur')
    .replace(/\s+/g, ' ')
    .replace(/[.:;,]+$/g, '')
    .trim();
}
function buildRecipeName(mealText) {
  const { lead, ingredientZone } = splitMealParts(mealText);
  const parsedIngredients = extractIngredients(mealText).map((ing) => ing.name);
  const topIngredients = parsedIngredients.filter((name) => !/(agua|sal|pimienta|aceite)/i.test(name)).slice(0, 4);
  const normalizedLead = humanizeRecipeTitle(lead).replace(/\s+/g, ' ').trim();
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
      return humanizeRecipeTitle(`${normalizedLead} con ${extra.slice(0, 2).join(' y ')}`).slice(0, 120);
    }
    return normalizedLead.slice(0, 120);
  }
  const ingredientLead = cleanTitlePart(ingredientZone);
  return humanizeRecipeTitle(ingredientLead || 'Receta nutritiva').slice(0, 120);
}
function inferPrepAndCookTime(mealText, mealType) {
  const text = mealText.toLowerCase();
  let prepTime = mealType === 'BREAKFAST' ? 5 : 10;
  let cookTime = mealType === 'BREAKFAST' ? 5 : 15;
  if (/horno|asad|gratina/.test(text)) cookTime = 25;
  else if (/ensalada|yogur|batido|overnight|fruta/.test(text)) cookTime = 0;
  else if (/saltead|plancha|tortilla|revuelto/.test(text)) cookTime = 10;
  else if (/guiso|crema|arroz|pasta/.test(text)) cookTime = 20;
  if (/meal prep|batch|preparado/.test(text)) prepTime += 5;
  return { prepTime, cookTime };
}
function extractNutrition(mealText) {
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
function formatIngredientList(ingredients) {
  return ingredients.map((ing) => ing.name).slice(0, 6).join(', ');
}
function buildInstructions(name, ingredients, mealText, mealType) {
  const ingredientList = formatIngredientList(ingredients);
  const lower = mealText.toLowerCase();
  const steps = [`Prepara y mide los ingredientes: ${ingredientList}.`];
  if (/overnight|avena/.test(lower)) {
    steps.push('Mezcla la avena con la leche y la proteína hasta que no queden grumos.');
    steps.push('Calienta unos minutos o deja reposar la mezcla, según prefieras una textura caliente o tipo overnight oats.');
    steps.push('Añade la fruta o toppings al final y sirve.');
  } else if (/ensalada/.test(lower)) {
    steps.push('Corta y prepara los ingredientes principales en trozos cómodos para comer.');
    steps.push('Mezcla todo en un bol, aliña al gusto y sirve al momento.');
  } else if (/batido|smoothie/.test(lower)) {
    steps.push('Introduce los ingredientes en la batidora empezando por los líquidos.');
    steps.push('Tritura hasta obtener una textura homogénea y sirve bien frío.');
  } else if (/tortilla|revuelto/.test(lower)) {
    steps.push('Bate o mezcla los ingredientes principales mientras calientas una sartén con unas gotas de aceite.');
    steps.push('Cocina a fuego medio hasta que esté cuajado a tu gusto y sirve recién hecho.');
  } else {
    steps.push('Combina los ingredientes principales siguiendo el orden lógico de cocción y sazona al gusto.');
    steps.push('Cocina hasta que los ingredientes estén hechos y la textura sea la adecuada.');
  }
  if (mealType === 'SNACK') steps.push('Sirve en una ración individual para dejar el snack listo y evitar picar de más.');
  else steps.push(`Emplata ${name.toLowerCase()} y ajusta sal, especias o toppings antes de servir.`);
  return steps.map((step, index) => `${index + 1}. ${step}`).join('\n');
}
function structureRecipeDeterministic(mealText, mealType) {
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
function isBadRecipe(recipe) {
  return /\*|meal prep|te prometo|haz \d|cocina \d|\([^)]*$/.test(recipe.name) || recipe.ingredients.some((ing) => /\*|meal prep|te prometo|haz \d|cocina \d|\([^)]*$/.test(ing.name));
}
async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const person = await prisma.person.findUnique({ where: { slug: 'miguel' }, include: { nutritionProfile: { include: { plan: true } } } });
  if (!person?.nutritionProfile?.plan?.content) throw new Error('No nutrition plan found for miguel');

  const badRecipes = await prisma.recipe.findMany({
    where: { description: AUTO_DESCRIPTION },
    include: { ingredients: true },
    orderBy: { updatedAt: 'desc' },
  });
  const targets = badRecipes.filter(isBadRecipe);
  const parsedPlan = parseWeeklyPlan(person.nutritionProfile.plan.content);

  let rebuilt = 0;
  for (const recipe of targets) {
    let match = null;
    for (const day of parsedPlan) {
      const entries = [
        ['BREAKFAST', day.breakfast],
        ['LUNCH', day.lunch],
        ['DINNER', day.dinner],
        ['SNACK', day.snack],
      ];
      for (const [slot, value] of entries) {
        if (!value || slot !== recipe.mealType) continue;
        const candidate = structureRecipeDeterministic(value, slot);
        if (candidate.name.toLowerCase().includes(recipe.name.toLowerCase().split(' ')[0])) {
          match = candidate;
          break;
        }
      }
      if (match) break;
    }
    if (!match) continue;

    rebuilt += 1;
    console.log(`\n${recipe.id}`);
    console.log(`  recipe: ${recipe.name} -> ${match.name}`);
    console.log(`  ingredients: ${recipe.ingredients.map((i) => i.name).join(', ')} -> ${match.ingredients.map((i) => i.name).join(', ')}`);

    if (dryRun) continue;

    await prisma.$transaction(async (tx) => {
      await tx.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });
      await tx.recipe.update({
        where: { id: recipe.id },
        data: {
          name: match.name,
          instructions: match.instructions,
          prepTime: match.prepTime ?? null,
          cookTime: match.cookTime ?? null,
          caloriesPerServing: match.caloriesPerServing ?? null,
          proteinPerServing: match.proteinPerServing ?? null,
          carbsPerServing: match.carbsPerServing ?? null,
          fatPerServing: match.fatPerServing ?? null,
          ingredients: {
            create: match.ingredients.map((ing) => ({ name: ing.name, quantity: ing.quantity > 0 ? ing.quantity : 1, unit: ing.unit || 'unit' })),
          },
        },
      });
    });
  }

  console.log(`\nDone. rebuilt=${rebuilt}, dryRun=${dryRun}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
