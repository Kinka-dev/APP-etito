// app/recipe/[id].tsx
import SuccessToast from "@/components/SuccessToast";
import Text from "@/components/Text";
import { CATEGORY_IMAGES } from "@/constants/categories";
import { COLORS } from "@/constants/colors";
import { useRecipeContext } from "@/context/RecipeContext";
import { Category, Recipe, Step } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type IngredientItem = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
};

type IngredientGroup = {
  id: string;
  title: string;
  items: IngredientItem[];
};

export default function RecipeDetailScreen() {
  // ⭐ UNA SOLA CHIAMATA
  const params = useLocalSearchParams<{
    id: string;
    updated?: string;
    share?: string;
  }>();

  const id = params.id;
  const updatedRecipe: Recipe | null = params.updated
    ? JSON.parse(params.updated)
    : null;

  const { recipes, deleteRecipe, addToShoppingList } = useRecipeContext();

  // ⭐ Se arriva una ricetta aggiornata via params, usala.
  // Altrimenti cerca nel context.
  const recipe = updatedRecipe ?? recipes.find((r) => r.id === id);

  const [checkedIngredients, setCheckedIngredients] = useState<
    Record<string, boolean>
  >({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [toastVisible, setToastVisible] = useState(false);

  const share = params.share;

  const showAddedToast = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1500);
  };

  useEffect(() => {
    if (share === "1" && recipe) {
      shareRecipePDF(recipe);
    }
  }, [share, recipe]);

  if (!recipe) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Caricamento...</Text>
      </View>
    );
  }

  const ingredientGroups: IngredientGroup[] = Array.isArray(recipe.ingredients)
    ? (recipe.ingredients as any[]).map((g) => ({
        id: g.id,
        title: g.title,
        items: g.items || [],
      }))
    : [];

  const ungroupedIngredients =
    ingredientGroups.find(
      (g) => g.title === "" || g.title === null || g.title === undefined,
    )?.items || [];

  const toggleIngredientCheck = (key: string) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleStepCheck = (index: number) => {
    setCheckedSteps((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const addSingleIngredient = (ing: any) => {
    addToShoppingList([ing]);
    Alert.alert(
      "Aggiunto",
      `${ing.quantity || ""} ${ing.unit || ""} ${ing.name}`,
    );
  };

  const handleDelete = () => {
    Alert.alert("Elimina ricetta", "Sei sicuro?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: () => {
          deleteRecipe(recipe.id);
          router.back();
        },
      },
    ]);
  };

  async function uriToBase64(uri: string) {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch (e) {
      console.log("Errore conversione base64:", e);
      return "";
    }
  }

  async function loadFontBase64() {
    const asset = Asset.fromModule(
      require("../../assets/fonts/Outfit-Regular.ttf"),
    );
    await asset.downloadAsync();

    const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
      encoding: "base64",
    });

    return `data:font/ttf;base64,${base64}`;
  }

  async function loadLogoBase64() {
    const asset = Asset.fromModule(require("../../assets/images/logo.png"));
    await asset.downloadAsync();

    const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
      encoding: "base64",
    });

    return `data:image/png;base64,${base64}`;
  }

  async function generateRecipePDF(recipe: Recipe) {
    const fontBase64 = await loadFontBase64();
    const logoBase64 = await loadLogoBase64();

    const mainImage = recipe.imageUri ? await uriToBase64(recipe.imageUri) : "";

    const stepsWithImages = await Promise.all(
      recipe.steps.map(async (step) => ({
        ...step,
        imageBase64: step.imageUri ? await uriToBase64(step.imageUri) : "",
      })),
    );

    const html = `...`; // ⬅️ qui tieni il tuo HTML esistente, non lo tocco per brevità

    const { uri } = await Print.printToFileAsync({ html });
    return uri;
  }

  async function shareRecipePDF(recipe: Recipe) {
    try {
      const uri = await generateRecipePDF(recipe);
      await Sharing.shareAsync(uri);
    } catch (err) {
      console.log("ERRORE PDF:", err);
      Alert.alert("Errore", "Impossibile generare il PDF");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Icona Categoria + Titolo centrato */}
        <View style={styles.titleContainer}>
          <Image
            source={CATEGORY_IMAGES[recipe.category as Category]}
            style={styles.icon}
          />
          <Text variant="title" style={styles.title}>
            {recipe.title}
          </Text>
        </View>

        {/* Info centrata */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <Text variant="small" style={styles.infoText}>
              {recipe.prepTime} min
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={20} color={COLORS.primary} />
            <Text variant="small" style={styles.infoText}>
              {recipe.servings} porz.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons
              name="pricetag-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text variant="small" style={styles.infoText}>
              {recipe.category}
            </Text>
          </View>
        </View>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {recipe.tags.map((tag: string, i: number) => (
              <View key={i} style={styles.tag}>
                <Text variant="small" style={styles.tagText}>
                  #{tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Foto principale */}
        <View style={styles.photoContainer}>
          <Image
            source={
              recipe.imageUri
                ? { uri: recipe.imageUri }
                : require("../../assets/images/default.jpg")
            }
            style={styles.mainImage}
          />
        </View>

        {(recipe.ingredientsPhoto ||
          recipe.ingredientsOcrImage ||
          ingredientGroups.some((g) => g.items.length > 0)) && (
          <View style={styles.section}>
            <Text variant="heading" style={styles.sectionTitle}>
              Ingredienti
            </Text>

            <View style={styles.separator} />

            {/* ⭐ 1. FOTO INGREDIENTI */}
            {recipe.ingredientsPhoto && (
              <Image
                source={{ uri: recipe.ingredientsPhoto }}
                style={styles.stepImage}
              />
            )}

            {/* ⭐ 2. OCR INGREDIENTI */}
            {!recipe.ingredientsPhoto && recipe.ingredientsOcrImage && (
              <Image
                source={{ uri: recipe.ingredientsOcrImage }}
                style={styles.stepImage}
              />
            )}

            {/* ⭐ 3. LISTA INGREDIENTI (solo se NON ci sono foto/OCR) */}
            {!recipe.ingredientsPhoto &&
              !recipe.ingredientsOcrImage &&
              (ungroupedIngredients.length > 0 ||
                ingredientGroups.some((g) => g.items.length > 0)) && (
                <>
                  {/* Ingredienti senza gruppo */}
                  {ungroupedIngredients.length > 0 &&
                    ungroupedIngredients.map(
                      (ing: IngredientItem, index: number) => {
                        const key = `free-${index}`;
                        const isChecked = checkedIngredients[key] || false;

                        return (
                          <View key={ing.id} style={styles.ingredientRow}>
                            <TouchableOpacity
                              style={styles.checkbox}
                              onPress={() => toggleIngredientCheck(key)}
                            >
                              <Ionicons
                                name={isChecked ? "checkbox" : "square-outline"}
                                size={26}
                                color={isChecked ? "#3a8654" : "#666"}
                              />
                            </TouchableOpacity>

                            {/* DIVIDER VERTICALE */}
                            <View style={styles.verticalDivider} />

                            <View style={styles.ingredientMain}>
                              <Text
                                style={[
                                  styles.ingredientName,
                                  isChecked && styles.checkedText,
                                ]}
                              >
                                {ing.name}
                              </Text>
                            </View>

                            <Text style={styles.quantityText}>
                              {ing.quantity} {ing.unit}
                            </Text>

                            <TouchableOpacity
                              style={styles.addSingleBtn}
                              onPress={() => addSingleIngredient(ing)}
                            >
                              <Ionicons
                                name="add-circle-outline"
                                size={24}
                                color={COLORS.primary}
                              />
                            </TouchableOpacity>
                          </View>
                        );
                      },
                    )}

                  {/* Gruppi */}
                  {ingredientGroups
                    .filter((g) => g.items.length > 0)
                    .map((group: IngredientGroup, groupIndex: number) => (
                      <View key={group.id} style={{ marginBottom: 20 }}>
                        <Text variant="title" style={styles.ingredientGroup}>
                          {group.title}
                        </Text>

                        {group.items.map(
                          (ing: IngredientItem, index: number) => {
                            const key = `${groupIndex}-${index}`;
                            const isChecked = checkedIngredients[key] || false;

                            return (
                              <View key={ing.id} style={styles.ingredientRow}>
                                <TouchableOpacity
                                  style={styles.checkbox}
                                  onPress={() => toggleIngredientCheck(key)}
                                >
                                  <Ionicons
                                    name={
                                      isChecked ? "checkbox" : "square-outline"
                                    }
                                    size={26}
                                    color={isChecked ? "#3a8654" : "#666"}
                                  />
                                </TouchableOpacity>

                                {/* DIVIDER VERTICALE */}
                                <View style={styles.verticalDivider} />

                                <View style={styles.ingredientMain}>
                                  <Text
                                    style={[
                                      styles.ingredientName,
                                      isChecked && styles.checkedText,
                                    ]}
                                  >
                                    {ing.name}
                                  </Text>
                                </View>

                                <Text style={styles.quantityText}>
                                  {ing.quantity} {ing.unit}
                                </Text>

                                <TouchableOpacity
                                  style={styles.addSingleBtn}
                                  onPress={() => addSingleIngredient(ing)}
                                >
                                  <Ionicons
                                    name="add-circle-outline"
                                    size={24}
                                    color={COLORS.primary}
                                  />
                                </TouchableOpacity>
                              </View>
                            );
                          },
                        )}
                      </View>
                    ))}
                </>
              )}
          </View>
        )}

        {/* PROCEDIMENTO */}
        {recipe.steps && recipe.steps.length > 0 && (
          <View style={styles.section}>
            <Text variant="heading" style={styles.sectionTitle}>
              Procedimento
            </Text>

            <View style={styles.separator} />

            {recipe.steps.map((step: Step, index: number) => {
              const isChecked = checkedSteps[index] || false;
              const isEven = index % 2 === 0;

              return (
                <View key={index} style={styles.stepItem}>
                  {/* Header step */}
                  <View style={styles.stepHeader}>
                    {/* Numero step (solo se più di uno) */}
                    {recipe.steps.length > 1 && (
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </View>
                    )}

                    {/* Titolo step */}
                    <Text variant="title" style={styles.stepTitle}>
                      {step.title && step.title.trim().length > 0
                        ? step.title
                        : recipe.steps.length === 1
                          ? "Passaggio"
                          : `Passaggio ${index + 1}`}
                    </Text>
                  </View>

                  {/* Contenuto step */}
                  <View style={isEven ? styles.stepEven : styles.stepOdd}>
                    {step.imageUri && (
                      <Image
                        source={{ uri: step.imageUri }}
                        style={styles.stepImage}
                      />
                    )}

                    {step.textImageUri && (
                      <Image
                        source={{ uri: step.textImageUri }}
                        style={[styles.stepImage, { marginTop: 12 }]}
                      />
                    )}

                    <Text
                      style={[styles.stepText, isChecked && styles.checkedText]}
                    >
                      {step.description || ""}
                    </Text>
                  </View>

                  {/* Timer */}
                  <View style={styles.stepFooter}>
                    <TouchableOpacity
                      style={styles.timerButton}
                      onPress={() =>
                        router.push({
                          pathname: "/timer",
                          params: { title: step.title || `Step ${index + 1}` },
                        })
                      }
                    >
                      <Ionicons
                        name="timer-outline"
                        size={26}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.stepDivider} />
                </View>
              );
            })}
          </View>
        )}

        {/* NOTE E CURIOSITÀ */}
        {(() => {
          const notes =
            typeof recipe.notes === "string"
              ? { text: recipe.notes, image: null, mode: "text" }
              : recipe.notes;

          const images = notes?.image;
          const text = notes?.text;

          if (!text && (!images || images.length === 0)) return null;

          return (
            <View style={styles.section}>
              <Text variant="heading" style={styles.sectionTitle}>
                Note e curiosità
              </Text>

              <View style={styles.separator} />

              {/* Foto note */}
              {images && images.length > 0 && (
                <View style={{ gap: 12, marginBottom: 16 }}>
                  {notes.image && (
                    <Image
                      source={{ uri: notes.image }}
                      style={{
                        width: "100%",
                        height: 500,
                        borderRadius: 12,
                        backgroundColor: "#eee",
                        marginBottom: 10,
                      }}
                    />
                  )}
                </View>
              )}

              {/* Testo note */}
              {text && <Text style={styles.notesText}>{text}</Text>}
            </View>
          );
        })()}

        {/* CARD DEI PULSANTI */}
        <View style={styles.actionsGrid}>
          {/* Modifica */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/edit/${recipe.id}` as any)}
          >
            <Ionicons
              name="create-outline"
              size={22}
              style={styles.actionIcon}
            />
            <Text variant="title" style={styles.actionText}>
              Modifica
            </Text>
          </TouchableOpacity>

          {/* Elimina */}
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Ionicons
              name="trash-outline"
              size={22}
              style={styles.actionIcon}
            />
            <Text variant="title" style={styles.actionText}>
              Elimina
            </Text>
          </TouchableOpacity>

          {/* Condividi */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => shareRecipePDF(recipe)}
          >
            <Ionicons
              name="share-outline"
              size={22}
              style={styles.actionIcon}
            />
            <Text variant="title" style={styles.actionText}>
              Condividi
            </Text>
          </TouchableOpacity>

          {/* Ricalcola */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/scale/${recipe.id}` as any)}
          >
            <Ionicons
              name="calculator-outline"
              size={22}
              style={styles.actionIcon}
            />
            <Text variant="title" style={styles.actionText}>
              Ricalcola
            </Text>
          </TouchableOpacity>

          {/* Aggiungi alla spesa */}
          <TouchableOpacity
            style={[styles.actionButton, styles.fullWidthButton]}
            onPress={() => {
              addToShoppingList(
                recipe.ingredients.flatMap((group) =>
                  group.items.map((ing) => ({ ...ing, checked: false })),
                ),
              );
              showAddedToast();
            }}
          >
            <Ionicons name="cart-outline" size={22} style={styles.actionIcon} />
            <Text variant="title" style={styles.actionText}>
              Aggiungi alla spesa
            </Text>
          </TouchableOpacity>
        </View>

        <SuccessToast
          visible={toastVisible}
          message="Ingredienti aggiunti alla spesa"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 60,
    backgroundColor: "#fffaf0",
  },
  scrollContent: { paddingBottom: 40 },
  titleContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    textAlign: "center",
    marginTop: 8,
    color: COLORS.text,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginBottom: 20,
  },
  infoItem: { alignItems: "center" },
  infoText: { marginTop: 4, fontSize: 15, color: COLORS.text },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  tag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: { fontSize: 14, color: COLORS.text },
  photoContainer: { width: "100%", marginBottom: 24 },
  mainImage: { width: "100%", height: 200 },
  section: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 25,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    fontSize: 21,
    marginBottom: 16,
    color: COLORS.text,
    textAlign: "center",
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  checkbox: {
    marginRight: 10,
  },
  ingredientMain: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    color: COLORS.text,
  },
  checkedText: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  quantityText: {
    fontSize: 16,
    color: COLORS.text,
    marginRight: 8,
  },
  addSingleBtn: {
    paddingLeft: 4,
  },
  ingredientGroup: {
    fontSize: 18,
    marginBottom: 8,
    color: COLORS.text,
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginBottom: 12,
  },
  icon: {
    height: 60,
    width: 60,
    marginBottom: 10,
    alignSelf: "center",
  },
  stepItem: { marginBottom: 20 },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    textAlign: "center",
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  stepNumberText: { color: "white", fontWeight: "bold" },
  stepTitle: { fontSize: 18, color: COLORS.text, textAlign: "center" },
  stepEven: { marginTop: 10 },
  stepOdd: { marginTop: 10 },
  stepImage: {
    width: "100%",
    height: 500,
    borderRadius: 12,
    marginBottom: 12,
  },
  stepText: { fontSize: 16, color: COLORS.text, padding: 10 },
  stepFooter: { marginTop: 10, alignItems: "flex-end" },
  timerButton: { padding: 6 },
  stepDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginTop: 20,
  },

  notesText: {
    fontSize: 16,
    color: COLORS.text,
    paddingHorizontal: 10,
    paddingTop: -30,
  },

  actionsGrid: {
    marginHorizontal: 16,
    marginBottom: 40,
    padding: 18,

    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  actionButton: {
    width: "48%",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidthButton: { width: "100%" },
  actionIcon: { color: "white", marginBottom: 6 },
  actionText: { color: "white", fontSize: 16, textAlign: "center" },
  verticalDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "#e0e0e0",
    marginHorizontal: 8,
  },
});
