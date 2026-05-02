// src/context/RecipeContext.tsx
import { DEFAULT_RECIPES } from "@/app/data/defaultRecipes";
import { Ingredient, Recipe } from "@/src/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const RECIPES_KEY = "@TuNonHaiFame:recipes";
const SHOPPING_LIST_KEY = "@TuNonHaiFame:shoppingList";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  checked: boolean;
}

type RecipeContextType = {
  recipes: Recipe[];
  loading: boolean;
  addRecipe: (newRecipe: Recipe) => void;
  toggleFavorite: (id: string) => void;
  refresh: () => Promise<void>;
  updateRecipe: (updatedRecipe: Recipe) => void;
  deleteRecipe: (id: string) => void;

  shoppingList: ShoppingItem[];
  addToShoppingList: (ingredients: Ingredient[]) => void;
  removeFromShoppingList: (ingredientName: string) => void;
  clearShoppingList: () => void;
  toggleShoppingItem: (name: string) => void;
  setShoppingList: (list: ShoppingItem[]) => void;
};

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export function RecipeProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [shoppingList, setShoppingListState] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const saved = await AsyncStorage.getItem("recipes");

      if (!saved) {
        // prima apertura dell'app
        await AsyncStorage.setItem("recipes", JSON.stringify(DEFAULT_RECIPES));
        setRecipes(DEFAULT_RECIPES);
      } else {
        setRecipes(JSON.parse(saved));
      }
    }

    load();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const savedRecipes = await AsyncStorage.getItem(RECIPES_KEY);
      if (savedRecipes) setRecipes(JSON.parse(savedRecipes));

      const savedShopping = await AsyncStorage.getItem(SHOPPING_LIST_KEY);
      if (savedShopping) {
        setShoppingListState(JSON.parse(savedShopping));
      }
    } catch (e) {
      console.error("Errore caricamento:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveRecipes = async (newRecipes: Recipe[]) => {
    await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(newRecipes));
    setRecipes(newRecipes);
  };

  const saveShoppingList = async (list: ShoppingItem[]) => {
    await AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(list));
    setShoppingListState(list);
    console.log(`💾 Lista spesa salvata: ${list.length} elementi`);
  };

  // ... (addRecipe, updateRecipe, deleteRecipe, toggleFavorite rimangono uguali al tuo originale)

  const addRecipe = (newRecipe: Recipe) => {
    // ⭐ Usa l'ID già presente nel newRecipe
    const recipe: Recipe = {
      ...newRecipe,
      createdAt: newRecipe.createdAt ?? new Date().toISOString(),
      isFavorite: newRecipe.isFavorite ?? false,
    };

    saveRecipes([...recipes, recipe]);
  };

  const updateRecipe = (updatedRecipe: Recipe) => {
    const updatedList = recipes.map((r) =>
      r.id === updatedRecipe.id
        ? { ...updatedRecipe, updatedAt: new Date().toISOString() }
        : r,
    );
    saveRecipes(updatedList);
  };

  const deleteRecipe = (id: string) => {
    const updated = recipes.filter((r) => r.id !== id);
    saveRecipes(updated);
  };

  const toggleFavorite = (id: string) => {
    const updated = recipes.map((r) =>
      r.id === id ? { ...r, isFavorite: !r.isFavorite } : r,
    );
    saveRecipes(updated);
  };

  // === FUNZIONE CORRETTA ===
  const addToShoppingList = (ingredients: Ingredient[]) => {
    if (!ingredients?.length) return;

    setShoppingListState((prev) => {
      const existingNames = new Set(
        prev.map((i) => i.name.toLowerCase().trim()),
      );

      const newItems = ingredients
        .filter((ing) => {
          const name = (ing.name || "").toLowerCase().trim();
          return name && !existingNames.has(name);
        })
        .map((ing) => ({
          id: `shop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: (ing.name || "").trim(),
          quantity: (ing.quantity || "").toString(),
          unit: ing.unit || "",
          checked: false,
        }));

      const updatedList = [...prev, ...newItems];
      saveShoppingList(updatedList);
      return updatedList;
    });
  };

  const removeFromShoppingList = (ingredientName: string) => {
    setShoppingListState((prev) => {
      const filtered = prev.filter(
        (i) =>
          i.name.toLowerCase().trim() !== ingredientName.toLowerCase().trim(),
      );
      saveShoppingList(filtered);
      return filtered;
    });
  };

  const clearShoppingList = () => saveShoppingList([]);

  const toggleShoppingItem = (name: string) => {
    setShoppingListState((prev) => {
      const updated = prev.map((item) =>
        item.name.toLowerCase().trim() === name.toLowerCase().trim()
          ? { ...item, checked: !item.checked }
          : item,
      );
      saveShoppingList(updated);
      return updated;
    });
  };

  const setShoppingList = (list: ShoppingItem[]) => {
    saveShoppingList(list);
  };

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        loading,
        addRecipe,
        toggleFavorite,
        refresh: loadData,
        updateRecipe,
        deleteRecipe,
        shoppingList,
        addToShoppingList,
        removeFromShoppingList,
        clearShoppingList,
        toggleShoppingItem,
        setShoppingList,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
}

export const useRecipeContext = () => {
  const context = useContext(RecipeContext);
  if (!context)
    throw new Error("useRecipeContext must be used within RecipeProvider");
  return context;
};
