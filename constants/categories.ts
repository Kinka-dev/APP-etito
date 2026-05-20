// src/constants/categories.ts
import { Category } from "@/src/types";

export const CATEGORIES: Category[] = [
  "antipasti",
  "primi",
  "secondi",
  "contorni",
  "zuppe",
  "colazione",
  "panini",
  "dolci",
  "condimenti",
  "impasti",
  "forno",
  "bevande",
  "basi",
  "conserve",
  "altro",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  antipasti: "Antipasti & snack",
  primi: "Primi piatti",
  secondi: "Secondi piatti",
  contorni: "Contorni & verdure",
  zuppe: "Zuppe & vellutate",
  panini: "Panini & street-food",
  colazione: "Colazione & brunch",
  dolci: "Dolci",
  condimenti: "Condimenti & sughi",
  impasti: "Impasti",
  forno: "Prodotti da forno",
  bevande: "Bevande",
  basi: "Basi",
  conserve: "Conserve",
  altro: "Altro ...",
};

export const CATEGORY_IMAGES: Record<Category, any> = {
  antipasti: require("../assets/images/antipasti.png"),
  primi: require("../assets/images/primi.png"),
  secondi: require("../assets/images/secondi.png"),
  contorni: require("../assets/images/verdure.png"),
  zuppe: require("../assets/images/vellutate.png"),
  panini: require("../assets/images/panini.png"),
  colazione: require("../assets/images/colazione.png"),
  dolci: require("../assets/images/dolci.png"),
  condimenti: require("../assets/images/salse.png"),
  bevande: require("../assets/images/bevande.png"),
  impasti: require("../assets/images/impasti.png"),
  forno: require("../assets/images/panetteria.png"),
  basi: require("../assets/images/basi.png"),
  conserve: require("../assets/images/conserve.png"),
  altro: require("../assets/images/altro.png"),
} as const;
