import { useCallback, useEffect, useState } from "react";
import {
    autocomplete,
    fuzzySearch,
    registerUsage,
} from "../app/utils/searchEngine";

// Debounce helper
function debounce(fn: Function, delay: number) {
  let timer: any;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function useIngredientSearch(limit = 10) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search
  const runSearch = useCallback(
    debounce((text: string) => {
      if (!text) {
        setResults([]);
        setLoading(false);
        return;
      }

      const suggestions = autocomplete(text, limit);
      setResults(suggestions);
      setLoading(false);
    }, 120),
    [],
  );

  // Trigger search on query change
  useEffect(() => {
    setLoading(true);
    runSearch(query);
  }, [query]);

  // Quando l’utente seleziona un ingrediente
  const onSelect = useCallback((name: string) => {
    registerUsage(name); // aumenta il ranking
    setQuery(name);
  }, []);

  // Quando l’utente conferma la ricerca
  const onSubmit = useCallback(() => {
    if (!query) return [];
    const matches = fuzzySearch(query, limit);
    if (matches.length > 0) registerUsage(matches[0]);
    return matches;
  }, [query]);

  return {
    query,
    setQuery,
    results,
    loading,
    onSelect,
    onSubmit,
  };
}
