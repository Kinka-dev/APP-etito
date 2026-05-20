import { IngredientFlat } from "@/app/edit/[id]";
import Input from "@/components/Input";
import Text from "@/components/Text";
import { COLORS } from "@/constants/colors";
import { Recipe } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";

interface IngredientRowProps {
  ingredient: IngredientFlat;
  updateIngredient: (
    id: string,
    field: "name" | "quantity" | "unit",
    value: string,
  ) => void;
  removeIngredient: (id: string) => void;
  moveIngredientUp: (id: string) => void;
  moveIngredientDown: (id: string) => void;
  groupingMode: boolean;
  selectedIngredients: string[];
  toggleIngredientSelection: (id: string) => void;
  openActions: string | null;
  setOpenActions: (id: string | null) => void;
  recipes: Recipe[];
  updateIngredientField: (id: string, field: string, value: any) => void;
  setSelectedIngredientIndex: (index: number | null) => void;
  setIsPickerOpen: (open: boolean) => void;
}

export default function IngredientRow({
  ingredient,
  updateIngredient,
  removeIngredient,
  moveIngredientUp,
  moveIngredientDown,
  groupingMode,
  selectedIngredients,
  toggleIngredientSelection,
  openActions,
  setOpenActions,
  recipes,
  updateIngredientField,
  setSelectedIngredientIndex,
  setIsPickerOpen,
}: IngredientRowProps) {
  const linkedRecipe = ingredient.linkedRecipeId
    ? recipes.find((r) => r.id === ingredient.linkedRecipeId)
    : null;

  return (
    <View style={{ marginBottom: 5 }}>
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 6,
          },
          groupingMode && selectedIngredients.includes(ingredient.id)
            ? { backgroundColor: "#eef3ff" }
            : null,
        ]}
      >
        {/* CHECKBOX */}
        {groupingMode && (
          <TouchableOpacity
            onPress={() => toggleIngredientSelection(ingredient.id)}
            style={{ marginRight: 8 }}
          >
            <Ionicons
              name={
                selectedIngredients.includes(ingredient.id)
                  ? "checkbox"
                  : "square-outline"
              }
              size={22}
              color={COLORS.secondary}
            />
          </TouchableOpacity>
        )}

        {/* NOME */}
        <Input
          value={ingredient.name}
          onChangeText={(t) => updateIngredient(ingredient.id, "name", t)}
          placeholder="Ingrediente"
          multiline
          style={{ flex: 1, borderColor: "white" }}
        />

        {/* QUANTITÀ */}
        <Input
          value={ingredient.quantity}
          onChangeText={(t) => updateIngredient(ingredient.id, "quantity", t)}
          placeholder="0"
          multiline
          style={{ width: 70, textAlign: "center", borderColor: "white" }}
        />

        {/* UNITÀ */}
        <Input
          value={ingredient.unit}
          onChangeText={(t) => updateIngredient(ingredient.id, "unit", t)}
          placeholder="g"
          multiline
          style={{ width: 60, textAlign: "center", borderColor: "white" }}
        />

        {/* ELLIPSIS */}
        {!groupingMode && (
          <TouchableOpacity
            onPress={() =>
              setOpenActions(
                openActions === ingredient.id ? null : ingredient.id,
              )
            }
            style={{ padding: 6 }}
          >
            <Ionicons
              name={
                openActions === ingredient.id ? "close" : "ellipsis-vertical"
              }
              size={20}
              color={openActions === ingredient.id ? "white" : COLORS.secondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* LINKED RECIPE */}
      {linkedRecipe && (
        <TouchableOpacity
          onPress={() => router.push(`/recipe/${linkedRecipe.id}`)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#eef3ff",
            paddingHorizontal: 10,
            paddingVertical: 2,
            borderRadius: 12,
            marginTop: -35,
            marginLeft: 15,
          }}
        >
          <Ionicons name="link-outline" size={16} color="#4A90E2" />
          <Text style={{ marginLeft: 6, color: "#4A90E2", fontSize: 11 }}>
            {linkedRecipe.title}
          </Text>
        </TouchableOpacity>
      )}

      {/* MENU AZIONI */}
      {openActions === ingredient.id && (
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "white",
            borderRadius: 12,
            padding: 10,
            marginTop: 6,
            elevation: 3,
          }}
        >
          {/* COLLEGA */}
          {!ingredient.linkedRecipeId ? (
            <TouchableOpacity
              style={{ alignItems: "center", marginHorizontal: 10 }}
              onPress={() => {
                setSelectedIngredientIndex(
                  recipes.findIndex((i) => i.id === ingredient.id),
                );
                setIsPickerOpen(true);
                setOpenActions(null);
              }}
            >
              <Ionicons
                name="link-outline"
                size={22}
                color={COLORS.secondary}
              />
              <Text style={{ fontSize: 11 }}>Collega</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={{ alignItems: "center", marginHorizontal: 10 }}
              onPress={() => {
                updateIngredientField(ingredient.id, "linkedRecipeId", null);
                setOpenActions(null);
              }}
            >
              <Ionicons name="unlink-outline" size={22} color="#cb0047" />
              <Text style={{ fontSize: 11, color: "#cb0047" }}>
                Rimuovi link
              </Text>
            </TouchableOpacity>
          )}

          {/* ELIMINA */}
          <TouchableOpacity
            style={{ alignItems: "center", marginHorizontal: 10 }}
            onPress={() => {
              removeIngredient(ingredient.id);
              setOpenActions(null);
            }}
          >
            <Ionicons name="trash-outline" size={22} color="#cb0047" />
            <Text style={{ fontSize: 11, color: "#cb0047" }}>Elimina</Text>
          </TouchableOpacity>

          {/* SU */}
          <TouchableOpacity
            style={{ alignItems: "center", marginHorizontal: 10 }}
            onPress={() => {
              moveIngredientUp(ingredient.id);
              setOpenActions(null);
            }}
          >
            <Ionicons
              name="chevron-up-outline"
              size={22}
              color={COLORS.secondary}
            />
            <Text style={{ fontSize: 11 }}>Su</Text>
          </TouchableOpacity>

          {/* GIÙ */}
          <TouchableOpacity
            style={{ alignItems: "center", marginHorizontal: 10 }}
            onPress={() => {
              moveIngredientDown(ingredient.id);
              setOpenActions(null);
            }}
          >
            <Ionicons
              name="chevron-down-outline"
              size={22}
              color={COLORS.secondary}
            />
            <Text style={{ fontSize: 11 }}>Giù</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
