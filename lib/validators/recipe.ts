import { MealType } from "@prisma/client";
import { z } from "zod";
import { supportedUnits } from "@/lib/constants/meal";

const ingredientSchema = z.object({
  itemName: z.string().trim().min(1, "Each ingredient needs a name."),
  quantity: z.coerce.number().positive("Quantity must be greater than zero."),
  unit: z.enum(supportedUnits, {
    message: "Choose a supported unit."
  }),
  notes: z.string().trim().max(160).optional().or(z.literal(""))
});

export const recipeFormSchema = z.object({
  name: z.string().trim().min(1, "Recipe name is required."),
  mealType: z.nativeEnum(MealType, {
    message: "Meal type is required."
  }),
  description: z.string().trim().max(240).optional().or(z.literal("")),
  instructions: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  imageUrl: z.string().trim().url("Image URL must be valid.").optional().or(z.literal("")),
  nutritionCaloriesPerServing: z.coerce.number().min(0).optional(),
  nutritionProteinPerServing: z.coerce.number().min(0).optional(),
  nutritionCarbsPerServing: z.coerce.number().min(0).optional(),
  nutritionFatsPerServing: z.coerce.number().min(0).optional(),
  isFavorite: z.boolean().optional(),
  ingredients: z.array(ingredientSchema).min(1, "Add at least one ingredient.")
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;

export function parseRecipeFormData(formData: FormData): RecipeFormValues {
  const rawIngredients = formData.get("ingredients");
  let ingredientsPayload: unknown = [];

  if (typeof rawIngredients === "string" && rawIngredients.trim()) {
    ingredientsPayload = JSON.parse(rawIngredients);
  }

  return recipeFormSchema.parse({
    name: formData.get("name"),
    mealType: formData.get("mealType"),
    description: formData.get("description"),
    instructions: formData.get("instructions"),
    notes: formData.get("notes"),
    imageUrl: formData.get("imageUrl"),
    nutritionCaloriesPerServing: emptyToUndefined(formData.get("nutritionCaloriesPerServing")),
    nutritionProteinPerServing: emptyToUndefined(formData.get("nutritionProteinPerServing")),
    nutritionCarbsPerServing: emptyToUndefined(formData.get("nutritionCarbsPerServing")),
    nutritionFatsPerServing: emptyToUndefined(formData.get("nutritionFatsPerServing")),
    isFavorite: formData.get("isFavorite") === "on",
    ingredients: ingredientsPayload
  });
}

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (value === null || value === "") {
    return undefined;
  }

  return value;
}
