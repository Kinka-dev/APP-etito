// app/recipe/[id].tsx
import BatteryFill from "@/components/BatteryFill";
import GlassBarChart from "@/components/PieChart";
import { IngredientsModal } from "@/components/RecipeCard";
import SuccessToast from "@/components/SuccessToast";
import Text from "@/components/Text";
import { CATEGORY_LABELS } from "@/constants/categories";
import { COLORS } from "@/constants/colors";
import { useRecipeContext } from "@/context/RecipeContext";
import { Recipe } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Animated as RNAnimated,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import ImageViewer from "react-native-image-zoom-viewer";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { shareRecipePDF } from "../utils/shareRecipePDF";
type IngredientItem = {
  id: string;
  name: string;
  quantity: number | "";
  unit: string;
  linkedRecipeId?: string | null;
  kcal?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
};

type IngredientGroup = {
  id: string;
  title: string;
  items: IngredientItem[];
};

export default function RecipeDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    updated?: string;
    share?: string;
  }>();

  const id = params.id;

  const updatedRecipe: Recipe | null = params.updated
    ? JSON.parse(params.updated)
    : null;

  const { recipes } = useRecipeContext();
  const recipe = updatedRecipe ?? recipes.find((r) => r.id === id);

  // ⭐ Loading gestito qui, senza hook dopo
  if (!recipe) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Caricamento...</Text>
      </View>
    );
  }

  return <RecipeDetailInner recipeProp={recipe} shareProp={params.share} />;
}

function RecipeDetailInner({
  recipeProp,
  shareProp,
}: {
  recipeProp: Recipe;
  shareProp?: string;
}) {
  const recipe = recipeProp;
  const share = shareProp;

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
  // const recipe = updatedRecipe ?? recipes.find((r) => r.id === id);

  const [checkedIngredients, setCheckedIngredients] = useState<
    Record<string, boolean>
  >({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [toastVisible, setToastVisible] = useState(false);
  const [fullImage, setFullImage] = useState<string | null>(null);

  const [menuVisible, setMenuVisible] = useState(false);
  const [showMacros, setShowMacros] = useState(false);

  const [activeTab, setActiveTab] = useState<"ingredients" | "steps">(
    "ingredients",
  );

  const [modalVisible, setModalVisible] = useState(false);

  // const share = params.share;
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(0);

  const [pieY, setPieY] = useState(0);

  // Estrai tutti gli ingredienti della ricetta

  const showAddedToast = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1500);
  };

  useEffect(() => {
    if (share === "1" && recipe) {
      shareRecipePDF(recipe);
    }
  }, [share, recipe]);

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 350 });

    slideUp.value = withTiming(1, {
      duration: 1000,
      easing: Easing.bezier(0.22, 1, 0.56, 1),
    });
  }, []);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(slideUp.value, [0, 1], [500, 0]),
      },
    ],
    opacity: slideUp.value,
  }));

  const flatIngredients = recipe.ingredients.flatMap((group) => group.items);

  // Macro totali
  const totalKcal = flatIngredients.reduce(
    (sum, ing) => sum + (ing.kcal ?? 0),
    0,
  );
  const totalCarbs = flatIngredients.reduce(
    (sum, ing) => sum + (ing.carbs ?? 0),
    0,
  );
  const totalProtein = flatIngredients.reduce(
    (sum, ing) => sum + (ing.protein ?? 0),
    0,
  );
  const totalFat = flatIngredients.reduce(
    (sum, ing) => sum + (ing.fat ?? 0),
    0,
  );
  const totalWeight = flatIngredients.reduce(
    (sum, ing) => sum + Number(ing.quantity || 0),
    0,
  );

  const servings =
    recipe?.servings && recipe.servings > 0 ? recipe.servings : 1;

  const kcalPerServing = totalKcal / servings;
  const carbsPerServing = totalCarbs / servings;
  const proteinPerServing = totalProtein / servings;
  const fatPerServing = totalFat / servings;
  const weightPerServing = totalWeight / servings;

  // ⭐ Gruppi veri (escludiamo "ungrouped")
  const ingredientGroups: IngredientGroup[] = Array.isArray(recipe.ingredients)
    ? (recipe.ingredients as any[])
        .filter((g) => g.id !== "ungrouped")
        .map((g) => ({
          id: g.id,
          title: g.title,
          items: g.items || [],
        }))
    : [];

  // ⭐ Ingredienti liberi (gruppo "ungrouped")
  const ungroupedIngredients =
    Array.isArray(recipe.ingredients) &&
    recipe.ingredients.find((g) => g.id === "ungrouped")
      ? recipe.ingredients.find((g) => g.id === "ungrouped")!.items
      : [];

  const totalMacros = useMemo(() => {
    const acc = { kcal: 0, carbs: 0, protein: 0, fat: 0 };

    ingredientGroups.forEach((group) => {
      group.items.forEach((ing) => {
        const q = Number(ing.quantity) || 0;

        acc.kcal += ((ing.kcal || 0) * q) / 100;
        acc.carbs += ((ing.carbs || 0) * q) / 100;
        acc.protein += ((ing.protein || 0) * q) / 100;
        acc.fat += ((ing.fat || 0) * q) / 100;
      });
    });

    return acc;
  }, [ingredientGroups]);

  const toggleIngredientCheck = (key: string) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const addSingleIngredient = (ing: any) => {
    addToShoppingList([ing]);
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

  const totalKcalAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(totalKcalAnim, {
      toValue: totalKcal,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [totalKcal]);

  // ⭐ NAVIGAZIONE ALFABETICA
  const sortedRecipes = useMemo(
    () =>
      [...recipes].sort((a, b) =>
        a.title.toLowerCase().localeCompare(b.title.toLowerCase()),
      ),
    [recipes],
  );

  const currentIndex = sortedRecipes.findIndex((r) => r.id === recipe.id);
  const prevRecipe = currentIndex > 0 ? sortedRecipes[currentIndex - 1] : null;
  const nextRecipe =
    currentIndex < sortedRecipes.length - 1
      ? sortedRecipes[currentIndex + 1]
      : null;

  const scrollRef = useRef<ScrollView>(null);

  return (
    <SafeAreaView style={styles.container}>
      {/* ⭐ FOTO PRINCIPALE */}
      <ScrollView ref={scrollRef}>
        <Animated.View style={[styles.heroContainer, heroStyle]}>
          <Image
            source={
              recipe.imageUri
                ? { uri: recipe.imageUri }
                : require("../../assets/images/default.jpg")
            }
            style={styles.heroImage}
            resizeMode="cover"
          />

          {/* FRECCIA SINISTRA */}
          {prevRecipe && (
            <TouchableOpacity
              style={styles.arrowLeft}
              onPress={() => router.push(`/recipe/${prevRecipe.id}`)}
            >
              <Ionicons name="chevron-back" size={34} color="#000000" />
            </TouchableOpacity>
          )}

          {/* FRECCIA DESTRA */}
          {nextRecipe && (
            <TouchableOpacity
              style={styles.arrowRight}
              onPress={() => router.push(`/recipe/${nextRecipe.id}`)}
            >
              <Ionicons name="chevron-forward" size={34} color="#000000" />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* ⭐ CARD SOVRAPPOSTA */}
        <Animated.View style={[styles.cardScroll, cardStyle]}>
          <View style={styles.card}>
            {/* TITOLO */}
            <Text variant="title" style={styles.title}>
              {recipe.title}
            </Text>
            <View
              style={{
                alignItems: "center",
                paddingTop: 10,
                paddingBottom: 30,
              }}
            >
              <Text
                bold
                style={[
                  styles.infoValue,
                  {
                    color: COLORS.primary,
                  },
                ]}
              >
                ••• {CATEGORY_LABELS[recipe.category]} •••
              </Text>
            </View>

            {/* INFO IN RIGA */}
            <View style={styles.infoRow}>
              <View style={styles.infoColumn}>
                {" "}
                <Ionicons
                  name="people-outline"
                  size={25}
                  color={COLORS.primary}
                />
                <Text variant="small" style={styles.infoValue}>
                  Porzioni:
                </Text>
                <Text bold style={styles.infoValue}>
                  {recipe.servings}
                </Text>
              </View>
              <View style={styles.infoColumn}>
                {" "}
                <Ionicons
                  name="time-outline"
                  size={25}
                  color={COLORS.primary}
                />
                <Text variant="small" style={styles.infoValue}>
                  Preparazione:
                </Text>
                <Text bold style={styles.infoValue}>
                  {recipe.prepTime}
                </Text>
              </View>

              <View style={styles.infoColumn}>
                <Ionicons
                  name="flame-outline"
                  size={25}
                  color={COLORS.primary}
                />
                <Text variant="small" style={styles.infoValue}>
                  Cottura:
                </Text>
                <Text bold style={styles.infoValue}>
                  {recipe.cookTime}
                </Text>
              </View>
            </View>

            {/* TAGS */}
            {recipe.tags && recipe.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {recipe.tags.map((tag, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* ⭐ NOTE INTEGRATE */}
            {recipe.notes?.text && (
              <View style={styles.notesInline}>
                <Text variant="heading" style={styles.sectionTitle}>
                  Note e Curiosità
                </Text>
                <Text style={styles.notesInlineText}>{recipe.notes.text}</Text>
              </View>
            )}

            {/* ⭐ TOGGLE MACRO */}
            <TouchableOpacity
              onPress={() => {
                const next = !showMacros;
                setShowMacros(next);

                if (next) {
                  setTimeout(() => {
                    // primo micro-scroll (avvicina)
                    scrollRef.current?.scrollTo({
                      y: pieY - 20,
                      animated: true,
                    });

                    // secondo micro-scroll (posizione finale, più morbida)
                    setTimeout(() => {
                      scrollRef.current?.scrollTo({
                        y: pieY + 250,
                        animated: true,
                      });
                    }, 160);
                  }, 250);
                }
              }}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: COLORS.primary,
                borderRadius: 30,
                alignSelf: "center",
                marginBottom: 10,
                marginTop: 20,
              }}
            >
              <Text bold style={{ color: "white", fontSize: 12 }}>
                {showMacros
                  ? "Nascondi valori nutrizionali"
                  : "Mostra valori nutrizionali"}
              </Text>
            </TouchableOpacity>

            {showMacros && (
              <>
                <View
                  style={{
                    marginTop: 20,
                    marginBottom: 30,
                    alignItems: "center",
                  }}
                >
                  <Text
                    bold
                    style={{
                      fontSize: 20,
                      fontWeight: "600",
                      textAlign: "center",
                    }}
                  >
                    Valori nutrizionali per porzione:
                  </Text>

                  <View
                    style={{
                      marginTop: 10,
                      marginBottom: 20,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        marginTop: 10,
                        marginBottom: 20,
                      }}
                    >
                      <BatteryFill animValue={totalKcalAnim} />
                      <Text
                        bold
                        style={[styles.summaryText, { marginTop: 20 }]}
                      >
                        {Math.round(kcalPerServing)}
                        kcal{" "}
                      </Text>
                    </View>
                  </View>

                  <View
                    onLayout={(e) => setPieY(e.nativeEvent.layout.y)}
                    style={{ alignItems: "center" }}
                  >
                    <GlassBarChart
                      carbs={carbsPerServing}
                      protein={proteinPerServing}
                      fat={fatPerServing}
                      totalWeight={weightPerServing}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ⭐ TABS */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "ingredients" && styles.tabActive,
                ]}
                onPress={() => setActiveTab("ingredients")}
              >
                <Text
                  bold
                  style={[
                    styles.tabLabel,
                    activeTab === "ingredients" && styles.tabLabelActive,
                  ]}
                >
                  Ingredienti
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === "steps" && styles.tabActive]}
                onPress={() => setActiveTab("steps")}
              >
                <Text
                  bold
                  style={[
                    styles.tabLabel,
                    activeTab === "steps" && styles.tabLabelActive,
                  ]}
                >
                  Procedimento
                </Text>
              </TouchableOpacity>
            </View>

            {/* ⭐ CONTENUTO TAB — INGREDIENTI */}
            {activeTab === "ingredients" && (
              <View style={styles.section}>
                {recipe.ingredientsPhoto ||
                ungroupedIngredients.length > 0 ||
                ingredientGroups.some((g) => g.items.length > 0) ? (
                  <>
                    <Text variant="heading" style={styles.sectionTitle}>
                      Ingredienti
                    </Text>

                    {/* LISTA INGREDIENTI LIBERI */}
                    {ungroupedIngredients.length > 0 &&
                      ungroupedIngredients.map((ing, index) => {
                        const key = `free-${index}`;
                        const isChecked = checkedIngredients[key] || false;

                        return (
                          <Fragment key={ing.id}>
                            <View style={styles.ingredientRow}>
                              <TouchableOpacity
                                style={styles.checkbox}
                                onPress={() => toggleIngredientCheck(key)}
                              >
                                <Ionicons
                                  name={
                                    isChecked ? "ellipse" : "ellipse-outline"
                                  }
                                  size={26}
                                  color={isChecked ? "#3a8654" : "#666"}
                                />
                              </TouchableOpacity>

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
                                {`${ing.quantity} ${ing.unit}`}
                              </Text>
                            </View>
                          </Fragment>
                        );
                      })}

                    {/* GRUPPI DI INGREDIENTI */}
                    {ingredientGroups
                      .filter((g) => g.id !== "ungrouped" && g.items.length > 0)
                      .map((group, groupIndex) => (
                        <View key={group.id} style={{ marginBottom: 20 }}>
                          <Text variant="title" style={styles.ingredientGroup}>
                            {group.title}
                          </Text>

                          {group.items.map((ing, index) => {
                            const key = `${groupIndex}-${index}`;
                            const isChecked = checkedIngredients[key] || false;

                            return (
                              <Fragment key={ing.id}>
                                <View style={styles.ingredientRow}>
                                  <TouchableOpacity
                                    style={styles.checkbox}
                                    onPress={() => toggleIngredientCheck(key)}
                                  >
                                    <Ionicons
                                      name={
                                        isChecked
                                          ? "ellipse"
                                          : "ellipse-outline"
                                      }
                                      size={26}
                                      color={isChecked ? "#3a8654" : "#666"}
                                    />
                                  </TouchableOpacity>

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
                                    {`${ing.quantity} ${ing.unit}`}
                                  </Text>
                                </View>
                              </Fragment>
                            );
                          })}
                        </View>
                      ))}
                  </>
                ) : (
                  <View style={styles.emptyPlaceholder}>
                    <Ionicons name="leaf-outline" size={40} color="#bbb" />
                    <Text style={styles.emptyPlaceholderText}>
                      Nessun ingrediente presente
                    </Text>
                  </View>
                )}
              </View>
            )}
            {/* ⭐ CONTENUTO TAB — PROCEDIMENTO */}
            {activeTab === "steps" && (
              <View style={styles.section}>
                {recipe.steps.length > 0 ? (
                  <>
                    <Text variant="heading" style={styles.sectionTitle}>
                      Procedimento
                    </Text>

                    {recipe.steps.map((step, index) => {
                      const isChecked = checkedSteps[index] || false;

                      return (
                        <View key={index} style={styles.stepVerticalCard}>
                          <View>
                            <View style={styles.stepNumberCircle}>
                              <Text style={styles.stepNumberText}>
                                {index + 1}
                              </Text>
                            </View>

                            {step.title?.trim().length > 0 && (
                              <Text bold style={styles.stepTitle}>
                                {step.title}
                              </Text>
                            )}
                          </View>

                          <Text
                            style={[
                              styles.stepText,
                              isChecked && styles.checkedText,
                            ]}
                          >
                            {step.description}
                          </Text>

                          {step.imageUri && (
                            <Image
                              source={{ uri: step.imageUri }}
                              style={styles.stepVerticalImage}
                            />
                          )}

                          {step.textImageUri && (
                            <Image
                              source={{ uri: step.textImageUri }}
                              style={styles.stepVerticalImage}
                            />
                          )}
                        </View>
                      );
                    })}
                  </>
                ) : (
                  <View style={styles.emptyPlaceholder}>
                    <Ionicons name="list-outline" size={40} color="#bbb" />
                    <Text style={styles.emptyPlaceholderText}>
                      Nessun procedimento disponibile
                    </Text>
                  </View>
                )}
              </View>
            )}

            <SuccessToast
              visible={toastVisible}
              message="Ingredienti aggiunti alla spesa"
            />

            {/* MODALE IMMAGINE FULLSCREEN */}
            <Modal visible={!!fullImage} transparent={true}>
              <ImageViewer
                imageUrls={[{ url: fullImage! }]}
                enableSwipeDown
                onSwipeDown={() => setFullImage(null)}
                onCancel={() => setFullImage(null)}
                renderIndicator={() => <View />}
                backgroundColor="rgba(0,0,0,0.95)"
                saveToLocalByLongPress={false}
              />

              <TouchableOpacity
                onPress={() => setFullImage(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={32} color="white" />
              </TouchableOpacity>
            </Modal>
          </View>
        </Animated.View>
      </ScrollView>

      {/* ⭐ TIMER BUTTON FISSO IN BASSO A SINISTRA */}
      <TouchableOpacity
        style={styles.floatingTimer}
        onPress={() => router.push("/timer")}
      >
        <Ionicons name="time-outline" size={26} color={COLORS.textLight} />
      </TouchableOpacity>

      {/* ⭐ MENU ELLIPSIS FISSO IN BASSO A DESTRA */}
      <TouchableOpacity
        style={styles.floatingMenu}
        onPress={() => setMenuVisible(true)}
      >
        <Ionicons name="ellipsis-vertical" size={26} color={COLORS.textLight} />
      </TouchableOpacity>

      {/* ⭐ MENU MODALE */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        />

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push(`/edit/${recipe.id}`);
            }}
          >
            <Ionicons name="create-outline" size={20} color="#333" />
            <Text style={styles.menuLabel}>Modifica</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              handleDelete();
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#333" />
            <Text style={styles.menuLabel}>Elimina</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              shareRecipePDF(recipe);
            }}
          >
            <Ionicons name="share-outline" size={20} color="#333" />
            <Text style={styles.menuLabel}>Condividi PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push(`/scale/${recipe.id}`);
            }}
          >
            <Ionicons name="calculator-outline" size={20} color="#333" />
            <Text style={styles.menuLabel}>Ricalcola</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              setModalVisible(true);
            }}
          >
            <Ionicons name="cart-outline" size={20} color="#333" />
            <Text style={styles.menuLabel}>Aggiungi alla spesa</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <IngredientsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        ingredients={recipe.ingredients.flatMap((group) =>
          group.items.map((ing) => ({
            name: ing.name,
            quantity: String(ing.quantity ?? ""),
            unit: ing.unit ?? "",
            checked: true,
          })),
        )}
        onConfirm={(selected) => {
          addToShoppingList(
            selected.map((i) => ({
              name: i.name,
              quantity: String(i.quantity ?? ""),
              unit: i.unit ?? "",
              checked: false,
            })),
          );
          showAddedToast();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingBottom: 35,
    lineHeight: 30,
  },

  /* HERO IMAGE */
  heroContainer: {
    width: "100%",
    height: 300,
    position: "relative",
    backgroundColor: "#000",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  arrowLeft: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: [{ translateY: -17 }],
    padding: 8,
    borderRadius: 40,
    zIndex: 20,
  },
  arrowRight: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -17 }],
    padding: 8,
    borderRadius: 40,
    zIndex: 20,
  },

  /* CARD SOVRAPPOSTA */
  cardScroll: {
    flex: 1,
    marginTop: -38, // sovrapposta di circa 1 cm
  },
  card: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 25,
    paddingBottom: 50, // spazio per la bottom bar
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },

  /* TITOLO + INFO + TAGS */
  title: {
    marginTop: 20,
    fontSize: 24,
    textAlign: "center",
    marginBottom: 16,
    color: COLORS.text,
  },
  infoRow: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    gap: 30,
  },

  infoValue: {
    fontSize: 15,
    color: COLORS.text,
    marginTop: 2,
    fontWeight: "500",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 13,
    color: COLORS.background,
  },

  tabsContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 20,
  },

  tab: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
  },

  tabActive: {
    borderColor: COLORS.primary,
  },

  tabLabel: {
    fontSize: 16,
    color: "#777",
  },

  tabLabelActive: {
    color: COLORS.primary,
  },

  /* SEZIONI */
  section: {
    backgroundColor: "white",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    marginVertical: 20,
    color: COLORS.text,
    textAlign: "center",
    marginTop: 30,
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginBottom: 12,
  },

  /* INGREDIENTI */
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
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
    fontSize: 15,
    color: COLORS.text,
    marginRight: 8,
  },
  addSingleBtn: {
    paddingLeft: 4,
  },
  ingredientGroup: {
    fontSize: 17,
    marginBottom: 8,
    color: COLORS.text,
    fontWeight: "600",
  },
  verticalDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "#e0e0e0",
    marginHorizontal: 8,
  },

  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stepNumberText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  stepImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#f2f2f2",
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 15,
    textAlign: "center",
  },
  stepText: {
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 10,
    marginHorizontal: 25,
    lineHeight: 28,
  },

  /* MODALE IMMAGINE */
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 30,
  },

  /* BOTTOM BAR */
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 24,
    paddingTop: 6,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
    zIndex: 999,
  },
  bottomButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomIcon: {
    color: "#333",
    marginBottom: 2,
  },
  bottomLabel: {
    fontSize: 11,
    color: "#333",
    textAlign: "center",
  },

  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },

  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },

  notesInline: {
    marginTop: 10,
    marginBottom: 30,
    paddingHorizontal: 20,
  },

  notesInlineTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: COLORS.text,
  },

  notesInlineText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 28,
  },

  stepVerticalCard: {
    padding: 16,
  },

  stepVerticalImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: "#f2f2f2",
  },

  /* ⭐ FLOATING BUTTONS */
  floatingTimer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },

  floatingMenu: {
    position: "absolute",
    bottom: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },

  /* ⭐ MENU MODALE */
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  menuContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingBottom: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },

  menuLabel: {
    fontSize: 16,
    marginLeft: 12,
    color: "#333",
  },

  emptyPlaceholder: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
  },

  emptyPlaceholderText: {
    marginTop: 10,
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  infoColumn: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  summaryText: {
    fontSize: 20,
    marginBottom: 6,
    color: COLORS.text,
    textAlign: "center",
  },
});
