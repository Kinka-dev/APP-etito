// src/types/index.ts
export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
  group?: string;
  checked: boolean;
  linkedRecipeId?: string;
}

export type IngredientItem = {
  id: string;
  name: string;
  quantity: number | "";
  unit: string;
  linkedRecipeId?: string | null;
  kcal?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
};

export type IngredientGroup = {
  id: string;
  title: string;
  items: IngredientItem[];
};

export interface Step {
  id: string;
  description: string;
  imageUri?: string | null;
  checked: boolean;
  title: string;
  textImageUri?: string | null;
  collapsed?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  category: Category;
  prepTime: string;
  cookTime: string;
  servings: number;
  imageUri?: string;
  tags?: string[];
  ingredients: IngredientGroup[];
  steps: Step[];
  notes?: {
    text?: string;
    image?: string | null;
    ocrImage?: string | null;
    mode?: "text" | "ocr" | "photo";
  };
  ingredientsMode?: "text" | "ocr" | "photo";
  ingredientsPhoto?: string | null;
  createdAt: string;
  updatedAt?: string;
  caloriesTotal?: number;
  caloriesPerServing?: number;
  carbsTotal?: number;
  proteinTotal?: number;
  fatTotal?: number;
  isFavorite?: boolean;
}

export type Category =
  | "antipasti"
  | "primi"
  | "secondi"
  | "contorni"
  | "zuppe"
  | "panini"
  | "colazione"
  | "dolci"
  | "condimenti"
  | "impasti"
  | "forno"
  | "bevande"
  | "basi"
  | "conserve"
  | "altro";

export type CategoryLabel = string;
