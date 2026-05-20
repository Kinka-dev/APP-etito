import { calculateMacros } from "@/app/data/nutritionDB";
import Text from "@/components/Text";
import { useCountUp } from "@/hooks/useCountUp";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";

type IngredientRowProps = {
  ing: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
  };
  onDelete: () => void;
};

export default function IngredientMacro({ ing, onDelete }: IngredientRowProps) {
  const macros = calculateMacros(ing.name, ing.quantity);

  const kcal = macros?.kcal ?? 0;
  const carbs = macros?.carbs ?? 0;
  const protein = macros?.protein ?? 0;
  const fat = macros?.fat ?? 0;

  const kcalAnim = useCountUp(Math.round(kcal));
  const carbsAnim = useCountUp(Math.round(carbs));
  const proteinAnim = useCountUp(Math.round(protein));
  const fatAnim = useCountUp(Math.round(fat));

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: "#eee",
        gap: 10,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text bold style={{ fontSize: 15 }}>
          {ing.name}
        </Text>
        <Text style={{ color: "#777" }}>
          {ing.quantity}
          {ing.unit}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginTop: 4,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="flame-outline" size={14} color="#ff0000" />
            <Text>{kcalAnim}</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="leaf-outline" size={14} color="#00a56e" />
            <Text>{carbsAnim}g</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="fitness-outline" size={14} color="#b292ad" />
            <Text>{proteinAnim}g</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="water-outline" size={14} color="#ffc800" />
            <Text>{fatAnim}g</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={onDelete}>
        <Ionicons name="trash-outline" size={20} color="#cc0033" />
      </TouchableOpacity>
    </View>
  );
}
