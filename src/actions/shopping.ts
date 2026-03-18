"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ChecklistUpdateSchema } from "@/lib/validations";
import { aggregateShoppingList } from "@/lib/shopping";
import type { ActionResult, ShoppingItemData } from "@/types";

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Generate the shopping list for a weekly plan.
 * Returns aggregated ingredients with their checklist state.
 */
export async function getShoppingList(weeklyPlanId: string): Promise<ShoppingItemData[]> {
  const plan = await prisma.weeklyPlan.findUnique({
    where: { id: weeklyPlanId },
    include: {
      meals: {
        include: {
          recipe: {
            include: { ingredients: true },
          },
          portions: true,
        },
      },
      shoppingItems: true,
    },
  });

  if (!plan) return [];

  // Build planned ingredients list
  const plannedIngredients = plan.meals.flatMap((meal) => {
    const totalServings = meal.portions.reduce((sum, p) => sum + p.servings, 0);
    if (totalServings <= 0) return [];

    return meal.recipe.ingredients.map((ing) => ({
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      totalServings,
    }));
  });

  const aggregated = aggregateShoppingList(plannedIngredients);

  // Map checklist state
  const stateMap = new Map(plan.shoppingItems.map((s) => [s.ingredientKey, s.checked]));

  return aggregated.map((item) => ({
    ...item,
    checked: stateMap.get(item.key) ?? false,
  }));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function updateChecklistItem(input: unknown): Promise<ActionResult> {
  try {
    const parsed = ChecklistUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message ?? "Datos inválidos",
      };
    }

    const { weeklyPlanId, ingredientKey, checked } = parsed.data;

    // Verify plan exists
    const plan = await prisma.weeklyPlan.findUnique({ where: { id: weeklyPlanId } });
    if (!plan) return { success: false, error: "Plan semanal no encontrado" };

    await prisma.shoppingListItemState.upsert({
      where: { weeklyPlanId_ingredientKey: { weeklyPlanId, ingredientKey } },
      create: { weeklyPlanId, ingredientKey, checked },
      update: { checked },
    });

    revalidatePath("/shopping");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[updateChecklistItem]", e);
    return { success: false, error: "Error al actualizar el estado" };
  }
}

export async function clearCheckedItems(weeklyPlanId: string): Promise<ActionResult> {
  try {
    const plan = await prisma.weeklyPlan.findUnique({ where: { id: weeklyPlanId } });
    if (!plan) return { success: false, error: "Plan semanal no encontrado" };

    await prisma.shoppingListItemState.updateMany({
      where: { weeklyPlanId, checked: true },
      data: { checked: false },
    });

    revalidatePath("/shopping");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[clearCheckedItems]", e);
    return { success: false, error: "Error al limpiar la lista" };
  }
}
