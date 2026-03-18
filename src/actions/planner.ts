"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PlannedMealSchema } from "@/lib/validations";
import { toUTCMidnight, nextWeek } from "@/lib/dates";
import type { ActionResult, WeeklyPlanData } from "@/types";

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Get or create the weekly plan for the week containing the given date.
 */
export async function getOrCreateWeeklyPlan(weekStartDateStr: string): Promise<WeeklyPlanData> {
  const weekStartDate = toUTCMidnight(weekStartDateStr);

  let plan = await prisma.weeklyPlan.findUnique({
    where: { weekStartDate },
    include: {
      meals: {
        include: {
          recipe: true,
          portions: {
            include: { person: true },
          },
        },
        orderBy: [{ date: "asc" }, { slot: "asc" }],
      },
    },
  });

  if (!plan) {
    plan = await prisma.weeklyPlan.create({
      data: { weekStartDate },
      include: {
        meals: {
          include: {
            recipe: true,
            portions: { include: { person: true } },
          },
          orderBy: [{ date: "asc" }, { slot: "asc" }],
        },
      },
    });
  }

  return {
    id: plan.id,
    weekStartDate: plan.weekStartDate,
    meals: plan.meals.map((m) => ({
      id: m.id,
      weeklyPlanId: m.weeklyPlanId,
      recipeId: m.recipeId,
      recipeName: m.recipe.name,
      date: m.date,
      slot: m.slot,
      notes: m.notes,
      portions: m.portions.map((p) => ({
        personId: p.personId,
        personName: p.person.name,
        servings: p.servings,
      })),
    })),
  };
}

/**
 * Get meals for a specific date (for dashboard).
 */
export async function getMealsForDate(dateStr: string) {
  const date = toUTCMidnight(dateStr);
  return prisma.plannedMeal.findMany({
    where: { date },
    include: {
      recipe: {
        include: { ingredients: true },
      },
      portions: {
        include: { person: true },
      },
    },
    orderBy: { slot: "asc" },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function upsertPlannedMeal(
  weeklyPlanId: string,
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = PlannedMealSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message ?? "Datos inválidos",
      };
    }

    const { recipeId, date, slot, notes, portions } = parsed.data;

    // Verify recipe exists
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) return { success: false, error: "Receta no encontrada" };

    // Verify plan exists
    const plan = await prisma.weeklyPlan.findUnique({ where: { id: weeklyPlanId } });
    if (!plan) return { success: false, error: "Plan semanal no encontrado" };

    // Verify persons exist
    const personIds = portions.map((p) => p.personId);
    const persons = await prisma.person.findMany({ where: { id: { in: personIds } } });
    if (persons.length !== personIds.length) {
      return { success: false, error: "Persona(s) no encontrada(s)" };
    }

    const dateObj = toUTCMidnight(date);

    // Upsert the planned meal + replace portions atomically
    const result = await prisma.$transaction(async (tx) => {
      // Find existing meal for this slot+date+plan
      const existing = await tx.plannedMeal.findUnique({
        where: { weeklyPlanId_date_slot: { weeklyPlanId, date: dateObj, slot } },
      });

      let meal;
      if (existing) {
        // Delete old portions, update meal
        await tx.plannedMealPortion.deleteMany({ where: { plannedMealId: existing.id } });
        meal = await tx.plannedMeal.update({
          where: { id: existing.id },
          data: { recipeId, notes: notes ?? null },
        });
      } else {
        meal = await tx.plannedMeal.create({
          data: {
            weeklyPlanId,
            recipeId,
            date: dateObj,
            slot,
            notes: notes ?? null,
          },
        });
      }

      // Create new portions
      await tx.plannedMealPortion.createMany({
        data: portions.map((p) => ({
          plannedMealId: meal.id,
          personId: p.personId,
          servings: p.servings,
        })),
      });

      return meal;
    });

    revalidatePath("/planner");
    revalidatePath("/");
    revalidatePath("/shopping");
    return { success: true, data: { id: result.id } };
  } catch (e) {
    console.error("[upsertPlannedMeal]", e);
    return { success: false, error: "Error al guardar la comida" };
  }
}

export async function deletePlannedMeal(mealId: string): Promise<ActionResult> {
  try {
    const meal = await prisma.plannedMeal.findUnique({ where: { id: mealId } });
    if (!meal) return { success: false, error: "Comida no encontrada" };

    // Cascade deletes portions automatically (onDelete: Cascade)
    await prisma.plannedMeal.delete({ where: { id: mealId } });

    revalidatePath("/planner");
    revalidatePath("/");
    revalidatePath("/shopping");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[deletePlannedMeal]", e);
    return { success: false, error: "Error al eliminar la comida" };
  }
}

/**
 * Duplicate a week's meals into the next week.
 * If the target week already has meals, they are replaced.
 */
export async function duplicateWeek(sourceWeeklyPlanId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const source = await prisma.weeklyPlan.findUnique({
      where: { id: sourceWeeklyPlanId },
      include: {
        meals: {
          include: { portions: true },
        },
      },
    });

    if (!source) return { success: false, error: "Plan semanal no encontrado" };
    if (source.meals.length === 0) {
      return { success: false, error: "La semana está vacía, no hay nada que duplicar" };
    }

    const targetWeekStart = nextWeek(source.weekStartDate);

    const result = await prisma.$transaction(async (tx) => {
      // Find or create target plan
      let targetPlan = await tx.weeklyPlan.findUnique({
        where: { weekStartDate: targetWeekStart },
      });

      if (targetPlan) {
        // Clear existing meals in target (cascade deletes portions)
        await tx.plannedMeal.deleteMany({ where: { weeklyPlanId: targetPlan.id } });
      } else {
        targetPlan = await tx.weeklyPlan.create({
          data: { weekStartDate: targetWeekStart },
        });
      }

      // Copy meals, adjusting dates by +7 days
      for (const meal of source.meals) {
        const newDate = new Date(meal.date);
        newDate.setUTCDate(newDate.getUTCDate() + 7);

        const newMeal = await tx.plannedMeal.create({
          data: {
            weeklyPlanId: targetPlan.id,
            recipeId: meal.recipeId,
            date: newDate,
            slot: meal.slot,
            notes: meal.notes,
          },
        });

        await tx.plannedMealPortion.createMany({
          data: meal.portions.map((p) => ({
            plannedMealId: newMeal.id,
            personId: p.personId,
            servings: p.servings,
          })),
        });
      }

      return targetPlan;
    });

    revalidatePath("/planner");
    revalidatePath("/");
    revalidatePath("/shopping");

    return {
      success: true,
      data: {
        id: result.id,
      },
    };
  } catch (e) {
    console.error("[duplicateWeek]", e);
    return { success: false, error: "Error al duplicar la semana" };
  }
}
