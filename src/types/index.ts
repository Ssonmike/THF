/**
 * Application-level types for TheHomeFood.
 * Prisma generates its own types; these are for API boundaries and UI props.
 */

export type PersonSlug = "miguel" | "ana";

export interface PersonData {
  id: string;
  name: string;
  slug: string;
}

export interface RecipeIngredientData {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export interface RecipeData {
  id: string;
  name: string;
  description: string | null;
  mealType: string;
  prepTime: number | null;
  cookTime: number | null;
  instructions: string | null;
  isFavorite: boolean;
  caloriesPerServing: number | null;
  proteinPerServing: number | null;
  carbsPerServing: number | null;
  fatPerServing: number | null;
  ingredients: RecipeIngredientData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PortionData {
  personId: string;
  personName: string;
  servings: number;
}

export interface PlannedMealData {
  id: string;
  weeklyPlanId: string;
  recipeId: string;
  recipeName: string;
  date: Date;
  slot: string;
  notes: string | null;
  portions: PortionData[];
}

export interface WeeklyPlanData {
  id: string;
  weekStartDate: Date;
  meals: PlannedMealData[];
}

export interface ShoppingItemData {
  key: string;
  name: string;
  quantity: number;
  unit: string;
  displayQuantity: string;
  checked: boolean;
}

export interface NutritionalSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
