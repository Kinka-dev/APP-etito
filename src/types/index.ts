// src/types/index.ts
export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
  group?: string;
  checked: boolean;
}

export type IngredientItem = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
};

export type IngredientGroup = {
  id: string;
  title: string;
  items: IngredientItem[];
};

export interface Step {
  description: string;
  imageUri?: string | null;
  checked: boolean;
  title: string;
  textImageUri?: string | null;
}

export interface Recipe {
  id: string;
  title: string;
  category: Category;
  prepTime: number;
  servings: number;
  imageUri?: string;
  tags?: string[];
  ingredients: IngredientGroup[];
  steps: Step[];
  notes?: {
    text?: string;
    image?: string | null;
    mode?: "text" | "ocr" | "photo";
  };
  ingredientsMode?: "text" | "ocr" | "photo";
  ingredientsOcrImage?: string | null;
  ingredientsPhoto?: string | null;

  createdAt: string;
  updatedAt?: string;
  isFavorite?: boolean;
}

export type Category =
  | "colazione"
  | "pasta-riso"
  | "secondi"
  | "verdure"
  | "zuppe-vellutate"
  | "panini-wrap"
  | "snack"
  | "dolci"
  | "creme-salse"
  | "impasti"
  | "bevande"
  | "altro";

export type CategoryLabel = string;
