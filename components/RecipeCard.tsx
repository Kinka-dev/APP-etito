// src/components/RecipeCard.tsx
import Text from "@/components/Text";
import { COLORS } from "@/constants/colors";
import { useRecipeContext } from "@/context/RecipeContext";
import { Recipe } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
}

export default function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  const { toggleFavorite } = useRecipeContext();
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => toggleFavorite(recipe.id)}
      >
        <Ionicons
          name={recipe.isFavorite ? "heart" : "heart-outline"}
          size={30}
          color={recipe.isFavorite ? "#ff4d6d" : "#2e2e2ed3"}
        />
      </TouchableOpacity>
      {/* Foto */}
      <Image
        source={
          recipe.imageUri
            ? { uri: recipe.imageUri }
            : require("../assets/images/default.jpg")
        }
        style={styles.image}
      />

      {/* Contenuto testo */}
      <View style={styles.content}>
        {/* Titolo */}
        <Text bold style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>

        {/* Tempo, Porzioni, Categoria */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.primary} />
            <Text style={styles.infoText}>{recipe.prepTime} min</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={16} color={COLORS.primary} />
            <Text style={styles.infoText}>{recipe.servings} porz.</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons
              name="pricetag-outline"
              size={16}
              color={COLORS.primary}
            />
            <Text style={styles.infoText}>{recipe.category}</Text>
          </View>
        </View>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {recipe.tags.slice(0, 4).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginBottom: 16,
    height: 300, // Card più alta come richiesto
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    left: 12,
    padding: 6,
    zIndex: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 30,
  },
  image: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  content: {
    padding: 14,
    flex: 1,
  },
  title: {
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 22,
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  tag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 12,
    marginBottom: 5,
  },
  tagText: {
    fontSize: 12,
    color: "#666",
  },
});
