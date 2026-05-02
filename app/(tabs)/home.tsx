// app/(tabs)/recipes.tsx
import CategoryTab from "@/components/CategoryTab";
import RecipeCard from "@/components/RecipeCard";
import RecipeOverlayCard from "@/components/RecipeOverlayCard";
import SuccessToast from "@/components/SuccessToast";
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
import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  ScrollView,
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
        );

      return matchesCategory && matchesSearch;
    });
  }, [recipes, search, selectedCategory]);

  const handleDelete = (recipeId: string) => {
    Alert.alert("Elimina ricetta", "Sei sicuro?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: () => deleteRecipe(recipeId),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/ricette.png")}
          style={styles.icon}
          resizeMode="contain"
        />
        <Text variant="title" style={styles.title}>
          Ricette
        </Text>
      </View>

      {/* Categorie con icona sopra il titolo - sempre visibili */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          <CategoryTab
            label="Tutte"
            icon={require("../../assets/images/tutte.png")}
            selected={selectedCategory === "all"}
            onPress={() => setSelectedCategory("all")}
          />

          {CATEGORIES.map((cat) => (
            <CategoryTab
              key={cat}
              label={CATEGORY_LABELS[cat]}
              icon={CATEGORY_IMAGES[cat]}
              selected={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Barra di ricerca */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textLight} />
        <TextInput
          style={[styles.searchInput, { color: COLORS.text }]}
          placeholder="Cerca per titolo o ingrediente..."
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

      {/* Lista ricette - card più alte */}
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <RecipeCard
              recipe={item}
              onPress={() => router.push(`/recipe/${item.id}` as any)}
            />

            <TouchableOpacity
              style={styles.dotsButton}
              onPress={() => setShowOverlayForId(item.id)}
            >
              <Ionicons name="ellipsis-vertical" size={24} color="#666" />
            </TouchableOpacity>

            <RecipeOverlayCard
              visible={showOverlayForId === item.id}
              onClose={() => setShowOverlayForId(null)}
              onEdit={() => router.push(`/edit/${item.id}` as any)}
              onDelete={() => handleDelete(item.id)}
              onAddToShopping={() => {
                try {
                  addToShoppingList(
                    item.ingredients.flatMap((group) =>
                      group.items.map((ing) => ({
                        ...ing,
                        checked: false,
                        linkedRecipeId: ing.linkedRecipeId ?? undefined,
                      })),
                    ),
                  );

                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 1500);
                } catch (err) {
                  Alert.alert(
                    "Errore",
                    "Impossibile aggiungere gli ingredienti.",
                  );
                }
              }}
              onRecalculate={() => router.push(`/scale/${item.id}` as any)}
              onShare={() => router.push(`/recipe/${item.id}?share=1`)}
            />
            <SuccessToast visible={showToast} message="Ingredienti aggiunti!" />
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
    // </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: -60,
    paddingTop: 50,
    backgroundColor: "#fffaf0",
  },

  header: {
    // paddingVertical: 20,
    alignItems: "center",
  },
  title: { fontSize: 28, padding: 20, textAlign: "center" },
  categoriesWrapper: {
    backgroundColor: "#fffaf0",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  icon: {
    height: 60,
    width: 60,
    marginBottom: 10,
    alignSelf: "center",
  },
  categoriesContainer: {
    paddingHorizontal: 20,
  },
  categoryTab: {
    alignItems: "center",
    marginRight: 10,
    paddingHorizontal: 5,
    width: 70,
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "#fff",
    borderRadius: 20,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    marginBottom: 6,
    marginTop: 6,
  },
  categoryText: {
    fontSize: 13,
    textAlign: "center",
    color: COLORS.text,
  },
  categoryTabActive: {
    borderWidth: 2,
    borderColor: "#ff0000",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
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

  categoryTextActive: {},
});
