export type NutritionVector = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export const emptyNutritionVector: NutritionVector = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0
};

export function multiplyNutrition(
  nutrition: Partial<NutritionVector>,
  multiplier: number
): NutritionVector {
  return {
    calories: (nutrition.calories ?? 0) * multiplier,
    protein: (nutrition.protein ?? 0) * multiplier,
    carbs: (nutrition.carbs ?? 0) * multiplier,
    fats: (nutrition.fats ?? 0) * multiplier
  };
}

export function addNutrition(a: NutritionVector, b: NutritionVector): NutritionVector {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fats: a.fats + b.fats
  };
}
