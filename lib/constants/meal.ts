import { DayOfWeek, MealType } from "@prisma/client";

export const mealTypeOptions = [
  { value: MealType.BREAKFAST, label: "Desayuno" },
  { value: MealType.LUNCH, label: "Comida" },
  { value: MealType.DINNER, label: "Cena" },
  { value: MealType.SNACK, label: "Snack" }
] as const;

export const mealTypeLabels: Record<MealType, string> = {
  [MealType.BREAKFAST]: "Desayuno",
  [MealType.LUNCH]: "Comida",
  [MealType.DINNER]: "Cena",
  [MealType.SNACK]: "Snack"
};

export const dayOfWeekOrder: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY
];

export const dayOfWeekLabels: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "Lunes",
  [DayOfWeek.TUESDAY]: "Martes",
  [DayOfWeek.WEDNESDAY]: "Miercoles",
  [DayOfWeek.THURSDAY]: "Jueves",
  [DayOfWeek.FRIDAY]: "Viernes",
  [DayOfWeek.SATURDAY]: "Sabado",
  [DayOfWeek.SUNDAY]: "Domingo"
};

export const supportedUnits = ["g", "kg", "ml", "l", "unit", "tbsp", "tsp"] as const;
