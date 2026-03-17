import { DayOfWeek, MealType } from "@prisma/client";
import { addWeeks, subWeeks } from "date-fns";
import { prisma } from "@/lib/prisma";
import { dayOfWeekLabels, dayOfWeekOrder, mealTypeLabels, mealTypeOptions } from "@/lib/constants/meal";
import { formatWeekLabel } from "@/lib/utils/date";
import { type PlannedMealFormValues } from "@/lib/validators/planner";

export async function ensureWeeklyPlan(weekStartDate: Date) {
  return prisma.weeklyPlan.upsert({
    where: { weekStartDate },
    update: {},
    create: { weekStartDate }
  });
}

export async function getPlannerData(weekStartDate: Date) {
  const weeklyPlan = await ensureWeeklyPlan(weekStartDate);
  const persons = await prisma.person.findMany({
    orderBy: {
      name: "asc"
    }
  });
  const recipes = await prisma.recipe.findMany({
    select: {
      id: true,
      name: true,
      mealType: true,
      isFavorite: true
    },
    orderBy: [{ isFavorite: "desc" }, { name: "asc" }]
  });

  const plannedMeals = await prisma.plannedMeal.findMany({
    where: {
      weeklyPlanId: weeklyPlan.id
    },
    include: {
      recipe: true,
      portions: {
        include: {
          person: true
        }
      }
    }
  });

  const mealMap = new Map<string, (typeof plannedMeals)[number]>();
  for (const meal of plannedMeals) {
    mealMap.set(`${meal.dayOfWeek}-${meal.mealSlot}`, meal);
  }

  const grid = dayOfWeekOrder.map((dayOfWeek) => ({
    dayOfWeek,
    label: dayOfWeekLabels[dayOfWeek],
    slots: mealTypeOptions.map(({ value }) => ({
      mealSlot: value,
      mealSlotLabel: mealTypeLabels[value],
      meal: mealMap.get(`${dayOfWeek}-${value}`) ?? null
    }))
  }));

  return {
    weeklyPlan,
    persons,
    recipes,
    grid,
    navigation: {
      previousWeek: subWeeks(weekStartDate, 1),
      nextWeek: addWeeks(weekStartDate, 1),
      label: formatWeekLabel(weekStartDate)
    }
  };
}

export async function getPlannedMealByCoordinates(
  weeklyPlanId: string,
  dayOfWeek: DayOfWeek,
  mealSlot: MealType
) {
  return prisma.plannedMeal.findUnique({
    where: {
      weeklyPlanId_dayOfWeek_mealSlot: {
        weeklyPlanId,
        dayOfWeek,
        mealSlot
      }
    },
    include: {
      portions: true
    }
  });
}

export async function savePlannedMeal(data: PlannedMealFormValues) {
  const existing = await prisma.plannedMeal.findUnique({
    where: {
      weeklyPlanId_dayOfWeek_mealSlot: {
        weeklyPlanId: data.weeklyPlanId,
        dayOfWeek: data.dayOfWeek,
        mealSlot: data.mealSlot
      }
    }
  });

  if (existing) {
    return prisma.plannedMeal.update({
      where: { id: existing.id },
      data: {
        recipeId: data.recipeId,
        notes: data.notes || null,
        portions: {
          deleteMany: {},
          create: data.portions.map((portion) => ({
            personId: portion.personId,
            servings: portion.servings
          }))
        }
      }
    });
  }

  return prisma.plannedMeal.create({
    data: {
      weeklyPlanId: data.weeklyPlanId,
      recipeId: data.recipeId,
      dayOfWeek: data.dayOfWeek,
      mealSlot: data.mealSlot,
      notes: data.notes || null,
      portions: {
        create: data.portions.map((portion) => ({
          personId: portion.personId,
          servings: portion.servings
        }))
      }
    }
  });
}

export async function deletePlannedMeal(id: string) {
  return prisma.plannedMeal.delete({
    where: { id }
  });
}

export async function duplicatePreviousWeek(targetWeekStartDate: Date) {
  const targetWeek = await ensureWeeklyPlan(targetWeekStartDate);
  const sourceWeek = await prisma.weeklyPlan.findUnique({
    where: {
      weekStartDate: subWeeks(targetWeekStartDate, 1)
    },
    include: {
      plannedMeals: {
        include: {
          portions: true
        }
      }
    }
  });

  if (!sourceWeek) {
    return {
      copied: 0
    };
  }

  await prisma.plannedMeal.deleteMany({
    where: { weeklyPlanId: targetWeek.id }
  });

  for (const meal of sourceWeek.plannedMeals) {
    await prisma.plannedMeal.create({
      data: {
        weeklyPlanId: targetWeek.id,
        recipeId: meal.recipeId,
        dayOfWeek: meal.dayOfWeek,
        mealSlot: meal.mealSlot,
        notes: meal.notes,
        portions: {
          create: meal.portions.map((portion) => ({
            personId: portion.personId,
            servings: portion.servings
          }))
        }
      }
    });
  }

  return {
    copied: sourceWeek.plannedMeals.length
  };
}
