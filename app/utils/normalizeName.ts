// app/utils/normalizeName.ts
import Fuse from "fuse.js";
import { nutritionIndex } from "../data/nutritionIndex";

export function extractCoreIngredientNameSmart(name: string) {
  const words = normalizeName(name).split(" ");

  // Prova match diretto parola per parola
  for (const w of words) {
    if (normalizedNutritionIndex[w]) {
      return w;
    }
  }

  // Prova match fuzzy parola per parola
  for (const w of words) {
    const match = findBestIngredientMatch(w);
    if (match) return match;
  }

  // Nessun match → ritorna il nome originale normalizzato
  return normalizeName(name);
}

export const normalizedNutritionIndex = Object.fromEntries(
  Object.entries(nutritionIndex).map(([key, value]) => [
    normalizeName(key),
    value,
  ]),
);

export function normalizeName(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD") // rimuove accenti
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "") // rimuove caratteri strani OCR
    .replace(/\s+/g, " ")
    .trim();
}

const SYNONYMS: Record<string, string> = {
  "olio evo": "olio extravergine di oliva",
  evo: "olio extravergine di oliva",
  "zucchero semolato": "zucchero",
  "zucchero bianco": "zucchero",
  "farina 00": "farina",
  "farina di grano tenero": "farina",
  "sale fino": "sale",
  "sale grosso": "sale",
  "pepe nero": "pepe",
  "pepe macinato": "pepe",
  "panna per dolci": "panna fresca",
};

export const SPECIAL_UNITS: Record<string, number> = {
  "uovo intero": 50,
  uovo: 50,
  uova: 50,
  tuorlo: 18,
  tuorli: 18,
  albume: 30,
  albumi: 30,
  spicchio: 5,
  spicchi: 5,
  bustina: 16,
  bustine: 16,
  cucchiaio: 10,
  cucchiai: 10,
  cucchiaino: 5,
  cucchiaini: 5,
  tazza: 240,
  tazze: 240,
};

let fuse: Fuse<string> | null = null;

try {
  const keys = Object.keys(nutritionIndex || {});
  fuse = new Fuse(keys, {
    threshold: 0.35,
    includeScore: true,
  });
} catch (e) {
  console.warn("Fuse init failed:", e);
  fuse = null;
}

export function findBestIngredientMatch(name: string) {
  const normalized = normalizeName(name);

  // 1) Match diretto
  if (normalizedNutritionIndex[normalized]) {
    return normalized;
  }

  // 2) Match parola-per-parola
  const words = normalized.split(" ");
  for (const w of words) {
    if (normalizedNutritionIndex[w]) {
      return w;
    }
  }

  // 3) Fuzzy match ultra-rigoroso
  if (fuse) {
    const results = fuse.search(normalized) ?? [];

    if (results.length > 0) {
      const best = results[0];

      // ⭐ Regola fondamentale:
      // NON matchare ingredienti che non condividono almeno 3 lettere iniziali
      const samePrefix = best.item.slice(0, 3) === normalized.slice(0, 3);

      if (
        best &&
        typeof best.score === "number" &&
        best.score < 0.25 && // molto più restrittivo
        samePrefix
      ) {
        return best.item;
      }
    }
  }

  return null;
}
