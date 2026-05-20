// src/context/RecipeContext.tsx
import { DEFAULT_RECIPES } from "@/app/data/defaultRecipes";
import Text from "@/components/Text";
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
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";

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
  getRecipeById: (id: string) => Recipe | null;

  shoppingList: ShoppingItem[];
  addToShoppingList: (ingredients: Ingredient[]) => Promise<void>;
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

  // ⭐ Stato per gestire i duplicati con modal
  const [pendingDuplicate, setPendingDuplicate] = useState<{
    existing: ShoppingItem;
    incoming: Ingredient;
    resolve: (action: "sum" | "duplicate" | "ignore") => void;
  } | null>(null);

  // ------------------------------
  // CARICAMENTO INIZIALE
  // ------------------------------
  useEffect(() => {
    async function load() {
      const saved = await AsyncStorage.getItem("recipes");

      if (!saved) {
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

  // ------------------------------
  // SALVATAGGI
  // ------------------------------
  const saveRecipes = async (newRecipes: Recipe[]) => {
    await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(newRecipes));
    setRecipes(newRecipes);
  };

  const saveShoppingList = async (list: ShoppingItem[]) => {
    await AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(list));
    setShoppingListState(list);
  };

  // ------------------------------
  // CRUD RICETTE
  // ------------------------------
  const getRecipeById = (id: string) =>
    recipes.find((r) => r.id === id) || null;

  const addRecipe = (newRecipe: Recipe) => {
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

  // ------------------------------
  // LISTA DELLA SPESA — VERSIONE DEFINITIVA
  // ------------------------------
  const addToShoppingList = async (ingredients: Ingredient[]) => {
    let updated = [...shoppingList];

    for (const ing of ingredients) {
      const nameKey = ing.name.trim().toLowerCase();
      const existingIndex = updated.findIndex(
        (i) => i.name.trim().toLowerCase() === nameKey,
      );

      // ⭐ Caso: nuovo ingrediente
      if (existingIndex === -1) {
        updated.push({
          id: `shop_${Date.now()}_${Math.random()}`,
          name: ing.name,
          quantity: ing.quantity || "",
          unit: ing.unit || "",
          checked: false,
        });
        continue;
      }

      // ⭐ Caso: duplicato → apriamo modal e aspettiamo scelta
      const action = await new Promise<"sum" | "duplicate" | "ignore">(
        (resolve) => {
          setPendingDuplicate({
            existing: updated[existingIndex],
            incoming: ing,
            resolve,
          });
        },
      );

      if (action === "ignore") continue;

      if (action === "sum") {
        const oldQ = parseFloat(updated[existingIndex].quantity) || 0;
        const newQ = parseFloat(ing.quantity) || 0;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: String(oldQ + newQ),
        };
      }

      if (action === "duplicate") {
        updated.push({
          id: `shop_${Date.now()}_${Math.random()}`,
          name: ing.name,
          quantity: ing.quantity || "",
          unit: ing.unit || "",
          checked: false,
        });
      }
    }

    await saveShoppingList(updated);
  };

  const removeFromShoppingList = (ingredientName: string) => {
    const filtered = shoppingList.filter(
      (i) =>
        i.name.trim().toLowerCase() !== ingredientName.trim().toLowerCase(),
    );
    saveShoppingList(filtered);
  };

  const clearShoppingList = () => saveShoppingList([]);

  const toggleShoppingItem = (name: string) => {
    const updated = shoppingList.map((item) =>
      item.name.trim().toLowerCase() === name.trim().toLowerCase()
        ? { ...item, checked: !item.checked }
        : item,
    );
    saveShoppingList(updated);
  };

  const setShoppingList = (list: ShoppingItem[]) => {
    saveShoppingList(list);
  };

  // ------------------------------
  // MODAL PER I DUPLICATI
  // ------------------------------
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
        getRecipeById,
      }}
    >
      {children}

      {/* ⭐ MODAL DUPLICATI */}
      {pendingDuplicate && (
        <Modal transparent animationType="fade">
          <View style={styles.overlay}>
            <View style={styles.box}>
              <Text bold style={styles.title}>
                Ingrediente già presente
              </Text>

              <Text style={{ marginBottom: 20 }}>
                {pendingDuplicate.incoming.name} è già nella lista.
              </Text>

              <TouchableOpacity
                style={styles.btn}
                onPress={() => {
                  pendingDuplicate.resolve("sum");
                  setPendingDuplicate(null);
                }}
              >
                <Text>Somma quantità</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btn}
                onPress={() => {
                  pendingDuplicate.resolve("duplicate");
                  setPendingDuplicate(null);
                }}
              >
                <Text>Aggiungi comunque</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btn}
                onPress={() => {
                  pendingDuplicate.resolve("ignore");
                  setPendingDuplicate(null);
                }}
              >
                <Text>Ignora</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </RecipeContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  box: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
  },
  btn: {
    paddingVertical: 10,
  },
});

export const useRecipeContext = () => {
  const context = useContext(RecipeContext);
  if (!context)
    throw new Error("useRecipeContext must be used within RecipeProvider");
  return context;
};
