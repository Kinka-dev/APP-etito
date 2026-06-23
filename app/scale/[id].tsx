// app/scale/[id].tsx
import Input from "@/components/Input";
import Text from "@/components/Text";
import { COLORS } from "@/constants/colors";
import { useRecipeContext } from "@/context/RecipeContext";
import { IngredientItem, Recipe } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
  const [showTooltip, setShowTooltip] = useState(false);

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
          quantity: Number(newQty.toFixed(2)),
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fffaf0" }}>
      <View style={{ flex: 1, position: "relative" }}>
        {/* BACK */}
        <TouchableOpacity style={styles.fabBack} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        {/* ⭐ HERO IMAGE */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: originalRecipe.imageUri }}
            style={styles.heroImage}
          />
        </View>

        {/* ⭐ CARD SOVRAPPOSTA */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          style={styles.overlayCard}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text variant="title" style={styles.title}>
              Ricalcola Ricetta
            </Text>
          </View>

          <TouchableOpacity onPress={() => setShowTooltip(true)}>
            <Text style={styles.howItWorksButton}>Come funziona?</Text>
          </TouchableOpacity>

          <Text bold style={styles.subtitle}>
            {originalRecipe.title}
          </Text>

          {/* ⭐ Fattore di ricalcolo con frazione */}
          <View style={styles.factorRow}>
            <Text bold style={styles.factorLabel}>
              Fattore di ricalcolo =
            </Text>

            {/* FRAZIONE */}
            <View style={styles.fractionContainer}>
              <Text style={styles.fractionTop}>nuova quantità</Text>
              <View style={styles.fractionLine} />
              <Text style={styles.fractionBottom}>quantità originale</Text>
            </View>

            {/* VALORE ATTUALE */}
            <Text bold style={styles.factorValue}>
              ={" "}
              {hasRatio
                ? (workingRecipe.servings / originalRecipe.servings).toFixed(3)
                : "—"}
            </Text>
          </View>

          <View style={styles.bigCard}>
            {/* TITOLI COLONNE */}
            <View style={styles.columnsHeader}>
              <Text bold style={styles.colTitle}>
                Originale
              </Text>
              <Text bold style={styles.colTitle}>
                Ricalcolata
              </Text>
            </View>

            {/* ⭐ SEPARATORE VERTICALE UNICO */}
            <View style={styles.verticalSeparator} />

            <View style={styles.row}>
              <Text bold style={[styles.leftLabel, { color: COLORS.primary }]}>
                Porzioni
              </Text>

              {/* Quantità originale */}
              <View style={styles.colOriginal}>
                <Text style={styles.originalValue}>
                  {originalRecipe.servings}
                </Text>
              </View>

              {/* Quantità ricalcolata */}
              <View style={styles.colNew}>
                <TextInput
                  style={styles.newValueInput}
                  value={hasRatio ? newServings : ""}
                  placeholder={hasRatio ? undefined : "—"}
                  onChangeText={onChangeServings}
                  keyboardType="numeric"
                />
                <Text style={styles.unitText}></Text>
              </View>
            </View>

            {/* INGREDIENTI */}
            <Text bold style={[styles.sectionTitle, { marginTop: 20 }]}>
              Ingredienti
            </Text>

            {originalRecipe.ingredients.map((group) =>
              group.items.map((ing) => {
                const workingIng = workingRecipe.ingredients
                  .flatMap((g) => g.items)
                  .find((i) => i.id === ing.id);

                const newValue = hasRatio ? (workingIng?.quantity ?? "—") : "—";

                return (
                  <View key={ing.id} style={styles.row}>
                    {/* Nome ingrediente */}
                    <Text style={styles.leftLabel}>{ing.name}</Text>

                    {/* Quantità originale */}
                    <View style={styles.colOriginal}>
                      <Text style={styles.originalValue}>{ing.quantity}</Text>
                    </View>

                    {/* Quantità ricalcolata */}
                    <View style={styles.colNew}>
                      <Input
                        style={styles.newValueInput}
                        value={newValue === "—" ? "" : String(newValue)}
                        placeholder={newValue === "—" ? "—" : undefined}
                        onChangeText={(v) => onChangeIngredient(ing, v)}
                        keyboardType="numeric"
                      />
                      <Text style={styles.unitText}>{ing.unit}</Text>
                    </View>
                    <View
                      style={{
                        height: 1,
                        backgroundColor: "#9f9696",
                      }}
                    ></View>
                  </View>
                );
              }),
            )}
          </View>
        </ScrollView>
        {/* ⭐ FLOATING ACTION BUTTON */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.fabSave}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert("Salva ricalcolo", "Come vuoi salvare?", [
              { text: "Sovrascrivi", onPress: () => saveChanges() },
              { text: "Salva come nuova", onPress: () => saveChanges(true) },
              { text: "Annulla", style: "cancel" },
            ]);
          }}
        >
          <Text bold style={{ color: "white", fontSize: 14 }}>
            Salva
          </Text>
        </TouchableOpacity>

        {showTooltip && (
          <TouchableOpacity
            style={styles.tooltipOverlay}
            activeOpacity={1}
            onPress={() => setShowTooltip(false)}
          >
            <View style={styles.tooltipBox}>
              <Text bold style={styles.tooltipTitle}>
                Come funziona
              </Text>

              <Text style={styles.tooltipText}>
                Puoi modificare il numero di porzioni oppure inserire la
                quantità di uno qualsiasi degli ingredienti. Lo strumento
                ricalcola automaticamente tutta la ricetta in base al valore
                inserito.
              </Text>

              <TouchableOpacity
                style={styles.tooltipClose}
                onPress={() => setShowTooltip(false)}
              >
                <Text bold style={styles.tooltipCloseText}>
                  Chiudi
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      </View>
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
    width: 50,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: COLORS.secondary,
    padding: 10,
    borderRadius: 30,
  },

  backButtonText: {
    fontSize: 18,
    color: COLORS.primary,
    marginLeft: 4,
  },

  header: { alignItems: "center" },
  icon: { height: 60, width: 60, marginBottom: 10 },

  title: {
    fontSize: 30,
    textAlign: "center",
    marginBottom: 4,
    color: "black",
  },

  subtitle: {
    fontSize: 18,
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
  },

  fabSave: {
    position: "absolute",
    bottom: 24,
    right: 24,
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 30,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 999,
  },

  fabBack: {
    position: "absolute",
    top: 24,
    left: 24,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 30,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 999,
  },

  heroContainer: {
    width: "100%",
    height: 260,
    backgroundColor: "#ddd",
  },

  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  overlayCard: {
    flex: 1,
    marginTop: -40, // ⭐ sovrapposizione di 1 cm
    backgroundColor: "white",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 30,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },

  bigCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 20,
    position: "relative",
  },

  columnsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 60, // allinea i titoli sopra le colonne
    marginBottom: 20,
    marginLeft: 40,
    gap: 30,
  },

  colTitle: {
    fontSize: 16,
    color: COLORS.primary,
  },

  /* ⭐ SEPARATORE VERTICALE UNICO E CENTRATO */
  verticalSeparator: {
    position: "absolute",
    top: 60,
    bottom: 20,
    left: 200, // separatore esattamente al centro
    width: 1,
    backgroundColor: "#ddd",
  },

  sectionTitle: {
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    minHeight: 44,
  },

  leftLabel: {
    width: 100,
    fontSize: 15,
    color: COLORS.text,
  },

  /* ⭐ QUANTITÀ ORIGINALE */
  colOriginal: {
    width: "20%",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 20, // distanza dal separatore
  },

  originalValue: {
    fontSize: 15,
    color: "#444",
  },

  /* ⭐ QUANTITÀ RICALCOLATA */
  colNew: {
    width: "30%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 20, // distanza dal separatore
  },

  newValueInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.primary,
    textAlign: "center",
    fontFamily: "Outfit-SemiBold",
  },

  unitText: {
    fontSize: 14,
    color: "#777",
    marginLeft: 10,
  },

  toolDescription: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    marginBottom: 6,
    paddingHorizontal: 10,
    lineHeight: 18,
  },

  formulaText: {
    textAlign: "center",
    color: "#444",
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 4,
  },

  factorText: {
    textAlign: "center",
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 20,
  },

  howItWorksButton: {
    textAlign: "center",
    color: COLORS.textLight,
    fontSize: 11,
    marginBottom: 10,
    textDecorationLine: "underline",
  },

  tooltipOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 9999,
  },

  tooltipBox: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    width: "90%",
    maxWidth: 380,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },

  tooltipTitle: {
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 10,
    textAlign: "center",
  },

  tooltipText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    marginBottom: 10,
    textAlign: "center",
  },

  tooltipClose: {
    marginTop: 10,
    alignSelf: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },

  tooltipCloseText: {
    color: "white",
    fontSize: 14,
  },

  factorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    flexWrap: "nowrap",
  },

  factorLabel: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 8,
  },

  fractionContainer: {
    alignItems: "center",
  },

  fractionTop: {
    fontSize: 11,
    color: COLORS.textLight,
    marginBottom: 2,
  },

  fractionLine: {
    width: 90,
    height: 1.5,
    backgroundColor: COLORS.textLight,
  },

  fractionBottom: {
    fontSize: 11,
    color: COLORS.textLight,
  },

  factorValue: {
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 8,
  },
});
