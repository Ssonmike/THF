#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const AUTO_DESCRIPTION = 'Creada automáticamente desde el plan nutricional.';

function normalizeSpaces(value) {
  return value.replace(/\s{2,}/g, ' ').replace(/\s+([,.;:])/g, '$1').trim();
}

function cleanText(value) {
  let result = String(value || '');
  result = result.replace(/\*+/g, ' ');
  result = result.replace(/[_`~]+/g, ' ');
  result = result.replace(/te prometo que[^,.|]*/gi, ' ');
  result = result.replace(/meal\s*prep[^|.]*(?:[.]|$)?/gi, ' ');
  result = result.replace(/(?:haz\s+\d+[^,.|]*|cocina\s+\d+[^,.|]*)/gi, ' ');
  result = normalizeSpaces(result);
  result = result.replace(/\s+\.\s*/g, '. ');
  result = result.replace(/[.:;,]+$/g, '');
  result = normalizeSpaces(result);
  return result;
}

function cleanIngredientName(value) {
  const cleaned = cleanText(value)
    .replace(/^\d+(?:[.,]\d+)?\s*(?:g|gr|kg|ml|l|cl)\b/gi, '')
    .replace(/^\(?\s*/, '')
    .replace(/\s*\)?$/, '')
    .trim();

  if (!cleaned || /^[.]+$/.test(cleaned)) return '';
  return cleaned;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const recipes = await prisma.recipe.findMany({
    where: { description: AUTO_DESCRIPTION },
    include: { ingredients: true },
    orderBy: { updatedAt: 'desc' },
  });

  let changedRecipes = 0;
  let changedIngredients = 0;

  for (const recipe of recipes) {
    const nextName = cleanText(recipe.name);
    const recipeNeedsChange = nextName && nextName !== recipe.name;

    const ingredientChanges = recipe.ingredients
      .map((ingredient) => ({
        id: ingredient.id,
        from: ingredient.name,
        to: cleanIngredientName(ingredient.name),
      }))
      .filter((item) => item.to !== item.from);

    if (!recipeNeedsChange && ingredientChanges.length === 0) continue;

    changedRecipes += recipeNeedsChange ? 1 : 0;
    changedIngredients += ingredientChanges.length;

    console.log(`\n${recipe.id}`);
    if (recipeNeedsChange) console.log(`  recipe: ${recipe.name}  ->  ${nextName}`);
    for (const change of ingredientChanges) {
      console.log(`  ingredient: ${change.from}  ->  ${change.to || '[delete]'}`);
    }

    if (dryRun) continue;

    if (recipeNeedsChange) {
      await prisma.recipe.update({ where: { id: recipe.id }, data: { name: nextName } });
    }
    for (const change of ingredientChanges) {
      if (!change.to) {
        await prisma.recipeIngredient.delete({ where: { id: change.id } });
      } else {
        await prisma.recipeIngredient.update({ where: { id: change.id }, data: { name: change.to } });
      }
    }
  }

  console.log(`\nDone. recipes changed=${changedRecipes}, ingredients changed=${changedIngredients}, dryRun=${dryRun}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
