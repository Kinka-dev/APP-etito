// app/scale/[id].tsx
import Text from "@/components/Text";
import { COLORS } from "@/constants/colors";
import { useRecipeContext } from "@/context/RecipeContext";
import { IngredientItem, Recipe } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScaleRecipeScreen() {
  const { recipes, updateRecipe, addRecipe } = useRecipeContext();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [originalRecipe, setOriginalRecipe] = useState<Recipe | null>(null);
  const [workingRecipe, setWorkingRecipe] = useState<Recipe | null>(null);

  const [newServings, setNewServings] = useState("");
  const [editedIngredientId, setEditedIngredientId] = useState<string | null>(
    null,
  );

  // ⭐ Animazioni
  const [animValues, setAnimValues] = useState<Record<string, Animated.Value>>(
    {},
  );

  useEffect(() => {
    const found = recipes.find((r) => r.id === id);
    if (found) {
      setOriginalRecipe(found);
      setWorkingRecipe(found);
      setNewServings(String(found.servings));
    }
  }, [id, recipes]);

  // ⭐ Animazione quando workingRecipe cambia
  useEffect(() => {
    if (!workingRecipe) return;

    const newAnim: Record<string, Animated.Value> = {};

    workingRecipe.ingredients.forEach((group) => {
      group.items.forEach((ing) => {
        newAnim[ing.id] = animValues[ing.id] || new Animated.Value(0);
      });
    });

    setAnimValues(newAnim);

    Object.values(newAnim).forEach((val) => {
      Animated.timing(val, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  }, [workingRecipe]);

  if (!originalRecipe || !workingRecipe) return <Text>Caricamento...</Text>;

  // ---------------------------------------------------------
  // ⭐ RICALCOLO GENERALE
  // ---------------------------------------------------------
  const applyRatio = (ratio: number) => {
    const updatedIngredients = originalRecipe.ingredients.map((group) => ({
      ...group,
      items: group.items.map((ing) => {
        const originalQty = Number(ing.quantity);
        if (isNaN(originalQty)) return { ...ing };

        const newQty = originalQty * ratio;
        return {
          ...ing,
          quantity: newQty.toFixed(2).replace(/\.00$/, ""),
        };
      }),
    }));

    const updatedServings = originalRecipe.servings * ratio;

    setWorkingRecipe({
      ...originalRecipe,
      servings: Number(updatedServings.toFixed(2)),
      ingredients: updatedIngredients,
    });
  };

  // ---------------------------------------------------------
  // ⭐ CAMBIO PORZIONI
  // ---------------------------------------------------------
  const onChangeServings = (value: string) => {
    setEditedIngredientId(null);

    if (value.trim() === "") {
      setNewServings(value);
      return;
    }

    if (isNaN(Number(value))) {
      Alert.alert("Errore", "Inserisci un numero valido");
      return;
    }

    setNewServings(value);

    const ratio = Number(value) / originalRecipe.servings;
    applyRatio(ratio);
  };

  // ---------------------------------------------------------
  // ⭐ CAMBIO INGREDIENTE
  // ---------------------------------------------------------
  const onChangeIngredient = (ing: IngredientItem, value: string) => {
    setEditedIngredientId(ing.id);

    if (value.trim() === "") return;

    if (isNaN(Number(value))) {
      Alert.alert("Errore", "Inserisci solo numeri");
      return;
    }

    const originalQty = Number(ing.quantity);
    const newQty = Number(value);

    if (originalQty === 0) return;

    const ratio = newQty / originalQty;
    applyRatio(ratio);

    const updatedServings = originalRecipe.servings * ratio;
    setNewServings(updatedServings.toFixed(2).replace(/\.00$/, ""));
  };

  // ---------------------------------------------------------
  // ⭐ SALVATAGGIO
  // ---------------------------------------------------------
  const saveChanges = (saveAsNew?: boolean) => {
    const updatedRecipe = {
      ...workingRecipe,
      servings: workingRecipe.servings,
      ingredients: workingRecipe.ingredients,
    };

    if (saveAsNew) {
      const newId = `${originalRecipe.id}_scaled_${Date.now()}`;

      const newRecipe = {
        ...updatedRecipe,
        id: newId,
        title: originalRecipe.title + " (Ricalcolata)",
        createdAt: new Date().toISOString(),
      };

      addRecipe(newRecipe);

      router.replace({
        pathname: "/recipe/[id]",
        params: { id: newId },
      });

      return;
    }

    // ⭐ Sovrascrivi ricetta esistente
    updateRecipe(updatedRecipe);

    router.replace({
      pathname: "/recipe/[id]",
      params: { id: updatedRecipe.id },
    });
  };

  const hasRatio = workingRecipe.servings !== originalRecipe.servings;

  // ---------------------------------------------------------
  // ⭐ UI
  // ---------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* BACK */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
          <Text bold style={styles.backButtonText}>
            Indietro
          </Text>
        </TouchableOpacity>

        {/* HEADER */}
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/convertitore.png")}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text variant="title" style={styles.title}>
            Ricalcola Ricetta
          </Text>
        </View>

        <Text bold style={styles.subtitle}>
          {originalRecipe.title}
        </Text>

        {/* ⭐ PORZIONI FUORI DALLA CARD */}
        <Text bold style={styles.ingredientsTitle}>
          Porzioni:
        </Text>
        <View style={styles.servingsRow}>
          <View style={styles.servingsBox}>
            <Text style={styles.servingsLabel}>Porzioni originali</Text>
            <Text style={styles.servingsValue}>{originalRecipe.servings}</Text>
          </View>

          <Text style={styles.arrow}>➜</Text>

          <View style={styles.servingsBox}>
            <Text style={styles.servingsLabel}>Nuove porzioni</Text>
            <TextInput
              style={styles.servingsInput}
              value={hasRatio ? newServings : ""}
              placeholder={hasRatio ? undefined : "—"}
              onChangeText={onChangeServings}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* ⭐ CARD INGREDIENTI */}
        <View style={styles.summaryCard}>
          <Text bold style={styles.ingredientsTitle}>
            Ingredienti:
          </Text>
          <View style={styles.separator} />

          {/* ⭐ INGREDIENTI */}
          {originalRecipe.ingredients.map((group) =>
            group.items.map((ing) => {
              const workingIng = workingRecipe.ingredients
                .flatMap((g) => g.items)
                .find((i) => i.id === ing.id);

              const newValue = hasRatio ? (workingIng?.quantity ?? "—") : "—";

              return (
                <View key={ing.id}>
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>{ing.name}</Text>

                    <View style={styles.colOriginalBox}>
                      <Text style={styles.originalValue}>{ing.quantity}</Text>
                    </View>
                    <Text style={styles.ingredientArrow}>➜</Text>

                    <View style={styles.colNewBox}>
                      <TextInput
                        style={styles.newValueInput}
                        value={newValue === "—" ? "" : newValue}
                        placeholder={newValue === "—" ? "—" : undefined}
                        onChangeText={(v) => onChangeIngredient(ing, v)}
                        keyboardType="numeric"
                      />
                    </View>

                    <Animated.Text
                      style={[
                        styles.unit,
                        {
                          opacity: animValues[ing.id] ?? 1,
                          transform: [
                            {
                              translateY: animValues[ing.id]
                                ? animValues[ing.id].interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [6, 0],
                                  })
                                : 0,
                            },
                          ],
                        },
                      ]}
                    >
                      {ing.unit}
                    </Animated.Text>
                  </View>

                  <View style={styles.ingredientSeparator} />
                </View>
              );
            }),
          )}
        </View>

        {/* ⭐ SALVA */}
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() =>
            Alert.alert("Salva ricalcolo", "Come vuoi salvare?", [
              { text: "Sovrascrivi", onPress: () => saveChanges() },
              { text: "Salva come nuova", onPress: () => saveChanges(true) },
              { text: "Annulla", style: "cancel" },
            ])
          }
        >
          <Text bold style={styles.applyButtonText}>
            Salva ricalcolo
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------
// ⭐ STILI
// ---------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fffaf0",
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  backButtonText: {
    fontSize: 18,
    color: COLORS.primary,
    marginLeft: 4,
  },

  header: { alignItems: "center" },
  icon: { height: 60, width: 60, marginBottom: 10 },

  title: {
    fontSize: 28,
    textAlign: "center",
    marginBottom: 4,
    color: COLORS.primary,
  },

  subtitle: {
    fontSize: 18,
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
  },

  /* ⭐ PORZIONI FUORI DALLA CARD */
  servingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  servingsBox: {
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    minWidth: 120,
    alignItems: "center",
  },

  servingsLabel: {
    fontSize: 14,
    color: "#777",
    marginBottom: 4,
  },

  servingsValue: {
    fontSize: 20,
    color: COLORS.primary,
  },

  servingsInput: {
    fontSize: 20,
    color: COLORS.primary,
    textAlign: "center",
    paddingVertical: 2,
  },

  arrow: {
    fontSize: 28,
    marginHorizontal: 12,
    color: COLORS.primary,
  },

  summaryCard: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },

  ingredientsTitle: {
    fontSize: 18,
    marginBottom: 20,
    color: COLORS.primary,
    textAlign: "center",
  },

  columnsHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
    paddingRight: 60,
  },

  colOriginal: {
    width: 70,
    textAlign: "center",
    color: "#555",
  },

  colNew: {
    width: 70,
    textAlign: "center",
    color: COLORS.primary,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  rowLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },

  colOriginalBox: {
    width: 60,
    backgroundColor: "#f3f3f3f3",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 6,
  },

  colNewBox: {
    width: 60,
    backgroundColor: "#fde6ffea",
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },

  originalValue: {
    fontSize: 16,
    color: "#444",
  },

  newValueInput: {
    fontSize: 16,
    color: COLORS.primary,
    textAlign: "center",
  },

  unit: {
    width: 40,
    fontSize: 15,
    color: "#777",
    textAlign: "left",
    marginLeft: 6,
    fontFamily: "Outfit-Regular",
  },

  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginBottom: 12,
  },

  ingredientSeparator: {
    height: 1,
    backgroundColor: "#eee",
  },

  applyButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 14,
    marginTop: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  applyButtonText: {
    color: "white",
    fontSize: 18,
  },
  ingredientArrow: {
    color: COLORS.primary,
  },
});
