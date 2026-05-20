import { nutritionDB } from "../data/nutritionDB";
import { levenshtein, normalize, tokenize } from "./searchUtils";

// 🔹 Sinonimi base (puoi espanderli)
const SYNONYMS: Record<string, string[]> = {
  melanzana: ["eggplant"],
  zucchina: ["courgette"],
  patata: ["potato"],
  pomodoro: ["tomato"],
};

// 🔹 Ranking per uso (in memoria; se vuoi puoi salvarlo in AsyncStorage)
const usageScore = new Map<string, number>();

export function registerUsage(ingredient: string) {
  const current = usageScore.get(ingredient) ?? 0;
  usageScore.set(ingredient, current + 1);
}

// 🔹 Estrazione ingredienti + indicizzazione per lettera
type IndexedItem = {
  original: string;
  norm: string;
  tokens: string[];
};

const ALL_INGREDIENTS: IndexedItem[] = Object.values(nutritionDB)
  .flatMap((cat: any) => Object.keys(cat))
  .sort()
  .map((name) => ({
    original: name,
    norm: normalize(name),
    tokens: tokenize(name),
  }));

// Indice per prima lettera (riduce il set da confrontare)
const INDEX_BY_FIRST_LETTER: Record<string, IndexedItem[]> = {};
for (const item of ALL_INGREDIENTS) {
  const first = item.norm[0] || "#";
  if (!INDEX_BY_FIRST_LETTER[first]) INDEX_BY_FIRST_LETTER[first] = [];
  INDEX_BY_FIRST_LETTER[first].push(item);
}

// Cache risultati
const cache = new Map<string, string[]>();

// 🔹 Espansione query con sinonimi
function expandQuery(query: string): string[] {
  const base = normalize(query);
  const tokens = tokenize(base);
  const expanded = new Set<string>([base]);

  for (const t of tokens) {
    const syns = SYNONYMS[t];
    if (syns) syns.forEach((s) => expanded.add(s));
  }

  return Array.from(expanded);
}

// 🔹 Seleziona il sottoinsieme indicizzato da confrontare
function getCandidateSet(query: string): IndexedItem[] {
  const n = normalize(query);
  const first = n[0];
  if (first && INDEX_BY_FIRST_LETTER[first]) {
    return INDEX_BY_FIRST_LETTER[first];
  }
  return ALL_INGREDIENTS;
}

// 🔍 Fuzzy search con ranking per uso + sinonimi + indice
export function fuzzySearch(query: string, limit = 10): string[] {
  const qNorm = normalize(query);
  if (!qNorm) return [];

  if (cache.has(qNorm)) return cache.get(qNorm)!;

  const expandedQueries = expandQuery(query);
  const candidates = getCandidateSet(query);

  const scored: { name: string; score: number }[] = [];

  for (const item of candidates) {
    let bestDistance = Infinity;

    for (const q of expandedQueries) {
      const d = levenshtein(q, item.norm);
      if (d < bestDistance) bestDistance = d;
    }

    const startsWith = item.norm.startsWith(qNorm) ? -1 : 0;
    const includesToken = item.tokens.some(
      (t) => qNorm.length > 2 && t.startsWith(qNorm),
    )
      ? -0.5
      : 0;

    const usageBoost = -(usageScore.get(item.original) ?? 0) * 0.1;

    const score = bestDistance + startsWith + includesToken + usageBoost;

    scored.push({ name: item.original, score });
  }

  const result = scored
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((s) => s.name);

  cache.set(qNorm, result);
  return result;
}

// ✨ Autocomplete intelligente
export function autocomplete(query: string, limit = 10): string[] {
  const qNorm = normalize(query);
  if (!qNorm) return [];

  const candidates = getCandidateSet(query);

  const starts = candidates
    .filter((item) => item.norm.startsWith(qNorm))
    .map((i) => i.original);

  const fuzzy = fuzzySearch(query, limit * 2);

  const merged = [...new Set([...starts, ...fuzzy])];

  return merged.slice(0, limit);
}
