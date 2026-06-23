import {
  carni_salumi,
  cereali,
  dolci_creme,
  frutta_fresca,
  latticini_formaggi,
  pane_pizza_prodotti_da_forno,
  pasta_riso_farine,
  pesce_frutti_di_mare,
  verdure,
} from "./nutritionDB";

export const nutritionIndex: Record<
  string,
  { kcal: number; carbs: number; protein: number; fat: number }
> = {
  ...cereali,
  ...pane_pizza_prodotti_da_forno,
  ...pasta_riso_farine,
  ...carni_salumi,
  ...pesce_frutti_di_mare,
  ...latticini_formaggi,
  ...verdure,
  ...frutta_fresca,
  ...dolci_creme,
};

export const nutritionList = Object.keys(nutritionIndex);
