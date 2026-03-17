import { DayOfWeek, MealType } from "@prisma/client";
import { z } from "zod";

export const plannedMealFormSchema = z.object({
  weeklyPlanId: z.string().trim().min(1),
  recipeId: z.string().trim().min(1, "Choose a recipe."),
  dayOfWeek: z.nativeEnum(DayOfWeek, {
    message: "Select a valid day."
  }),
  mealSlot: z.nativeEnum(MealType, {
    message: "Select a valid meal slot."
  }),
  notes: z.string().trim().optional().or(z.literal("")),
  portions: z
    .array(
      z.object({
        personId: z.string().trim().min(1),
        servings: z.coerce.number().positive("Servings must be greater than zero.")
      })
    )
    .min(1, "At least one serving is required.")
});

export type PlannedMealFormValues = z.infer<typeof plannedMealFormSchema>;

export function parsePlannedMealFormData(formData: FormData) {
  const portionEntries = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("servings:"))
    .map(([key, value]) => ({
      personId: key.replace("servings:", ""),
      servings: value
    }));

  return plannedMealFormSchema.parse({
    weeklyPlanId: formData.get("weeklyPlanId"),
    recipeId: formData.get("recipeId"),
    dayOfWeek: formData.get("dayOfWeek"),
    mealSlot: formData.get("mealSlot"),
    notes: formData.get("notes"),
    portions: portionEntries
  });
}
