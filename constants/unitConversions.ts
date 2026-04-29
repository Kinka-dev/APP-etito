// src/constants/unitConversions.ts

export type UnitSystem = "metric" | "imperial";

export interface UnitConversion {
  from: string; // es. "g", "ml", "tsp"
  to: string; // es. "cups", "oz", "tbsp"
  factor: number; // moltiplicatore: imperial = metric * factor
  roundTo?: number; // arrotondamento consigliato
}

// Conversioni principali (da metrico → imperiale e viceversa)
export const CONVERSIONS: UnitConversion[] = [
  // Peso
  { from: "g", to: "oz", factor: 0.035274, roundTo: 2 },
  { from: "kg", to: "lb", factor: 2.20462, roundTo: 2 },
  { from: "oz", to: "g", factor: 28.3495, roundTo: 0 },
  { from: "lb", to: "kg", factor: 0.453592, roundTo: 3 },

  // Volume liquidi
  { from: "ml", to: "fl oz", factor: 0.033814, roundTo: 2 },
  { from: "l", to: "cups", factor: 4.22675, roundTo: 2 },
  { from: "cups", to: "ml", factor: 236.588, roundTo: 0 },
  { from: "fl oz", to: "ml", factor: 29.5735, roundTo: 0 },

  // Volume piccoli
  { from: "ml", to: "tsp", factor: 0.202884, roundTo: 1 },
  { from: "ml", to: "tbsp", factor: 0.067628, roundTo: 2 },
  { from: "tsp", to: "ml", factor: 4.92892, roundTo: 0 },
  { from: "tbsp", to: "ml", factor: 14.7868, roundTo: 0 },

  // Altri comuni
  { from: "g", to: "cups", factor: 0.00422675, roundTo: 3 }, // approssimativo (dipende dall'ingrediente)
  { from: "cups", to: "g", factor: 236.588, roundTo: 0 }, // approssimativo
];

// Mappa rapida per trovare la conversione inversa
export function getInverseConversion(
  from: string,
  to: string,
): UnitConversion | null {
  return CONVERSIONS.find((c) => c.from === to && c.to === from) || null;
}
