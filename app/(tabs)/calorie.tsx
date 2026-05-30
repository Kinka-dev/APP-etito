import IngredientMacro from "@/components/IngredientMacro";
import Input from "@/components/Input";
import PieChart from "@/components/PieChart";
import Text from "@/components/Text";
import { COLORS } from "@/constants/colors";
import { useRecipeContext } from "@/context/RecipeContext";
import { useCountUp } from "@/hooks/useCountUp";
import { useIngredientSearch } from "@/hooks/useIngredientSearch";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { calculateMacros } from "../data/nutritionDB";

export default function CalorieCalculatorScreen() {
  const { id } = useLocalSearchParams();
  const { recipes, updateRecipe } = useRecipeContext();

  const recipe = recipes.find((r) => r.id === id);

  const [ingredients, setIngredients] = useState<any[]>([]);
  const [newIngName, setNewIngName] = useState("");
  const [newIngQty, setNewIngQty] = useState("");
  const [newIngUnit, setNewIngUnit] = useState("g");

  const [totalKcal, setTotalKcal] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [totalProtein, setTotalProtein] = useState(0);
  const [totalFat, setTotalFat] = useState(0);

  const [kcalPerServing, setKcalPerServing] = useState(0);
  const { query, setQuery, results, onSelect } = useIngredientSearch();

  // ⭐ Calcolo calorie + macro totali
  useEffect(() => {
    let kcalSum = 0;
    let carbSum = 0;
    let proteinSum = 0;
    let fatSum = 0;

    ingredients.forEach((ing) => {
      const name = ing.name.toLowerCase().trim();
      const macros = calculateMacros(name, ing.quantity);

      if (!macros) return;

      kcalSum += macros.kcal;
      carbSum += macros.carbs;
      proteinSum += macros.protein;
      fatSum += macros.fat;
    });

    setTotalKcal(kcalSum);
    setTotalCarbs(carbSum);
    setTotalProtein(proteinSum);
    setTotalFat(fatSum);

    const servings = recipe?.servings ?? 1;
    setKcalPerServing(kcalSum / servings);
  }, [ingredients]);

  // ⭐ Count-up totali
  const totalKcalAnim = useCountUp(totalKcal, 700);
  const totalCarbsAnim = useCountUp(totalCarbs, 700);
  const totalProteinAnim = useCountUp(totalProtein, 700);
  const totalFatAnim = useCountUp(totalFat, 700);
  const kcalPerServingAnim = useCountUp(Math.round(kcalPerServing), 700);

  const addIngredient = () => {
    if (!newIngName || !newIngQty) return;

    setIngredients((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newIngName.toLowerCase().trim(),
        quantity: Number(newIngQty),
        unit: newIngUnit,
      },
    ]);

    setNewIngName("");
    setNewIngQty("");
    setQuery("");
  };

  const hasPie = totalCarbs + totalProtein + totalFat > 0;

  return (
    <ImageBackground
      source={require("../../assets/images/sfondo9.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text bold style={styles.title}>
          Calcolatore Calorie & Macro
        </Text>

        <Text style={styles.subtitle}>
          Inserisci ingredienti e quantità per calcolare calorie e macro totali.
        </Text>

        {/* ⭐ Sezione aggiungi ingrediente */}
        <View style={styles.addBox}>
          {/* RIGA 1 */}
          <View style={styles.rowTop}>
            <View style={styles.nameWrapper}>
              <Input
                placeholder="Ingrediente"
                value={newIngName}
                onChangeText={(text) => {
                  setNewIngName(text);
                  setQuery(text);
                }}
                style={styles.input}
              />

              {query.length > 0 && results.length > 0 && (
                <View style={styles.suggestionBox}>
                  {results.map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => {
                        setNewIngName(item);
                        onSelect(item);
                        setQuery("");
                      }}
                      style={styles.suggestionItem}
                    >
                      <Text>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={addIngredient}>
              <Ionicons name="add" size={22} color="white" />
            </TouchableOpacity>
          </View>

          {/* RIGA 2 */}
          <View style={styles.rowBottom}>
            <Input
              placeholder="Quantità"
              value={newIngQty}
              onChangeText={setNewIngQty}
              keyboardType="numeric"
              style={styles.qtyInput}
            />

            <Input
              placeholder="g"
              value={newIngUnit}
              onChangeText={setNewIngUnit}
              style={styles.unitInput}
            />
          </View>
        </View>

        {/* ⭐ Lista ingredienti */}
        {ingredients.map((ing) => (
          <IngredientMacro
            key={ing.id}
            ing={ing}
            onDelete={() =>
              setIngredients((prev) => prev.filter((i) => i.id !== ing.id))
            }
          />
        ))}

        {/* ⭐ Totali */}
        <View style={styles.summaryBox}>
          <Text bold style={styles.summaryText}>
            Calorie totali: {totalKcalAnim} kcal
          </Text>

          <View style={{ marginVertical: 20 }}>
            <PieChart
              carbs={totalCarbs}
              protein={totalProtein}
              fat={totalFat}
              size={130}
            />
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    paddingBottom: 20,
  },

  title: {
    fontSize: 30,
    color: "black",
    textAlign: "center",
    marginBottom: 15,
    marginTop: 60,
    paddingHorizontal: 40,
    lineHeight: 30,
  },

  subtitle: {
    textAlign: "center",
    color: COLORS.textLight,
    fontSize: 14,
    marginBottom: 20,
  },

  input: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 10,
    fontFamily: "Outfit-Regular",
    color: COLORS.text,
  },

  addBtn: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 30,
    alignSelf: "flex-start",
  },

  ingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
    gap: 10,
  },

  ingName: { fontSize: 15, color: COLORS.text },
  ingQty: { color: COLORS.textLight },
  ingMacro: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  summaryBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 20,
  },

  summaryText: {
    fontSize: 20,
    marginBottom: 6,
    color: COLORS.text,
    textAlign: "center",
  },

  saveBtn: {
    marginTop: 40,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },

  saveText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  },

  suggestionBox: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 8,
    paddingVertical: 6,
    elevation: 4,
    zIndex: 999,
  },

  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },

  macroItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  macroText: {
    fontSize: 12,
    color: COLORS.textLight,
  },

  legendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    gap: 10,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    fontSize: 10,
  },

  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  addBox: {
    width: "100%",
    gap: 10,
  },

  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: -20,
  },

  nameWrapper: {
    flex: 1,
    position: "relative",
  },

  rowBottom: {
    flexDirection: "row",
    gap: 10,
  },

  qtyInput: {
    flex: 1, // se vuoi ereditare lo stile base
  },

  unitInput: {
    flex: 1,
  },

  bg: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});
