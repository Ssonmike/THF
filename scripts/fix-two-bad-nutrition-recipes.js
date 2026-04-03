#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function replaceIngredients(tx, recipeId, ingredients) {
  await tx.recipeIngredient.deleteMany({ where: { recipeId } });
  await tx.recipe.update({
    where: { id: recipeId },
    data: {
      ingredients: {
        create: ingredients,
      },
    },
  });
}

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.recipe.update({
      where: { id: 'cmng8xyhg00187m561vowb0vs' },
      data: {
        name: 'Pancakes proteicos con fresas',
        instructions: [
          '1. Mezcla harina de avena, huevos y proteína hasta obtener una masa homogénea.',
          '2. Cocina los pancakes en una sartén antiadherente a fuego medio por ambos lados.',
          '3. Sirve con fresas por encima y un poco de sirope 0%.',
        ].join('\n'),
        prepTime: 10,
        cookTime: 10,
      },
    });

    await replaceIngredients(tx, 'cmng8xyhg00187m561vowb0vs', [
      { name: 'harina de avena', quantity: 50, unit: 'g' },
      { name: 'huevo', quantity: 2, unit: 'unit' },
      { name: 'proteína en polvo', quantity: 1, unit: 'scoop' },
      { name: 'fresas', quantity: 1, unit: 'unit' },
      { name: 'sirope 0%', quantity: 1, unit: 'unit' },
    ]);

    await tx.recipe.update({
      where: { id: 'cmng8xygg000p7m56hai40th1' },
      data: {
        name: 'Tortilla de claras rellena de atún',
        instructions: [
          '1. Bate las claras con el huevo entero y prepara una tortilla en sartén antiadherente.',
          '2. Rellena la tortilla con atún y acompaña con ensalada al lado.',
          '3. Sirve recién hecha.',
        ].join('\n'),
        prepTime: 10,
        cookTime: 10,
      },
    });

    await replaceIngredients(tx, 'cmng8xygg000p7m56hai40th1', [
      { name: 'claras de huevo', quantity: 5, unit: 'unit' },
      { name: 'huevo', quantity: 1, unit: 'unit' },
      { name: 'atún', quantity: 1, unit: 'unit' },
      { name: 'ensalada', quantity: 1, unit: 'unit' },
    ]);
  });

  const recipes = await prisma.recipe.findMany({
    where: { id: { in: ['cmng8xyhg00187m561vowb0vs', 'cmng8xygg000p7m56hai40th1'] } },
    include: { ingredients: true },
  });

  console.log(JSON.stringify(recipes.map((r) => ({
    id: r.id,
    name: r.name,
    ingredients: r.ingredients.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
    instructions: r.instructions,
  })), null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
