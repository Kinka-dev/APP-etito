import { nutritionDB } from "../data/nutritionDB";

type NutritionCategory = Record<
  string,
  { kcal: number; carbs: number; protein: number; fat: number }
>;

export function getIngredientData(name: string) {
  for (const category of Object.values(nutritionDB) as NutritionCategory[]) {
    if (category[name]) return category[name];
  }
  return null;
}

export function calculateNutrition(name: string, grams: number) {
  const data = getIngredientData(name);
  if (!data) return null;

  const factor = grams / 100;

  return {
    kcal: (data.kcal ?? 0) * factor,
    carbs: (data.carbs ?? 0) * factor,
    protein: (data.protein ?? 0) * factor,
    fat: (data.fat ?? 0) * factor,
  };
}
