// src/components/RecipeCard.tsx
import { shareRecipePDF } from "@/app/utils/shareRecipePDF";
import Text from "@/components/Text";
import { CATEGORY_LABELS } from "@/constants/categories";
import { COLORS } from "@/constants/colors";
import { useRecipeContext } from "@/context/RecipeContext";
import { Recipe } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";

interface IngredientModalItem {
  name: string;
  quantity: string | number;
  unit: string;
  checked?: boolean;
}

let holdInterval: ReturnType<typeof setInterval> | null = null;

export function IngredientsModal({
  visible,
  onClose,
  ingredients,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  ingredients: IngredientModalItem[];
  onConfirm: (selected: IngredientModalItem[]) => void;
}) {
  const [selected, setSelected] = useState(
    ingredients.map((ing) => ({
      ...ing,
      quantity: Number(ing.quantity) || 0,
      unit: ing.unit ?? "",
      checked: true,
    })),
  );

  const startHold = (callback: () => void) => {
    // Primo incremento dopo un piccolo ritardo
    holdInterval = setTimeout(() => {
      holdInterval = setInterval(callback, 80);
    }, 250);
  };

  const stopHold = () => {
    if (holdInterval) {
      clearTimeout(holdInterval);
      clearInterval(holdInterval);
    }
    holdInterval = null;
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.box}>
          <Text bold style={modalStyles.title}>
            Ingredienti da aggiungere
          </Text>

          <ScrollView style={{ maxHeight: 300 }}>
            {selected.map((ing, i) => (
              <View key={i} style={modalStyles.row}>
                {/* CHECKBOX */}
                <TouchableOpacity
                  onPress={() => {
                    const arr = [...selected];
                    arr[i].checked = !arr[i].checked;
                    setSelected(arr);
                  }}
                >
                  <Ionicons
                    name={ing.checked ? "checkbox" : "square-outline"}
                    size={22}
                    color="#3a8654"
                  />
                </TouchableOpacity>

                {/* NOME */}
                <Text style={{ marginLeft: 8, flex: 1 }}>{ing.name}</Text>

                <View style={modalStyles.qtyColumn}>
                  {/* QUANTITÀ */}
                  <Text style={modalStyles.qtyText}>{ing.quantity}</Text>

                  {/* BOTTONI VERTICALI */}
                  <View style={modalStyles.verticalButtons}>
                    {/* + */}
                    <TouchableOpacity
                      onPress={() => {
                        const arr = [...selected];
                        arr[i].quantity = Number(arr[i].quantity) + 1;
                        setSelected(arr);
                      }}
                      onPressIn={() =>
                        startHold(() => {
                          const arr = [...selected];
                          arr[i].quantity = Number(arr[i].quantity) + 1;
                          setSelected(arr);
                        })
                      }
                      onPressOut={stopHold}
                      style={modalStyles.btnSmall}
                    >
                      <Text style={modalStyles.btnText}>+</Text>
                    </TouchableOpacity>

                    {/* - */}
                    <TouchableOpacity
                      onPress={() => {
                        const arr = [...selected];
                        arr[i].quantity = Math.max(
                          0,
                          Number(arr[i].quantity) - 1,
                        ); // ⭐ TAP = -1
                        setSelected(arr);
                      }}
                      onPressIn={() =>
                        startHold(() => {
                          const arr = [...selected];
                          arr[i].quantity = Math.max(
                            0,
                            Number(arr[i].quantity) - 1,
                          ); // ⭐ HOLD = -1 ma velocissimo
                          setSelected(arr);
                        })
                      }
                      onPressOut={stopHold}
                      style={modalStyles.btnSmall}
                    >
                      <Text style={modalStyles.btnText}>−</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* UNITÀ (SOLO TESTO) */}
                <Text style={modalStyles.unitText}>{ing.unit}</Text>
              </View>
            ))}
          </ScrollView>

          {/* BOTTONI */}
          <View style={modalStyles.buttons}>
            <TouchableOpacity onPress={onClose}>
              <Text>Annulla</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                onConfirm(
                  selected.filter((i) => i.checked && Number(i.quantity) > 0),
                );
                onClose();
              }}
            >
              <Text bold>Conferma</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 20,
  },
  box: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  btn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "#eee",
    borderRadius: 6,
  },
  btnText: {
    fontSize: 18,
    color: "white",
  },
  qtyText: {
    width: 32,
    textAlign: "center",
    fontSize: 16,
  },
  unitText: {
    width: 50,
    textAlign: "left",
    fontSize: 14,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  qtyColumn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: 110,
  },

  verticalButtons: {
    flexDirection: "row",
    gap: 4,
  },

  btnSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
});

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
}

export default function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  const { toggleFavorite, deleteRecipe, addToShoppingList } =
    useRecipeContext();

  const [openActions, setOpenActions] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={{ position: "relative" }}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setOpenActions(!openActions)}
      >
        <Ionicons
          name={openActions ? "close" : "ellipsis-vertical"}
          size={22}
          color={COLORS.textLight}
        />
      </TouchableOpacity>

      {/* CARD PRINCIPALE */}
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/* CATEGORY PILL VERTICALE NELLA PARTE BASSA */}
        <View
          style={[
            styles.categoryPillVertical,
            { top: (recipe.tags ?? []).length > 0 ? "55%" : "65%" },
          ]}
        >
          <Text bold style={styles.categoryPillVerticalText}>
            {CATEGORY_LABELS[recipe.category]}
          </Text>
        </View>

        {/* ❤️ CUORE */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(recipe.id)}
        >
          <Ionicons
            name={recipe.isFavorite ? "heart" : "heart-outline"}
            size={22}
            color={recipe.isFavorite ? "#ff4d6d" : "#2e2e2ed3"}
          />
        </TouchableOpacity>

        {/* 📸 IMMAGINE */}
        <Image
          source={
            recipe.imageUri
              ? { uri: recipe.imageUri }
              : require("../assets/images/default.jpg")
          }
          style={[
            styles.image,
            {
              height: (recipe.tags ?? []).length > 0 ? "55%" : "65%",
            },
          ]}
        />

        {/* 📄 CONTENUTO */}
        <View style={styles.content}>
          <Text bold style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>

          {/* <Text bold style={styles.categoryText}>
            ••• {CATEGORY_LABELS[recipe.category]} •••
          </Text> */}

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <View
                style={{
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={COLORS.primary}
                />
                <Text style={[styles.infoText, { marginBottom: -8 }]}>
                  Preparazione:
                </Text>
                <Text style={styles.infoText}>{recipe.prepTime}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={{ flexDirection: "column", alignItems: "center" }}>
                <Ionicons
                  name="people-outline"
                  size={14}
                  color={COLORS.primary}
                />
                <Text style={[styles.infoText, { marginBottom: -8 }]}>
                  Porzioni:
                </Text>
                <Text style={styles.infoText}>{recipe.servings}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={{ flexDirection: "column", alignItems: "center" }}>
                <Ionicons
                  name="flame-outline"
                  size={14}
                  color={COLORS.primary}
                />

                <Text style={[styles.infoText, { marginBottom: -8 }]}>
                  Cottura:{" "}
                </Text>
                <Text style={styles.infoText}>{recipe.cookTime}</Text>
              </View>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tagsUnderImage}
            contentContainerStyle={{ gap: 10 }}
          >
            {recipe.tags?.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text bold style={styles.tagText}>
                  #{tag}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>

      {/* OVERLAY ANIMATO */}
      {openActions && (
        <>
          {/* Chiudi cliccando fuori */}
          <TouchableWithoutFeedback onPress={() => setOpenActions(false)}>
            <View style={styles.overlayBackground} />
          </TouchableWithoutFeedback>

          <Animated.View
            entering={FadeInRight.duration(180)}
            exiting={FadeOutLeft.duration(150)}
            style={styles.actionsOverlay}
          >
            {/* ELIMINA */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                deleteRecipe(recipe.id);
                setOpenActions(false);
              }}
            >
              <Ionicons name="trash-outline" size={22} color="#cb0047" />
              <Text style={[styles.actionLabel, { color: "#cb0047" }]}>
                Elimina
              </Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            {/* CONDIVIDI */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                shareRecipePDF(recipe);
                setOpenActions(false);
              }}
            >
              <Ionicons
                name="share-outline"
                size={22}
                color={COLORS.secondary}
              />
              <Text style={styles.actionLabel}>Condividi</Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            {/* RICALCOLA */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { marginTop: 15, paddingHorizontal: 5 },
              ]}
              onPress={() => {
                router.push(`/scale/${recipe.id}`);
                setOpenActions(false);
              }}
            >
              <Ionicons
                name="calculator-outline"
                size={22}
                color={COLORS.secondary}
              />
              <Text style={[styles.actionLabel, { lineHeight: 15 }]}>
                Ricalcola ricetta
              </Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            {/* LISTA SPESA */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { marginTop: 15, paddingHorizontal: 5 },
              ]}
              onPress={() => {
                setModalVisible(true);
                setOpenActions(false);
              }}
            >
              <Ionicons
                name="cart-outline"
                size={22}
                color={COLORS.secondary}
              />
              <Text style={[styles.actionLabel, { lineHeight: 15 }]}>
                Aggiungi alla spesa
              </Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            {/* MODIFICA */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                router.push(`/edit/${recipe.id}`);
                setOpenActions(false);
              }}
            >
              <Ionicons
                name="create-outline"
                size={22}
                color={COLORS.secondary}
              />
              <Text style={styles.actionLabel}>Modifica</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
      <IngredientsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        ingredients={recipe.ingredients.flatMap((group) => group.items)}
        onConfirm={(selected: IngredientModalItem[]) =>
          addToShoppingList(
            selected.map((i) => ({
              name: i.name,
              quantity: String(i.quantity ?? ""),
              unit: i.unit ?? "",
              checked: false,
            })),
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 20,
    width: "100%",
    aspectRatio: 1, // ⭐ quadrata perfetta
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    position: "relative",
  },

  // ❤️ CUORE
  favoriteButton: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 6,
    borderRadius: 20,
  },

  // ⋯ MENU
  menuButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 9999,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 6,
    borderRadius: 20,
  },

  // 📸 IMMAGINE GRANDE
  image: {
    width: "100%",
    height: "55%", // ⭐ immagine grande sopra
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: "#f0f0f0",
  },

  // 📄 CONTENUTO SOTTO L’IMMAGINE
  content: {
    padding: 14,
    paddingLeft: 28,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 4,
  },

  categoryText: {
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: "center",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    marginTop: 6,
    gap: 25,
  },

  infoItem: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 20,
  },

  infoText: {
    fontSize: 12,
    color: COLORS.text,
  },

  // TAGS
  tagsUnderImage: {
    marginTop: 10,
  },

  tag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    borderRadius: 20,
    justifyContent: "center",
  },

  tagText: {
    fontSize: 10,
    color: "white",
  },

  // OVERLAY AZIONI
  overlayBackground: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: "transparent",
    zIndex: 40,
  },

  actionsOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: "white",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
    zIndex: 50,
    borderWidth: 1,
    borderColor: "#eee",
  },

  actionBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  actionLabel: {
    fontSize: 11,
    marginTop: 4,
    color: COLORS.text,
    textAlign: "center",
  },

  actionDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#eee",
  },

  categoryPillVertical: {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: 28,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderColor: COLORS.primary,
    zIndex: 25,
  },

  categoryPillVerticalText: {
    color: COLORS.primary,
    fontSize: 10,
    transform: [{ rotate: "-90deg" }],
    width: 120,
    textAlign: "center",
    letterSpacing: 0.5,
  },
});
