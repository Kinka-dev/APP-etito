// app/(tabs)/favorites.tsx
import RecipeCard from "@/components/RecipeCard";
import Text from "@/components/Text";
import { COLORS } from "@/constants/colors";
import { useRecipeContext } from "@/context/RecipeContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FavoritesScreen() {
  const { recipes } = useRecipeContext();

  const favoriteRecipes = recipes.filter((r) => r.isFavorite === true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* <Image
            source={require("../../assets/images/preferiti.png")}
            style={styles.icon}
            resizeMode="contain"
          /> */}
        <Text bold style={styles.title}>
          Preferiti
        </Text>
      </View>

      {favoriteRecipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>
            Non hai ancora nessuna ricetta preferita
          </Text>
          <Text style={styles.emptySubtext}>
            Clicca sul cuore nelle ricette per aggiungerle qui
          </Text>
        </View>
      ) : (
        <FlatList
          data={favoriteRecipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              onPress={() => router.push(`/recipe/${item.id}` as any)}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: "#ffffff",
  },

  header: {
    // paddingVertical: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    padding: 15,
    textAlign: "center",
    marginBottom: 20,
    color: "black",
  },
  icon: {
    height: 60,
    width: 60,
    marginBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    color: COLORS.textLight,
    marginTop: 20,
    marginHorizontal: 30,
    textAlign: "center",
    lineHeight: 30,
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: "center",
    marginTop: 8,
    marginHorizontal: 20,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  bg: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});
