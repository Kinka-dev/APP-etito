import BatteryFill from "@/components/BatteryFill";
import IngredientMacro from "@/components/IngredientMacro";
import Input from "@/components/Input";
import PieChart from "@/components/PieChart";
import Text from "@/components/Text";
import { COLORS } from "@/constants/colors";
import { useRecipeContext } from "@/context/RecipeContext";
import { useIngredientSearch } from "@/hooks/useIngredientSearch";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { calculateMacros } from "../data/nutritionDB";

// ⭐ Hook semplice per countUp + countDown (interi)
function useCounter(value: number, duration = 600) {
  const [display, setDisplay] = useState(Math.round(value));

  useEffect(() => {
    const target = Math.round(value);
    if (target === display) return;

    const diff = target - display;
    const steps = Math.min(Math.abs(diff), 40); // max 40 step per non esagerare
    const stepValue = diff / steps;
    const stepTime = duration / steps;

    let current = display;
    let count = 0;

    const id = setInterval(() => {
      count++;
      current += stepValue;
      if (count >= steps) {
        setDisplay(target);
        clearInterval(id);
      } else {
        setDisplay(Math.round(current));
      }
    }, stepTime);

    return () => clearInterval(id);
  }, [value]);

  return display;
}

export default function CalorieCalculatorScreen() {
  const { id } = useLocalSearchParams();
  const { recipes } = useRecipeContext();

  const recipe = recipes.find((r) => r.id === id);

  const [ingredients, setIngredients] = useState<any[]>([]);
  const [newIngName, setNewIngName] = useState("");
  const [newIngQty, setNewIngQty] = useState("");
  const [newIngUnit, setNewIngUnit] = useState("g");

  const [totalKcal, setTotalKcal] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [totalProtein, setTotalProtein] = useState(0);
  const [totalFat, setTotalFat] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);

  const [kcalPerServing, setKcalPerServing] = useState(0);
  const { query, setQuery, results, onSelect } = useIngredientSearch();

  // ⭐ refs per scroll morbido
  const scrollRef = useRef<ScrollView>(null);
  const [totalsY, setTotalsY] = useState(0);

  const [prevKcal, setPrevKcal] = useState(0);

  // ⭐ Calcolo calorie + macro + peso totale
  useEffect(() => {
    let kcalSum = 0;
    let carbSum = 0;
    let proteinSum = 0;
    let fatSum = 0;
    let weightSum = 0;

    ingredients.forEach((ing) => {
      const name = ing.name.toLowerCase().trim();
      const macros = calculateMacros(name, ing.quantity);

      if (!macros) return;

      kcalSum += macros.kcal;
      carbSum += macros.carbs;
      proteinSum += macros.protein;
      fatSum += macros.fat;

      weightSum += Number(ing.quantity) || 0;
    });

    setTotalKcal(kcalSum);
    setTotalCarbs(carbSum);
    setTotalProtein(proteinSum);
    setTotalFat(fatSum);

    setTotalWeight(weightSum);

    const servings = recipe?.servings ?? 1;
    setKcalPerServing(kcalSum / servings);
  }, [ingredients]);

  // ⭐ Animazione pila calorie (più morbida in su/giù)
  const totalKcalAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const isDecreasing = totalKcal < prevKcal;

    Animated.timing(totalKcalAnim, {
      toValue: totalKcal,
      duration: isDecreasing ? 600 : 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    setPrevKcal(totalKcal);
  }, [totalKcal]);

  // ⭐ CountUp + CountDown numerico per testo e labelBox
  const totalKcalDisplay = useCounter(totalKcal);
  const totalCarbsDisplay = useCounter(totalCarbs);
  const totalProteinDisplay = useCounter(totalProtein);
  const totalFatDisplay = useCounter(totalFat);
  const kcalPerServingDisplay = useCounter(kcalPerServing);

  // ⭐ Aggiungi ingrediente + scroll morbido
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

    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: totalsY - 40,
        animated: true,
      });
    }, 100);
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* HEADER + ADD SECTION */}
      <View>
        <Image
          source={require("../../assets/images/fragola.png")}
          style={{
            width: 150,
            height: 110,
            alignSelf: "center",
            marginTop: 20,
          }}
        />
        <Text bold style={styles.title}>
          Calcolatore Calorie & Macro
        </Text>

        <Text style={styles.subtitle}>
          Inserisci ingredienti e quantità per calcolare calorie e macro totali.
        </Text>

        {/* ⭐ Sezione aggiungi ingrediente */}
        <View style={styles.addBox}>
          <View style={styles.rowSingleLine}>
            {/* INGREDIENTE + DROPDOWN */}
            <View style={styles.nameWrapper}>
              <Input
                placeholder="Ingrediente"
                value={newIngName}
                multiline
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

            {/* QTY */}
            <Input
              placeholder="Qty"
              value={newIngQty}
              onChangeText={setNewIngQty}
              keyboardType="numeric"
              style={styles.qtyInputInline}
            />

            {/* UNIT */}
            <Input
              placeholder="g"
              value={newIngUnit}
              onChangeText={setNewIngUnit}
              style={styles.unitInputInline}
            />

            {/* ADD BUTTON */}
            <TouchableOpacity
              style={styles.addBtnInline}
              onPress={addIngredient}
            >
              <Ionicons name="add" size={22} color="white" />
            </TouchableOpacity>
          </View>
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
      <View
        style={styles.summaryBox}
        onLayout={(e) => setTotalsY(e.nativeEvent.layout.y)}
      >
        <Text bold style={styles.summaryText}>
          Totale:
        </Text>
        <View
          style={{
            flexDirection: "row",
            marginTop: 10,
            marginBottom: 10,
            justifyContent: "center",
          }}
        >
          <BatteryFill animValue={totalKcalAnim} />
          <Text
            bold
            style={[styles.summaryText, { marginTop: 15, marginLeft: 5 }]}
          >
            {totalKcalDisplay} kcal
          </Text>
        </View>

        <View style={{ marginVertical: 20, alignItems: "center" }}>
          <PieChart
            carbs={totalCarbsDisplay}
            protein={totalProteinDisplay}
            fat={totalFatDisplay}
            totalWeight={totalWeight}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    paddingBottom: 20,
    backgroundColor: "white",
  },

  title: {
    fontSize: 30,
    color: "black",
    textAlign: "center",
    marginBottom: 15,
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
    textAlignVertical: "center",
  },

  addBox: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  nameWrapper: {
    flex: 1,
    position: "relative",
    marginTop: 10,
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

  labelText: {
    fontSize: 16,
    color: COLORS.text,
  },

  rowSingleLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  qtyInputInline: {
    width: 70,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    color: COLORS.text,
    textAlignVertical: "center",
  },

  unitInputInline: {
    width: 40,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    color: COLORS.text,
  },

  addBtnInline: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },

  labelContainer: {
    flex: 1,
    alignItems: "center",
  },

  labelBox: {
    backgroundColor: "white",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
