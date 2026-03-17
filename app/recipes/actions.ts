"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import {
  createRecipe,
  deleteRecipeSafely,
  duplicateRecipe,
  updateRecipe
} from "@/lib/services/recipes";
import { logger } from "@/lib/utils/logger";
import { buildNoticeUrl, getErrorMessage } from "@/lib/utils/notice";
import { parseRecipeFormData } from "@/lib/validators/recipe";

function revalidateRecipeViews(recipeId?: string) {
  revalidatePath("/recipes");

  if (recipeId) {
    revalidatePath(`/recipes/${recipeId}`);
  }
}

export async function createRecipeAction(formData: FormData) {
  let destination = "/recipes/new";

  try {
    const values = parseRecipeFormData(formData);
    const recipe = await createRecipe(values);

    revalidateRecipeViews(recipe.id);
    destination = buildNoticeUrl(`/recipes/${recipe.id}`, {
      message: "Recipe created successfully.",
      tone: "success"
    });
  } catch (error) {
    logger.error("createRecipeAction failed", error);

    destination = buildNoticeUrl("/recipes/new", {
      message:
        error instanceof ZodError ? error.issues[0]?.message : getErrorMessage(error),
      tone: "error"
    });
  }

  redirect(destination);
}

export async function updateRecipeAction(recipeId: string, formData: FormData) {
  let destination = `/recipes/${recipeId}/edit`;

  try {
    const values = parseRecipeFormData(formData);
    await updateRecipe(recipeId, values);

    revalidateRecipeViews(recipeId);
    destination = buildNoticeUrl(`/recipes/${recipeId}`, {
      message: "Recipe updated successfully.",
      tone: "success"
    });
  } catch (error) {
    logger.error("updateRecipeAction failed", error, { recipeId });

    destination = buildNoticeUrl(`/recipes/${recipeId}/edit`, {
      message:
        error instanceof ZodError ? error.issues[0]?.message : getErrorMessage(error),
      tone: "error"
    });
  }

  redirect(destination);
}

export async function duplicateRecipeAction(formData: FormData) {
  const recipeId = String(formData.get("recipeId") ?? "");
  let destination = "/recipes";

  try {
    const duplicated = await duplicateRecipe(recipeId);
    revalidateRecipeViews(duplicated.id);
    destination = buildNoticeUrl(`/recipes/${duplicated.id}/edit`, {
      message: "Recipe duplicated. Review it and save any changes you want.",
      tone: "success"
    });
  } catch (error) {
    logger.error("duplicateRecipeAction failed", error, { recipeId });

    destination = buildNoticeUrl("/recipes", {
      message: getErrorMessage(error),
      tone: "error"
    });
  }

  redirect(destination);
}

export async function deleteRecipeAction(formData: FormData) {
  const recipeId = String(formData.get("recipeId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/recipes");
  const errorRedirectTo = String(formData.get("errorRedirectTo") ?? redirectTo);
  let destination = redirectTo;

  try {
    await deleteRecipeSafely(recipeId);
    revalidateRecipeViews(recipeId);
    destination = buildNoticeUrl(redirectTo, {
      message: "Recipe deleted.",
      tone: "success"
    });
  } catch (error) {
    logger.error("deleteRecipeAction failed", error, { recipeId });

    destination = buildNoticeUrl(errorRedirectTo, {
      message: getErrorMessage(error),
      tone: "error"
    });
  }

  redirect(destination);
}
