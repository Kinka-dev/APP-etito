// app/(tabs)/recipes.tsx
import CategoryTabsCarousel, {
  CategoryItem,
} from "@/components/CategoryTabsCarousel";
import RecipeCard from "@/components/RecipeCard";
import Text from "@/components/Text";
import {
  CATEGORIES,
  CATEGORY_IMAGES,
  CATEGORY_LABELS,
} from "@/constants/categories";
import { COLORS } from "@/constants/colors";
import { useRecipeContext } from "@/context/RecipeContext";
import { Category } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RecipesScreen() {
  const { recipes, addToShoppingList, deleteRecipe } = useRecipeContext();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">(
    "all",
  );
  const [showOverlayForId, setShowOverlayForId] = useState<string | null>(null);

  const [showToast, setShowToast] = useState(false);
  const favorites = recipes.filter((r) => r.isFavorite);
  const favCount = favorites.length;

  // ⭐ Animazione bounce
  const bounce = useRef(new Animated.Value(1)).current;

  const CATEGORY_ITEMS: CategoryItem[] = [
    {
      id: "all",
      label: "Tutte le ricette",
      icon: require("../../assets/images/tutte.png"),
    },
    ...CATEGORIES.map((cat) => ({
      id: cat,
      label: CATEGORY_LABELS[cat],
      icon: CATEGORY_IMAGES[cat],
    })),
  ];
  console.log("CATEGORY_ITEMS:", CATEGORY_ITEMS);

  const filteredRecipes = useMemo(() => {
    const lowerSearch = search.toLowerCase().trim();

    return recipes.filter((recipe) => {
      const matchesCategory =
        selectedCategory === "all" || recipe.category === selectedCategory;

      const matchesSearch =
        !lowerSearch ||
        recipe.title.toLowerCase().includes(lowerSearch) ||
        recipe.ingredients.some((group) =>
          group.items.some((ing) =>
            ing.name.toLowerCase().includes(lowerSearch),
          ),
        ) ||
        recipe.tags?.some((tag) => tag.toLowerCase().includes(lowerSearch));

      return matchesCategory && matchesSearch;
    });
  }, [recipes, search, selectedCategory]);

  useEffect(() => {
    if (favCount > 0) {
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1.25,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [favCount]);

  return (
    <ImageBackground
      source={require("../../assets/images/sfondo1.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <Animated.View
        style={[styles.favButton, { transform: [{ scale: bounce }] }]}
      >
        <TouchableOpacity onPress={() => router.push("/favorites")}>
          <Ionicons
            name={favCount > 0 ? "heart" : "heart-outline"}
            size={24}
            color={favCount > 0 ? "#ff4d6d" : COLORS.primary}
          />
        </TouchableOpacity>
      </Animated.View>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="title" style={styles.title}>
            Ricette
          </Text>
        </View>

        {/* Barra di ricerca */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={26}
            color="white"
            backgroundColor={COLORS.primary}
            padding={13}
            borderTopLeftRadius={30}
            borderBottomLeftRadius={30}
            marginLeft={-13}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: COLORS.text, textAlign: "center" },
            ]}
            placeholder="Cerca per titolo, ingrediente o tag..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#999"
          />

          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.categoriesWrapper}>
          <CategoryTabsCarousel
            categories={CATEGORY_ITEMS}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </View>

        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <RecipeCard
                recipe={item}
                onPress={() => router.push(`/recipe/${item.id}` as any)}
              />
            </View>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={70} color="#ccc" />
              <Text style={styles.emptyText}>Nessuna ricetta trovata</Text>
            </View>
          }
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: -60,
    paddingTop: 20,
    backgroundColor: "white",
  },

  header: {
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    paddingHorizontal: 15,
    paddingVertical: 10,
    textAlign: "center",
    color: "black",
  },
  categoriesWrapper: {
    paddingVertical: 5,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    borderRadius: 30,
    elevation: 2,
    color: COLORS.text,
  },
  searchInput: {
    fontFamily: "Outfit-Regular",
    flex: 1,
    paddingVertical: 18,
    marginLeft: 8,
    fontSize: 16,
    borderColor: "white",
    color: COLORS.text,
  },

  cardWrapper: {
    position: "relative",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  dotsButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 8,
    zIndex: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
  },

  list: { paddingBottom: 30 },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.textLight,
    marginTop: 20,
  },
  scrollContent: {
    flexGrow: 1,
  },
  background: {
    flex: 1,
    padding: 20,
  },
  backgroundImage: {
    resizeMode: "cover", // oppure "repeat" se è una texture
    // opacity: 0.15, // sfondo delicato e leggibile
  },

  bg: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  favButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 50,
    padding: 8,
    backgroundColor: "white",
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },

  addRecipeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 50,
    backgroundColor: "white",
    padding: 8,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },

  badge: {
    position: "absolute",
    top: 20,
    right: 0,
    backgroundColor: "#ffffff",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },

  badgeText: {
    color: COLORS.text,
    fontSize: 8,
  },
});
