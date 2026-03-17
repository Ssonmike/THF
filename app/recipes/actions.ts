"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import {
  createRecipe,
  deleteRecipeSafely,
  updateRecipe
} from "@/lib/services/recipes";
import { buildNoticeUrl, getErrorMessage } from "@/lib/utils/notice";
import { parseRecipeFormData } from "@/lib/validators/recipe";

export async function createRecipeAction(formData: FormData) {
  let destination = "/recipes/new";

  try {
    const values = parseRecipeFormData(formData);
    const recipe = await createRecipe(values);

    revalidatePath("/recipes");
    destination = buildNoticeUrl(`/recipes/${recipe.id}`, {
      message: "Recipe created successfully.",
      tone: "success"
    });
  } catch (error) {
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

    revalidatePath("/recipes");
    revalidatePath(`/recipes/${recipeId}`);
    destination = buildNoticeUrl(`/recipes/${recipeId}`, {
      message: "Recipe updated successfully.",
      tone: "success"
    });
  } catch (error) {
    destination = buildNoticeUrl(`/recipes/${recipeId}/edit`, {
      message:
        error instanceof ZodError ? error.issues[0]?.message : getErrorMessage(error),
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
    revalidatePath("/recipes");
    destination = buildNoticeUrl(redirectTo, {
      message: "Recipe deleted.",
      tone: "success"
    });
  } catch (error) {
    destination = buildNoticeUrl(errorRedirectTo, {
      message: getErrorMessage(error),
      tone: "error"
    });
  }

  redirect(destination);
}
