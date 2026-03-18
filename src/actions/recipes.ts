"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { RecipeSchema, parseNumericField, parseIntField } from "@/lib/validations";
import type { ActionResult } from "@/types";

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getRecipes(mealType?: string, search?: string) {
  return prisma.recipe.findMany({
    where: {
      ...(mealType && mealType !== "ALL" ? { mealType } : {}),
      ...(search && search.trim()
        ? {
            name: {
              contains: search.trim(),
            },
          }
        : {}),
    },
    include: {
      ingredients: {
        orderBy: { name: "asc" },
      },
      _count: { select: { plannedMeals: true } },
    },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getRecipeById(id: string) {
  return prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: {
        orderBy: { name: "asc" },
      },
      _count: { select: { plannedMeals: true } },
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createRecipe(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = parseRecipeForm(formData);
    if (!parsed.success) return { success: false, error: parsed.error };

    const { ingredients, ...recipeData } = parsed.data;

    const recipe = await prisma.recipe.create({
      data: {
        ...recipeData,
        ingredients: {
          create: ingredients.map((ing) => ({
            name: ing.name.trim().toLowerCase(),
            quantity: ing.quantity,
            unit: ing.unit.trim().toLowerCase(),
            calories: ing.calories ?? null,
            protein: ing.protein ?? null,
            carbs: ing.carbs ?? null,
            fat: ing.fat ?? null,
          })),
        },
      },
    });

    revalidatePath("/recipes");
    revalidatePath("/");
    return { success: true, data: { id: recipe.id } };
  } catch (e) {
    console.error("[createRecipe]", e);
    return { success: false, error: "Error al crear la receta" };
  }
}

export async function updateRecipe(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const existing = await prisma.recipe.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Receta no encontrada" };

    const parsed = parseRecipeForm(formData);
    if (!parsed.success) return { success: false, error: parsed.error };

    const { ingredients, ...recipeData } = parsed.data;

    // Use transaction to replace ingredients atomically
    await prisma.$transaction(async (tx) => {
      await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
      await tx.recipe.update({
        where: { id },
        data: {
          ...recipeData,
          ingredients: {
            create: ingredients.map((ing) => ({
              name: ing.name.trim().toLowerCase(),
              quantity: ing.quantity,
              unit: ing.unit.trim().toLowerCase(),
              calories: ing.calories ?? null,
              protein: ing.protein ?? null,
              carbs: ing.carbs ?? null,
              fat: ing.fat ?? null,
            })),
          },
        },
      });
    });

    revalidatePath(`/recipes/${id}`);
    revalidatePath("/recipes");
    revalidatePath("/");
    return { success: true, data: { id } };
  } catch (e) {
    console.error("[updateRecipe]", e);
    return { success: false, error: "Error al actualizar la receta" };
  }
}

export async function deleteRecipe(id: string): Promise<ActionResult> {
  try {
    const existing = await prisma.recipe.findUnique({
      where: { id },
      include: { _count: { select: { plannedMeals: true } } },
    });
    if (!existing) return { success: false, error: "Receta no encontrada" };

    if (existing._count.plannedMeals > 0) {
      return {
        success: false,
        error: `Esta receta está asignada a ${existing._count.plannedMeals} comida(s) planificada(s). Elimínala del planner primero.`,
      };
    }

    await prisma.recipe.delete({ where: { id } });

    revalidatePath("/recipes");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[deleteRecipe]", e);
    return { success: false, error: "Error al eliminar la receta" };
  }
}

export async function toggleFavorite(id: string): Promise<ActionResult> {
  try {
    const recipe = await prisma.recipe.findUnique({ where: { id } });
    if (!recipe) return { success: false, error: "Receta no encontrada" };

    await prisma.recipe.update({
      where: { id },
      data: { isFavorite: !recipe.isFavorite },
    });

    revalidatePath("/recipes");
    revalidatePath(`/recipes/${id}`);
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[toggleFavorite]", e);
    return { success: false, error: "Error al actualizar favorito" };
  }
}

export async function duplicateRecipe(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const original = await prisma.recipe.findUnique({
      where: { id },
      include: { ingredients: true },
    });
    if (!original) return { success: false, error: "Receta no encontrada" };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, createdAt: _c, updatedAt: _u, ingredients, ...rest } = original;

    const copy = await prisma.recipe.create({
      data: {
        ...rest,
        name: `${rest.name} (copia)`,
        isFavorite: false,
        ingredients: {
          create: ingredients.map(({ id: _iid, recipeId: _rid, ...ing }) => ing),
        },
      },
    });

    revalidatePath("/recipes");
    return { success: true, data: { id: copy.id } };
  } catch (e) {
    console.error("[duplicateRecipe]", e);
    return { success: false, error: "Error al duplicar la receta" };
  }
}

// ─── Form parsing ─────────────────────────────────────────────────────────────

function parseRecipeForm(
  formData: FormData
):
  | { success: true; data: ReturnType<typeof RecipeSchema.parse> }
  | { success: false; error: string } {
  try {
    // Parse ingredients from repeated form fields
    const ingredientCount = parseInt(formData.get("ingredientCount") as string) || 0;
    const ingredients = [];
    for (let i = 0; i < ingredientCount; i++) {
      ingredients.push({
        name: (formData.get(`ingredients[${i}].name`) as string) ?? "",
        quantity: parseNumericField(formData.get(`ingredients[${i}].quantity`) as string) ?? 0,
        unit: (formData.get(`ingredients[${i}].unit`) as string) ?? "",
        calories: parseNumericField(formData.get(`ingredients[${i}].calories`) as string),
        protein: parseNumericField(formData.get(`ingredients[${i}].protein`) as string),
        carbs: parseNumericField(formData.get(`ingredients[${i}].carbs`) as string),
        fat: parseNumericField(formData.get(`ingredients[${i}].fat`) as string),
      });
    }

    const raw = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      mealType: formData.get("mealType") as string,
      prepTime: parseIntField(formData.get("prepTime") as string),
      cookTime: parseIntField(formData.get("cookTime") as string),
      instructions: formData.get("instructions") as string || null,
      caloriesPerServing: parseNumericField(formData.get("caloriesPerServing") as string),
      proteinPerServing: parseNumericField(formData.get("proteinPerServing") as string),
      carbsPerServing: parseNumericField(formData.get("carbsPerServing") as string),
      fatPerServing: parseNumericField(formData.get("fatPerServing") as string),
      ingredients,
    };

    const data = RecipeSchema.parse(raw);
    return { success: true, data };
  } catch (e: unknown) {
    if (e && typeof e === "object" && "errors" in e) {
      const zodErr = e as { errors: Array<{ message: string }> };
      return { success: false, error: zodErr.errors[0]?.message ?? "Datos inválidos" };
    }
    return { success: false, error: "Error al procesar el formulario" };
  }
}
