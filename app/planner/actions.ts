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
import { logger } from "@/lib/utils/logger";
import { buildNoticeUrl, getErrorMessage } from "@/lib/utils/notice";
import { parsePlannedMealFormData } from "@/lib/validators/planner";

function revalidatePlannerViews() {
  revalidatePath("/");
  revalidatePath("/planner");
  revalidatePath("/shopping-list");
}

export async function savePlannedMealAction(formData: FormData) {
  const weekStart = String(formData.get("weekStart") ?? "");
  let destination = "/planner";

  try {
    const values = parsePlannedMealFormData(formData);
    await savePlannedMeal(values);
    revalidatePlannerViews();
    destination = buildNoticeUrl("/planner", {
      message: "Meal saved for the selected slot.",
      tone: "success",
      params: { weekStart }
    });
  } catch (error) {
    logger.error("savePlannedMealAction failed", error, {
      weekStart,
      dayOfWeek: String(formData.get("dayOfWeek") ?? ""),
      mealSlot: String(formData.get("mealSlot") ?? "")
    });

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
    revalidatePlannerViews();
    destination = buildNoticeUrl("/planner", {
      message: "Meal removed from the plan.",
      tone: "success",
      params: { weekStart }
    });
  } catch (error) {
    logger.error("deletePlannedMealAction failed", error, {
      plannedMealId,
      weekStart
    });

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
  const overwrite = formData.get("overwrite") === "true";
  let destination = "/planner";

  try {
    const result = await duplicatePreviousWeek(parseWeekStartParam(weekStart), { overwrite });

    if (result.status === "needs_confirmation") {
      destination = buildNoticeUrl("/planner", {
        message: `This week already has ${result.existingMeals} planned meals. Confirm to overwrite it.`,
        tone: "warning",
        params: { weekStart, confirmOverwrite: "true" }
      });
    } else {
      revalidatePlannerViews();
      destination = buildNoticeUrl("/planner", {
        message:
          result.status === "missing_source"
            ? "Previous week is empty, so nothing was copied."
            : result.overwritten
              ? `Copied ${result.copied} meals and replaced the current week.`
              : `Copied ${result.copied} meals from the previous week.`,
        tone: "success",
        params: { weekStart }
      });
    }
  } catch (error) {
    logger.error("duplicatePreviousWeekAction failed", error, {
      weekStart,
      overwrite
    });

    destination = buildNoticeUrl("/planner", {
      message: getErrorMessage(error),
      tone: "error",
      params: { weekStart }
    });
  }

  redirect(destination);
}
