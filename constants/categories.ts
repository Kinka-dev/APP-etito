// src/constants/categories.ts
import { Category } from "@/src/types";

export const CATEGORIES: Category[] = [
  "colazione",
  "pasta-riso",
  "secondi",
  "verdure",
  "zuppe-vellutate",
  "panini-wrap",
  "snack",
  "dolci",
  "creme-salse",
  "impasti",
  "bevande",
  "altro",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  colazione: "Colazione",
  "pasta-riso": "Primi",
  secondi: "Secondi",
  verdure: "Verdure",
  "zuppe-vellutate": "Zuppe/Vellutate",
  "panini-wrap": "Panini/Wrap",
  snack: "Snack",
  dolci: "Dolci",
  "creme-salse": "Creme/Salse",
  impasti: "Impasti",
  bevande: "Bevande",
  altro: "Altro",
};

export const CATEGORY_IMAGES: Record<Category, any> = {
  colazione: require("../assets/images/colazione.png"),
  "pasta-riso": require("../assets/images/pasta.png"),
  secondi: require("../assets/images/secondi.png"),
  verdure: require("../assets/images/verdure.png"),
  "zuppe-vellutate": require("../assets/images/zuppe.png"),
  "panini-wrap": require("../assets/images/panini.png"),
  snack: require("../assets/images/snacks.png"),
  dolci: require("../assets/images/dolci.png"),
  "creme-salse": require("../assets/images/salse.png"),
  bevande: require("../assets/images/bevande.png"),
  impasti: require("../assets/images/impasti.png"),
  altro: require("../assets/images/pizza.png"),
} as const;
