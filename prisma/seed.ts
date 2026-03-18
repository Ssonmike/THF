import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create persons
  const miguel = await prisma.person.upsert({
    where: { slug: "miguel" },
    update: {},
    create: { name: "Miguel", slug: "miguel" },
  });

  const ana = await prisma.person.upsert({
    where: { slug: "ana" },
    update: {},
    create: { name: "Ana", slug: "ana" },
  });

  console.log("✓ Persons created:", miguel.name, ana.name);

  // Create sample recipes
  const tortilla = await prisma.recipe.upsert({
    where: { id: "recipe-tortilla" },
    update: {},
    create: {
      id: "recipe-tortilla",
      name: "Tortilla española",
      description: "Tortilla clásica con cebolla, suave y jugosa.",
      mealType: "LUNCH",
      prepTime: 15,
      cookTime: 20,
      instructions:
        "1. Pela y corta las patatas en láminas finas. Corta la cebolla en juliana.\n2. Calienta abundante aceite en una sartén y pocha las patatas con la cebolla a fuego medio-bajo durante 20 min.\n3. Escurre el aceite. Bate los huevos con sal y mezcla con las patatas.\n4. Cuaja la tortilla a fuego medio por ambos lados.",
      caloriesPerServing: 380,
      proteinPerServing: 14,
      carbsPerServing: 28,
      fatPerServing: 22,
      ingredients: {
        create: [
          { name: "patatas", quantity: 300, unit: "g" },
          { name: "huevos", quantity: 3, unit: "unit" },
          { name: "cebolla", quantity: 100, unit: "g" },
          { name: "aceite de oliva", quantity: 50, unit: "ml" },
          { name: "sal", quantity: 1, unit: "tsp" },
        ],
      },
    },
  });

  const lentejas = await prisma.recipe.upsert({
    where: { id: "recipe-lentejas" },
    update: {},
    create: {
      id: "recipe-lentejas",
      name: "Lentejas con verduras",
      description: "Lentejas caseras con zanahoria, puerro y chorizo.",
      mealType: "LUNCH",
      prepTime: 10,
      cookTime: 35,
      instructions:
        "1. Sofríe la cebolla, zanahoria y puerro cortados. Añade el chorizo en rodajas.\n2. Agrega las lentejas lavadas y cubre con agua o caldo.\n3. Cocina a fuego medio 30-35 min hasta que estén tiernas. Ajusta sal.",
      caloriesPerServing: 320,
      proteinPerServing: 18,
      carbsPerServing: 42,
      fatPerServing: 8,
      ingredients: {
        create: [
          { name: "lentejas", quantity: 100, unit: "g" },
          { name: "zanahoria", quantity: 80, unit: "g" },
          { name: "puerro", quantity: 60, unit: "g" },
          { name: "cebolla", quantity: 60, unit: "g" },
          { name: "chorizo", quantity: 40, unit: "g" },
          { name: "aceite de oliva", quantity: 15, unit: "ml" },
          { name: "sal", quantity: 1, unit: "tsp" },
        ],
      },
    },
  });

  const avena = await prisma.recipe.upsert({
    where: { id: "recipe-avena" },
    update: {},
    create: {
      id: "recipe-avena",
      name: "Porridge de avena con plátano",
      description: "Desayuno nutritivo y saciante.",
      mealType: "BREAKFAST",
      prepTime: 2,
      cookTime: 5,
      instructions:
        "1. Mezcla la avena con la leche en un cazo y calienta a fuego medio.\n2. Remueve hasta obtener consistencia cremosa.\n3. Sirve con plátano en rodajas y un chorrito de miel.",
      caloriesPerServing: 290,
      proteinPerServing: 9,
      carbsPerServing: 50,
      fatPerServing: 6,
      ingredients: {
        create: [
          { name: "copos de avena", quantity: 60, unit: "g" },
          { name: "leche", quantity: 200, unit: "ml" },
          { name: "plátano", quantity: 1, unit: "unit" },
          { name: "miel", quantity: 10, unit: "g" },
        ],
      },
    },
  });

  const ensalada = await prisma.recipe.upsert({
    where: { id: "recipe-ensalada" },
    update: {},
    create: {
      id: "recipe-ensalada",
      name: "Ensalada de pollo a la plancha",
      description: "Ensalada ligera con pechuga de pollo, tomate y aguacate.",
      mealType: "DINNER",
      prepTime: 10,
      cookTime: 10,
      instructions:
        "1. Marca la pechuga de pollo a la plancha con sal y pimienta. Deja reposar y corta en tiras.\n2. Mezcla la lechuga, tomate cherry y aguacate en un bol.\n3. Añade el pollo y aliña con aceite, limón y sal.",
      caloriesPerServing: 310,
      proteinPerServing: 32,
      carbsPerServing: 8,
      fatPerServing: 16,
      ingredients: {
        create: [
          { name: "pechuga de pollo", quantity: 150, unit: "g" },
          { name: "lechuga", quantity: 80, unit: "g" },
          { name: "tomate cherry", quantity: 100, unit: "g" },
          { name: "aguacate", quantity: 60, unit: "g" },
          { name: "aceite de oliva", quantity: 15, unit: "ml" },
          { name: "limón", quantity: 0.5, unit: "unit" },
          { name: "sal", quantity: 1, unit: "tsp" },
        ],
      },
    },
  });

  console.log("✓ Recipes created:", tortilla.name, lentejas.name, avena.name, ensalada.name);
  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
