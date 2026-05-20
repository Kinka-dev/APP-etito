import { calculateNutrition } from "@/app/utils/nutritionEngine";
import { useMemo, useState } from "react";

export function useCalorieCalculator() {
  const [items, setItems] = useState<{ name: string; grams: number }[]>([]);

  function addItem(name: string, grams: number) {
    setItems((prev) => [...prev, { name, grams }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const n = calculateNutrition(item.name, item.grams);
        if (!n) return acc;

        acc.kcal += n.kcal;
        acc.carbs += n.carbs;
        acc.protein += n.protein;
        acc.fat += n.fat;

        return acc;
      },
      { kcal: 0, carbs: 0, protein: 0, fat: 0 },
    );
  }, [items]);

  return {
    items,
    addItem,
    removeItem,
    totals,
  };
}
