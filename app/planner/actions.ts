"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import {
  deletePlannedMeal,
  duplicatePreviousWeek,
  savePlannedMeal
} from "@/lib/services/planner";
import { parseWeekStartParam } from "@/lib/utils/date";
import { buildNoticeUrl, getErrorMessage } from "@/lib/utils/notice";
import { parsePlannedMealFormData } from "@/lib/validators/planner";

export async function savePlannedMealAction(formData: FormData) {
  const weekStart = String(formData.get("weekStart") ?? "");
  let destination = "/planner";

  try {
    const values = parsePlannedMealFormData(formData);
    await savePlannedMeal(values);
    revalidatePath("/");
    revalidatePath("/planner");
    revalidatePath("/shopping-list");
    destination = buildNoticeUrl("/planner", {
      message: "Meal saved for the selected slot.",
      tone: "success",
      params: { weekStart }
    });
  } catch (error) {
    destination = buildNoticeUrl("/planner", {
      message:
        error instanceof ZodError ? error.issues[0]?.message : getErrorMessage(error),
      tone: "error",
      params: {
        weekStart,
        day: String(formData.get("dayOfWeek") ?? ""),
        slot: String(formData.get("mealSlot") ?? "")
      }
    });
  }

  redirect(destination);
}

export async function deletePlannedMealAction(formData: FormData) {
  const plannedMealId = String(formData.get("plannedMealId") ?? "");
  const weekStart = String(formData.get("weekStart") ?? "");
  let destination = "/planner";

  try {
    await deletePlannedMeal(plannedMealId);
    revalidatePath("/");
    revalidatePath("/planner");
    revalidatePath("/shopping-list");
    destination = buildNoticeUrl("/planner", {
      message: "Meal removed from the plan.",
      tone: "success",
      params: { weekStart }
    });
  } catch (error) {
    destination = buildNoticeUrl("/planner", {
      message: getErrorMessage(error),
      tone: "error",
      params: { weekStart }
    });
  }

  redirect(destination);
}

export async function duplicatePreviousWeekAction(formData: FormData) {
  const weekStart = String(formData.get("weekStart") ?? "");
  let destination = "/planner";

  try {
    const result = await duplicatePreviousWeek(parseWeekStartParam(weekStart));
    revalidatePath("/");
    revalidatePath("/planner");
    revalidatePath("/shopping-list");
    destination = buildNoticeUrl("/planner", {
      message:
        result.copied > 0
          ? `Copied ${result.copied} meals from the previous week.`
          : "Previous week was empty, so nothing was copied.",
      tone: "success",
      params: { weekStart }
    });
  } catch (error) {
    destination = buildNoticeUrl("/planner", {
      message: getErrorMessage(error),
      tone: "error",
      params: { weekStart }
    });
  }

  redirect(destination);
}
