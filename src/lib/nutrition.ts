import { z } from "zod";

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? undefined : value))
    .optional();

export const NutritionProfileSchema = z.object({
  age: z.number().int().min(0).max(120).optional(),
  sex: z.enum(["MALE", "FEMALE"]).optional(),
  heightCm: z.number().positive().max(300).optional(),
  weightKg: z.number().positive().max(500).optional(),
  goalWeight: optionalTrimmedString(200),
  timeline: optionalTrimmedString(200),
  jobType: optionalTrimmedString(200),
  exercisePerWeek: z.number().int().min(0).max(14).optional(),
  exerciseType: optionalTrimmedString(500),
  sleepHours: z.number().min(0).max(24).optional(),
  stressLevel: z.enum(["low", "moderate", "high"]).optional(),
  alcohol: optionalTrimmedString(500),
  favoriteMeals: optionalTrimmedString(2000),
  hatedFoods: optionalTrimmedString(2000),
  dietaryRestrictions: optionalTrimmedString(2000),
  cookingStyle: z.enum(["scratch", "quick", "batch"]).optional(),
  foodAdventurousness: z.number().int().min(1).max(10).optional(),
  currentSnacks: optionalTrimmedString(2000),
  snackReason: z.enum(["hunger", "boredom", "habit", "multiple"]).optional(),
  snackPreference: z.enum(["sweet", "savory", "both"]).optional(),
  lateNightSnacking: z.boolean().optional(),
});

export const NutritionPlanContentSchema = z
  .string()
  .trim()
  .min(1, "El plan nutricional no puede estar vacío")
  .max(50000, "El plan nutricional es demasiado largo");

export const GenerateNutritionBodySchema = z.object({
  personName: z.string().trim().min(1).max(80),
  profile: NutritionProfileSchema,
});

export type NutritionProfileInput = z.infer<typeof NutritionProfileSchema>;
export type GenerateNutritionBody = z.infer<typeof GenerateNutritionBodySchema>;
