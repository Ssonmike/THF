"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getWeekStart, getWeekDays, toDateString } from "@/lib/dates";

import {
  AUTO_DESCRIPTION,
  DAY_ORDER,
  parseWeeklyPlan,
  structureRecipeDeterministic,
  type MealType,
  type StructuredRecipe,
} from "@/lib/nutrition-plan";

function recipeNeedsUpgrade(recipe: {
  name: string;
  description: string | null;
  instructions: string | null;
  ingredients: Array<{ name: string }>;
}) {
  const badIngredientNames = new Set(["pendiente de definir", "ingrediente principal"]);
  const instructions = recipe.instructions?.trim() ?? "";
  const lowQualityInstructions =
    !instructions ||
    instructions === recipe.name ||
    !/^1\.\s+/m.test(instructions) ||
    instructions.toLowerCase().includes("siguiendo la descripción del plato");

  const lowQualityName = recipe.name.length > 90 || /\d+\s*(g|ml|kcal|scoop)/i.test(recipe.name) || /[:+]/.test(recipe.name);
  const lowQualityIngredients =
    recipe.ingredients.length === 0 || recipe.ingredients.some((ing) => badIngredientNames.has(ing.name.trim().toLowerCase()));

  return lowQualityInstructions || lowQualityName || lowQualityIngredients || recipe.description === AUTO_DESCRIPTION;
}

async function ensureRecipe(structured: StructuredRecipe) {
  const existing = await prisma.recipe.findFirst({
    where: {
      OR: [
        { name: { equals: structured.name }, mealType: structured.mealType },
        { name: { contains: structured.name.split(" con ")[0] }, mealType: structured.mealType },
      ],
    },
    include: { ingredients: true },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    if (recipeNeedsUpgrade(existing)) {
      const upgraded = await prisma.$transaction(async (tx) => {
        await tx.recipeIngredient.deleteMany({ where: { recipeId: existing.id } });
        return tx.recipe.update({
          where: { id: existing.id },
          data: {
            name: structured.name,
            description: structured.description ?? AUTO_DESCRIPTION,
            instructions: structured.instructions,
            prepTime: structured.prepTime ?? null,
            cookTime: structured.cookTime ?? null,
            caloriesPerServing: structured.caloriesPerServing ?? null,
            proteinPerServing: structured.proteinPerServing ?? null,
            carbsPerServing: structured.carbsPerServing ?? null,
            fatPerServing: structured.fatPerServing ?? null,
            ingredients: {
              create: structured.ingredients.map((ing) => ({
                name: ing.name,
                quantity: ing.quantity > 0 ? ing.quantity : 1,
                unit: ing.unit || "unit",
              })),
            },
          },
        });
      });
      return { recipe: upgraded, created: false, upgraded: true };
    }

    return { recipe: existing, created: false, upgraded: false };
  }

  const recipe = await prisma.recipe.create({
    data: {
      name: structured.name,
      description: structured.description ?? AUTO_DESCRIPTION,
      mealType: structured.mealType,
      instructions: structured.instructions,
      prepTime: structured.prepTime ?? null,
      cookTime: structured.cookTime ?? null,
      caloriesPerServing: structured.caloriesPerServing ?? null,
      proteinPerServing: structured.proteinPerServing ?? null,
      carbsPerServing: structured.carbsPerServing ?? null,
      fatPerServing: structured.fatPerServing ?? null,
      ingredients: {
        create: structured.ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity > 0 ? ing.quantity : 1,
          unit: ing.unit || "unit",
        })),
      },
    },
    include: { ingredients: true },
  });

  return { recipe, created: true, upgraded: false };
}

export async function applyNutritionPlanToPlanner(personSlug: string) {
  const person = await prisma.person.findUnique({
    where: { slug: personSlug },
    include: { nutritionProfile: { include: { plan: true } } },
  });

  if (!person?.nutritionProfile?.plan?.content) {
    return { success: false, error: "No hay plan nutricional generado" };
  }

  const parsed = parseWeeklyPlan(person.nutritionProfile.plan.content);
  if (parsed.length === 0) {
    return { success: false, error: "No se pudo interpretar el plan semanal" };
  }

  const recipeMap = new Map<string, { id: string }>();
  let createdRecipes = 0;
  let upgradedRecipes = 0;

  for (const dayPlan of parsed) {
    const entries: Array<{ slot: MealType; value?: string }> = [
      { slot: "BREAKFAST", value: dayPlan.breakfast },
      { slot: "LUNCH", value: dayPlan.lunch },
      { slot: "DINNER", value: dayPlan.dinner },
      { slot: "SNACK", value: dayPlan.snack },
    ];

    for (const entry of entries) {
      if (!entry.value) continue;
      const structured = structureRecipeDeterministic(entry.value, entry.slot);
      const key = `${entry.slot}::${structured.name}`;
      if (recipeMap.has(key)) continue;

      const { recipe, created, upgraded } = await ensureRecipe(structured);
      recipeMap.set(key, { id: recipe.id });
      if (created) createdRecipes += 1;
      if (upgraded) upgradedRecipes += 1;
    }
  }

  if (recipeMap.size === 0) {
    return { success: false, error: "No se pudieron guardar recetas desde el plan nutricional" };
  }

  const today = new Date();
  const weekStart = getWeekStart(today);
  const weekDays = getWeekDays(weekStart);

  let weeklyPlan = await prisma.weeklyPlan.findUnique({ where: { weekStartDate: weekStart } });
  if (!weeklyPlan) {
    weeklyPlan = await prisma.weeklyPlan.create({ data: { weekStartDate: weekStart } });
  }

  let appliedCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const dayPlan of parsed) {
      const dayIndex = DAY_ORDER.indexOf(dayPlan.day);
      if (dayIndex < 0 || dayIndex > 6) continue;
      const date = weekDays[dayIndex];

      const entries: Array<{ slot: MealType; value?: string }> = [
        { slot: "BREAKFAST", value: dayPlan.breakfast },
        { slot: "LUNCH", value: dayPlan.lunch },
        { slot: "DINNER", value: dayPlan.dinner },
        { slot: "SNACK", value: dayPlan.snack },
      ];

      for (const entry of entries) {
        if (!entry.value) continue;
        const key = `${entry.slot}::${structureRecipeDeterministic(entry.value, entry.slot).name}`;
        const recipeRef = recipeMap.get(key);
        if (!recipeRef) continue;

        const existing = await tx.plannedMeal.findUnique({
          where: {
            weeklyPlanId_date_slot: {
              weeklyPlanId: weeklyPlan!.id,
              date,
              slot: entry.slot,
            },
          },
        });

        let mealId = existing?.id;
        if (existing) {
          await tx.plannedMeal.update({
            where: { id: existing.id },
            data: {
              recipeId: recipeRef.id,
              notes: "Aplicado automáticamente desde el plan nutricional",
            },
          });
          await tx.plannedMealPortion.deleteMany({ where: { plannedMealId: existing.id } });
        } else {
          const created = await tx.plannedMeal.create({
            data: {
              weeklyPlanId: weeklyPlan!.id,
              recipeId: recipeRef.id,
              date,
              slot: entry.slot,
              notes: "Aplicado automáticamente desde el plan nutricional",
            },
          });
          mealId = created.id;
        }

        await tx.plannedMealPortion.create({
          data: {
            plannedMealId: mealId!,
            personId: person.id,
            servings: 1,
          },
        });

        appliedCount += 1;
      }
    }
  });

  if (appliedCount === 0) {
    return { success: false, error: "Se guardaron recetas, pero no se pudo aplicar ninguna comida al planner" };
  }

  revalidatePath("/recipes");
  revalidatePath("/planner");
  revalidatePath("/");
  revalidatePath("/shopping");
  revalidatePath(`/nutrition/${personSlug}`);

  return {
    success: true,
    data: {
      week: toDateString(weekStart),
      createdRecipes,
      upgradedRecipes,
      appliedMeals: appliedCount,
    },
  };
}
