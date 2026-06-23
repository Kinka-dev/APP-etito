import { nutritionDB } from "../data/nutritionDB";

export function debugDuplicateIngredientKeys() {
  console.log("🔍 Analisi duplicati tra TUTTI i gruppi…");

  const occurrences: Record<string, string[]> = {};

  // Scansiona ogni gruppo
  for (const [groupName, groupObj] of Object.entries(nutritionDB)) {
    if (!groupObj || typeof groupObj !== "object") continue;

    // Scansiona ogni ingrediente dentro il gruppo
    for (const ingredientName of Object.keys(groupObj)) {
      if (!occurrences[ingredientName]) {
        occurrences[ingredientName] = [groupName];
      } else {
        occurrences[ingredientName].push(groupName);
      }
    }
  }

  // Filtra quelli presenti in più gruppi
  const duplicates = Object.entries(occurrences).filter(
    ([_, groups]) => groups.length > 1,
  );

  if (duplicates.length === 0) {
    console.log("✅ Nessun ingrediente duplicato tra i gruppi.");
  } else {
    console.log("⚠️ Ingredienti DUPLICATI trovati:");
    duplicates.forEach(([name, groups]) => {
      console.log(` - "${name}" → presente in gruppi: [${groups.join(", ")}]`);
    });
  }

  console.log("🔍 Analisi completata.");
}
