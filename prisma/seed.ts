import { DayOfWeek, MealType, PrismaClient } from "@prisma/client";
import { startOfWeek } from "date-fns";

const prisma = new PrismaClient();

type SeedRecipe = {
  name: string;
  slug: string;
  mealType: MealType;
  description: string;
  instructions: string;
  notes?: string;
  isFavorite?: boolean;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  ingredients: Array<{
    itemName: string;
    quantity: number;
    unit: string;
    notes?: string;
  }>;
};

const recipes: SeedRecipe[] = [
  {
    name: "Pechuga de pollo con arroz y verduras",
    slug: "pechuga-pollo-arroz-verduras",
    mealType: MealType.LUNCH,
    description: "Un plato base muy fiable para comidas completas de diario.",
    instructions:
      "Cocina el arroz. Saltea las verduras. Marca el pollo a la plancha con sal, pimienta y un poco de aceite. Sirve todo junto.",
    nutrition: { calories: 540, protein: 43, carbs: 47, fats: 16 },
    ingredients: [
      { itemName: "Pechuga de pollo", quantity: 180, unit: "g" },
      { itemName: "Arroz", quantity: 70, unit: "g" },
      { itemName: "Brócoli", quantity: 120, unit: "g" },
      { itemName: "Zanahoria", quantity: 80, unit: "g" },
      { itemName: "Aceite de oliva", quantity: 1, unit: "tbsp" }
    ]
  },
  {
    name: "Tortilla con ensalada",
    slug: "tortilla-ensalada",
    mealType: MealType.DINNER,
    description: "Cena rápida, ligera y muy fácil de repetir durante la semana.",
    instructions:
      "Bate los huevos, cuaja la tortilla en sartén antiadherente y acompaña con ensalada aliñada.",
    nutrition: { calories: 410, protein: 24, carbs: 11, fats: 30 },
    ingredients: [
      { itemName: "Huevo", quantity: 3, unit: "unit" },
      { itemName: "Lechuga", quantity: 80, unit: "g" },
      { itemName: "Tomate", quantity: 120, unit: "g" },
      { itemName: "Aceite de oliva", quantity: 1, unit: "tbsp" }
    ]
  },
  {
    name: "Yogur con fruta y avena",
    slug: "yogur-fruta-avena",
    mealType: MealType.BREAKFAST,
    description: "Desayuno fresco, equilibrado y cómodo para días de trabajo.",
    instructions:
      "Sirve el yogur en un bol, añade avena, fruta troceada y remata con canela si te gusta.",
    nutrition: { calories: 360, protein: 20, carbs: 42, fats: 11 },
    ingredients: [
      { itemName: "Yogur griego natural", quantity: 200, unit: "g" },
      { itemName: "Avena", quantity: 40, unit: "g" },
      { itemName: "Plátano", quantity: 1, unit: "unit" },
      { itemName: "Frutos rojos", quantity: 80, unit: "g" }
    ]
  },
  {
    name: "Pasta con atún",
    slug: "pasta-atun",
    mealType: MealType.LUNCH,
    description: "Comida sencilla y muy útil para preparar con antelación.",
    instructions:
      "Cuece la pasta. Mezcla con atún, tomate y aceite de oliva. Ajusta con sal y orégano.",
    nutrition: { calories: 515, protein: 32, carbs: 53, fats: 18 },
    ingredients: [
      { itemName: "Pasta", quantity: 85, unit: "g" },
      { itemName: "Atún al natural", quantity: 100, unit: "g" },
      { itemName: "Tomate triturado", quantity: 120, unit: "g" },
      { itemName: "Cebolla", quantity: 50, unit: "g" },
      { itemName: "Aceite de oliva", quantity: 1, unit: "tbsp" }
    ]
  },
  {
    name: "Salmorejo con huevo y jamón",
    slug: "salmorejo-huevo-jamon",
    mealType: MealType.DINNER,
    description: "Cena fría muy práctica para semanas templadas.",
    instructions:
      "Tritura tomate, pan, aceite y ajo hasta lograr textura cremosa. Sirve con huevo cocido y jamón.",
    nutrition: { calories: 445, protein: 18, carbs: 28, fats: 28 },
    ingredients: [
      { itemName: "Tomate", quantity: 300, unit: "g" },
      { itemName: "Pan", quantity: 60, unit: "g" },
      { itemName: "Aceite de oliva", quantity: 25, unit: "ml" },
      { itemName: "Huevo", quantity: 1, unit: "unit" },
      { itemName: "Jamón serrano", quantity: 25, unit: "g" }
    ]
  }
];

async function main() {
  await prisma.plannedMealPortion.deleteMany();
  await prisma.plannedMeal.deleteMany();
  await prisma.weeklyPlan.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.person.deleteMany();

  const miguel = await prisma.person.create({
    data: { name: "Miguel", defaultPortionMultiplier: 1.1 }
  });

  const ana = await prisma.person.create({
    data: { name: "Ana", defaultPortionMultiplier: 0.85 }
  });

  const createdRecipes = await Promise.all(
    recipes.map((recipe) =>
      prisma.recipe.create({
        data: {
          name: recipe.name,
          slug: recipe.slug,
          mealType: recipe.mealType,
          description: recipe.description,
          instructions: recipe.instructions,
          notes: recipe.notes,
          isFavorite: recipe.isFavorite ?? false,
          nutritionCaloriesPerServing: recipe.nutrition.calories,
          nutritionProteinPerServing: recipe.nutrition.protein,
          nutritionCarbsPerServing: recipe.nutrition.carbs,
          nutritionFatsPerServing: recipe.nutrition.fats,
          ingredients: {
            create: recipe.ingredients.map((ingredient, index) => ({
              ...ingredient,
              sortOrder: index
            }))
          }
        }
      })
    )
  );

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  weekStart.setHours(0, 0, 0, 0);

  const weeklyPlan = await prisma.weeklyPlan.create({
    data: {
      weekStartDate: weekStart,
      notes: "Semana de ejemplo con comidas equilibradas para el MVP."
    }
  });

  const recipeMap = new Map(createdRecipes.map((recipe) => [recipe.slug, recipe.id]));

  const plannedMeals = [
    {
      dayOfWeek: DayOfWeek.MONDAY,
      mealSlot: MealType.BREAKFAST,
      slug: "yogur-fruta-avena",
      portions: [
        { personId: miguel.id, servings: 1.2 },
        { personId: ana.id, servings: 0.9 }
      ]
    },
    {
      dayOfWeek: DayOfWeek.MONDAY,
      mealSlot: MealType.LUNCH,
      slug: "pechuga-pollo-arroz-verduras",
      portions: [
        { personId: miguel.id, servings: 1.15 },
        { personId: ana.id, servings: 0.85 }
      ]
    },
    {
      dayOfWeek: DayOfWeek.MONDAY,
      mealSlot: MealType.DINNER,
      slug: "tortilla-ensalada",
      portions: [
        { personId: miguel.id, servings: 1.0 },
        { personId: ana.id, servings: 0.8 }
      ]
    },
    {
      dayOfWeek: DayOfWeek.TUESDAY,
      mealSlot: MealType.LUNCH,
      slug: "pasta-atun",
      portions: [
        { personId: miguel.id, servings: 1.1 },
        { personId: ana.id, servings: 0.8 }
      ]
    },
    {
      dayOfWeek: DayOfWeek.WEDNESDAY,
      mealSlot: MealType.DINNER,
      slug: "salmorejo-huevo-jamon",
      portions: [
        { personId: miguel.id, servings: 1.0 },
        { personId: ana.id, servings: 0.75 }
      ]
    },
    {
      dayOfWeek: DayOfWeek.FRIDAY,
      mealSlot: MealType.LUNCH,
      slug: "pechuga-pollo-arroz-verduras",
      portions: [
        { personId: miguel.id, servings: 1.25 },
        { personId: ana.id, servings: 0.9 }
      ]
    }
  ];

  for (const item of plannedMeals) {
    await prisma.plannedMeal.create({
      data: {
        weeklyPlanId: weeklyPlan.id,
        recipeId: recipeMap.get(item.slug)!,
        dayOfWeek: item.dayOfWeek,
        mealSlot: item.mealSlot,
        portions: {
          create: item.portions
        }
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
