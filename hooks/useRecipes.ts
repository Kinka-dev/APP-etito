// src/hooks/useRecipes.ts
import { Recipe } from "@/src/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const RECIPES_KEY = "@TuNonHaiFame:recipes";

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  // Carica le ricette all'avvio
  const loadRecipes = useCallback(async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(RECIPES_KEY);
      if (jsonValue !== null) {
        const parsed: Recipe[] = JSON.parse(jsonValue);
        setRecipes(parsed);
      } else {
        setRecipes([]);
      }
    } catch (e) {
      console.error("❌ Errore caricamento ricette:", e);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Salva su AsyncStorage + aggiorna stato locale
  const saveRecipes = async (newRecipes: Recipe[]) => {
    try {
      const jsonValue = JSON.stringify(newRecipes);
      await AsyncStorage.setItem(RECIPES_KEY, jsonValue);
      setRecipes(newRecipes); // ← questo è fondamentale
      console.log("✅ Ricette salvate correttamente:", newRecipes.length);
    } catch (e) {
      console.error("❌ Errore salvataggio ricette:", e);
    }
  };

  const addRecipe = (newRecipeData: Omit<Recipe, "id" | "createdAt">) => {
    const recipeWithId: Recipe = {
      ...newRecipeData,
      id:
        "rec_" +
        Date.now().toString(36) +
        Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      isFavorite: false,
    };

    const updatedRecipes = [...recipes, recipeWithId];
    saveRecipes(updatedRecipes);
  };

  const toggleFavorite = (id: string) => {
    const updated = recipes.map((r) =>
      r.id === id ? { ...r, isFavorite: !r.isFavorite } : r,
    );
    saveRecipes(updated);
  };

  return {
    recipes,
    loading,
    addRecipe,
    toggleFavorite,
    refresh: loadRecipes, // utile per debug
  };
}
