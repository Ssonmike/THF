import { z } from "zod";
import { MEAL_TYPES } from "./dates";

// ─── Shared helpers ────────────────────────────────────────────────────────────

const nonEmptyString = (label: string) =>
  z.string().trim().min(1, `${label} es obligatorio`).max(500, `${label} demasiado largo`);

const positiveFloat = (label: string) =>
  z
    .number({ invalid_type_error: `${label} debe ser un número` })
    .positive(`${label} debe ser positivo`)
    .finite(`${label} inválido`);

const optionalPositiveFloat = (label: string) =>
  z
    .number({ invalid_type_error: `${label} debe ser un número` })
    .positive(`${label} debe ser positivo`)
    .finite(`${label} inválido`)
    .optional()
    .nullable();

// ─── Recipe ───────────────────────────────────────────────────────────────────

export const RecipeIngredientSchema = z.object({
  id: z.string().optional(),
  name: nonEmptyString("Nombre del ingrediente").max(200),
  quantity: positiveFloat("Cantidad"),
  unit: nonEmptyString("Unidad").max(50),
  calories: optionalPositiveFloat("Calorías"),
  protein: optionalPositiveFloat("Proteínas"),
  carbs: optionalPositiveFloat("Carbohidratos"),
  fat: optionalPositiveFloat("Grasas"),
});

export const RecipeSchema = z.object({
  name: nonEmptyString("Nombre de receta").max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  mealType: z.enum(MEAL_TYPES, {
    errorMap: () => ({ message: "Tipo de comida inválido" }),
  }),
  prepTime: z
    .number()
    .int()
    .positive("Tiempo de preparación debe ser positivo")
    .max(1440)
    .optional()
    .nullable(),
  cookTime: z
    .number()
    .int()
    .positive("Tiempo de cocción debe ser positivo")
    .max(1440)
    .optional()
    .nullable(),
  instructions: z.string().trim().max(10000).optional().nullable(),
  caloriesPerServing: optionalPositiveFloat("Calorías por ración"),
  proteinPerServing: optionalPositiveFloat("Proteínas por ración"),
  carbsPerServing: optionalPositiveFloat("Carbohidratos por ración"),
  fatPerServing: optionalPositiveFloat("Grasas por ración"),
  ingredients: z
    .array(RecipeIngredientSchema)
    .min(1, "La receta debe tener al menos 1 ingrediente")
    .max(50, "Demasiados ingredientes"),
});

export type RecipeInput = z.infer<typeof RecipeSchema>;

// ─── Planned Meal ─────────────────────────────────────────────────────────────

export const PortionSchema = z.object({
  personId: z.string().min(1, "ID de persona requerido"),
  servings: positiveFloat("Porciones").max(20, "Demasiadas porciones"),
});

export const PlannedMealSchema = z.object({
  recipeId: z.string().min(1, "Selecciona una receta"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)"),
  slot: z.enum(MEAL_TYPES, {
    errorMap: () => ({ message: "Slot de comida inválido" }),
  }),
  notes: z.string().trim().max(500).optional().nullable(),
  portions: z
    .array(PortionSchema)
    .min(1, "Debe definir al menos una porción")
    .max(10),
});

export type PlannedMealInput = z.infer<typeof PlannedMealSchema>;

// ─── Shopping checklist ───────────────────────────────────────────────────────

export const ChecklistUpdateSchema = z.object({
  weeklyPlanId: z.string().min(1, "ID de plan requerido"),
  ingredientKey: z.string().min(1).max(500),
  checked: z.boolean(),
});

export type ChecklistUpdateInput = z.infer<typeof ChecklistUpdateSchema>;

// ─── Parsing helpers ──────────────────────────────────────────────────────────

/**
 * Parse a form numeric field: accepts both "." and "," as decimal separator.
 * Returns undefined if empty, NaN is rejected by Zod.
 */
export function parseNumericField(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined || value.trim() === "") return undefined;
  const normalized = value.trim().replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? undefined : num;
}

/**
 * Parse a form integer field.
 */
export function parseIntField(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined || value.trim() === "") return undefined;
  const num = parseInt(value.trim(), 10);
  return isNaN(num) ? undefined : num;
}
