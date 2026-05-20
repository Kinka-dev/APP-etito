// src/components/RecipeCard.tsx
import { shareRecipePDF } from "@/app/utils/shareRecipePDF";
import Text from "@/components/Text";
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

function IngredientsModal({
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
    ingredients.map((ing) => ({ ...ing, checked: true })),
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.box}>
          <Text bold style={modalStyles.title}>
            Ingredienti da aggiungere
          </Text>

          <ScrollView style={{ maxHeight: 300 }}>
            {selected.map((ing, i) => (
              <TouchableOpacity
                key={i}
                style={modalStyles.row}
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
                <Text style={{ marginLeft: 8 }}>
                  {ing.name} {ing.quantity} {ing.unit}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={modalStyles.buttons}>
            <TouchableOpacity onPress={onClose}>
              <Text>Annulla</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                onConfirm(selected.filter((i) => i.checked));
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
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
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
      {/* ⋯ MENU SEMPRE VISIBILE */}
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
          style={styles.image}
        />

        {/* 📄 CONTENUTO */}
        <View style={styles.content}>
          <Text bold style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>

          <Text bold style={styles.categoryText}>
            ••• {recipe.category} •••
          </Text>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={14} color={COLORS.primary} />
              <Text style={styles.infoText}>{recipe.prepTime} min</Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons
                name="people-outline"
                size={14}
                color={COLORS.primary}
              />
              <Text style={styles.infoText}>{recipe.servings} porz.</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tagsUnderImage}
            contentContainerStyle={{ gap: 6 }}
          >
            {recipe.tags?.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
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
              checked: false, // ⭐ necessario per rispettare il tipo Ingredient
            })),
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    position: "relative",
  },

  favoriteButton: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 20,
    backgroundColor: "white",
    padding: 4,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  image: {
    width: 140,
    height: 140,
    borderRadius: 14,
    backgroundColor: "#f0f0f0",
  },

  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
    maxHeight: 150,
  },

  title: {
    fontSize: 17,
    color: COLORS.text,
    marginBottom: 4,
    paddingRight: 30,
  },

  categoryText: {
    fontSize: 13,
    color: COLORS.primary,
    marginBottom: 6,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 6,
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  infoText: {
    fontSize: 12,
    color: COLORS.textLight,
  },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },

  tag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 5,
    borderRadius: 12,
  },

  tagText: {
    fontSize: 10,
    color: "white",
  },

  menuButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 200,
    backgroundColor: "white",
  },

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
    borderRadius: 16,
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

  tagsUnderImage: {
    marginTop: 6,
    maxHeight: 24, // ⭐ impedisce alla card di crescere
  },
});
