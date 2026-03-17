import { DayOfWeek, MealType, type Prisma } from "@prisma/client";
import { addWeeks, subWeeks } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  dayOfWeekLabels,
  dayOfWeekOrder,
  mealTypeLabels,
  mealTypeOptions
} from "@/lib/constants/meal";
import { formatWeekLabel } from "@/lib/utils/date";
import { type PlannedMealFormValues } from "@/lib/validators/planner";

export type DuplicateWeekResult =
  | { status: "missing_source"; copied: 0; overwritten: false }
  | { status: "needs_confirmation"; copied: 0; overwritten: false; existingMeals: number }
  | { status: "duplicated"; copied: number; overwritten: boolean };

export function buildPlannedMealPortionInputs(
  portions: PlannedMealFormValues["portions"]
): Prisma.PlannedMealPortionCreateManyPlannedMealInput[] {
  return portions.map((portion) => ({
    personId: portion.personId,
    servings: portion.servings
  }));
}

export function resolveDuplicateWeekStrategy(input: {
  sourceMealCount: number;
  targetMealCount: number;
  overwrite: boolean;
}): DuplicateWeekResult["status"] {
  if (input.sourceMealCount === 0) {
    return "missing_source";
  }

  if (input.targetMealCount > 0 && !input.overwrite) {
    return "needs_confirmation";
  }

  return "duplicated";
}

export function buildDuplicateMealPayload(
  sourceMeals: Array<{
    recipeId: string;
    dayOfWeek: DayOfWeek;
    mealSlot: MealType;
    notes: string | null;
    portions: Array<{
      personId: string;
      servings: number;
    }>;
  }>,
  weeklyPlanId: string
) {
  return sourceMeals.map((meal) => ({
    weeklyPlanId,
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
  }));
}

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
    meta: {
      plannedMealCount: plannedMeals.length
    },
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
      recipe: {
        select: {
          name: true
        }
      },
      portions: true
    }
  });
}

export async function savePlannedMeal(data: PlannedMealFormValues) {
  return prisma.$transaction(async (tx) => {
    const plannedMeal = await tx.plannedMeal.upsert({
      where: {
        weeklyPlanId_dayOfWeek_mealSlot: {
          weeklyPlanId: data.weeklyPlanId,
          dayOfWeek: data.dayOfWeek,
          mealSlot: data.mealSlot
        }
      },
      update: {
        recipeId: data.recipeId,
        notes: data.notes || null
      },
      create: {
        weeklyPlanId: data.weeklyPlanId,
        recipeId: data.recipeId,
        dayOfWeek: data.dayOfWeek,
        mealSlot: data.mealSlot,
        notes: data.notes || null
      }
    });

    await tx.plannedMealPortion.deleteMany({
      where: {
        plannedMealId: plannedMeal.id
      }
    });

    await tx.plannedMealPortion.createMany({
      data: buildPlannedMealPortionInputs(data.portions).map((portion) => ({
        plannedMealId: plannedMeal.id,
        ...portion
      }))
    });

    await tx.shoppingListItemState.deleteMany({
      where: {
        weeklyPlanId: data.weeklyPlanId
      }
    });

    return plannedMeal;
  });
}

export async function deletePlannedMeal(id: string) {
  return prisma.$transaction(async (tx) => {
    const plannedMeal = await tx.plannedMeal.findUnique({
      where: { id },
      select: {
        id: true,
        weeklyPlanId: true
      }
    });

    if (!plannedMeal) {
      throw new Error("The selected meal no longer exists.");
    }

    await tx.plannedMeal.delete({
      where: { id }
    });

    await tx.shoppingListItemState.deleteMany({
      where: {
        weeklyPlanId: plannedMeal.weeklyPlanId
      }
    });
  });
}

export async function duplicatePreviousWeek(
  targetWeekStartDate: Date,
  options?: { overwrite?: boolean }
) {
  const overwrite = options?.overwrite ?? false;
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

  const targetMealCount = await prisma.plannedMeal.count({
    where: {
      weeklyPlanId: targetWeek.id
    }
  });

  const sourceMealCount = sourceWeek?.plannedMeals.length ?? 0;
  const strategy = resolveDuplicateWeekStrategy({
    sourceMealCount,
    targetMealCount,
    overwrite
  });

  if (strategy === "missing_source") {
    return {
      status: "missing_source",
      copied: 0,
      overwritten: false
    } satisfies DuplicateWeekResult;
  }

  if (strategy === "needs_confirmation") {
    return {
      status: "needs_confirmation",
      copied: 0,
      overwritten: false,
      existingMeals: targetMealCount
    } satisfies DuplicateWeekResult;
  }

  const duplicatePayload = buildDuplicateMealPayload(sourceWeek!.plannedMeals, targetWeek.id);

  await prisma.$transaction(async (tx) => {
    await tx.plannedMeal.deleteMany({
      where: {
        weeklyPlanId: targetWeek.id
      }
    });

    for (const mealData of duplicatePayload) {
      await tx.plannedMeal.create({
        data: mealData
      });
    }

    await tx.shoppingListItemState.deleteMany({
      where: {
        weeklyPlanId: targetWeek.id
      }
    });
  });

  return {
    status: "duplicated",
    copied: sourceWeek!.plannedMeals.length,
    overwritten: targetMealCount > 0
  } satisfies DuplicateWeekResult;
}
