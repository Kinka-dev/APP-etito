import { calculateMacros } from "@/app/data/nutritionDB";
import Text from "@/components/Text";
import { COLORS } from "@/constants/colors";
import { useCountUp } from "@/hooks/useCountUp";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

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

  // ⭐ Reanimated: ingressi + pop delete
  const containerY = useSharedValue(-20);
  const containerOpacity = useSharedValue(0);
  const scale = useSharedValue(1);

  const leftX = useSharedValue(-40);
  const rightX = useSharedValue(40);

  useEffect(() => {
    containerY.value = withSpring(0, { damping: 14, stiffness: 120 });
    containerOpacity.value = withTiming(1, { duration: 250 });

    leftX.value = withTiming(0, { duration: 350 });

    rightX.value = withDelay(80, withTiming(0, { duration: 350 }));
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: containerY.value }, { scale: scale.value }],
    opacity: containerOpacity.value,
  }));

  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftX.value }],
  }));

  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightX.value }],
  }));

  const handleDelete = () => {
    // pop + fade
    scale.value = withSequence(
      withSpring(1.1, { damping: 10, stiffness: 200 }),
      withTiming(0, { duration: 180 }),
    );
    containerOpacity.value = withTiming(0, { duration: 180 });

    setTimeout(() => {
      onDelete();
    }, 200);
  };

  return (
    <Animated.View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderColor: "#eee",
          gap: 5,
        },
        containerStyle,
      ]}
    >
      {/* COLONNA SINISTRA */}
      <Animated.View style={[{ flex: 1 }, leftStyle]}>
        <Text
          bold
          style={{
            fontSize: 18,
            textTransform: "capitalize",
            marginBottom: 20,
            marginTop: 20,
          }}
        >
          {ing.name}
        </Text>

        <Text
          bold
          style={{
            fontSize: 25,
            marginTop: 2,
            lineHeight: 30,
            color: COLORS.textLight,
            marginBottom: 10,
          }}
        >
          {ing.quantity}
          {ing.unit}
        </Text>
      </Animated.View>

      {/* COLONNA DESTRA (macro allineati a destra) */}
      <Animated.View
        style={[
          {
            minWidth: 120,
            paddingLeft: 20,
            alignItems: "flex-start",
            justifyContent: "center",
            borderLeftWidth: 1,
            borderColor: "#eee",
          },
          rightStyle,
        ]}
      >
        <Text style={{ fontSize: 12, color: "#777" }}>Kcal: {kcalAnim}</Text>
        <Text style={{ fontSize: 12, color: "#777" }}>Carbs: {carbsAnim}g</Text>
        <Text style={{ fontSize: 12, color: "#777" }}>
          Proteine: {proteinAnim}g
        </Text>
        <Text style={{ fontSize: 12, color: "#777" }}>Grassi: {fatAnim}g</Text>
      </Animated.View>

      {/* DELETE BUTTON */}
      <TouchableOpacity
        onPress={handleDelete}
        style={{
          backgroundColor: "#cc0033",
          padding: 10,
          borderRadius: 30,
          marginLeft: 10,
        }}
      >
        <Ionicons name="trash-outline" size={20} color="#ffffff" />
      </TouchableOpacity>
    </Animated.View>
  );
}
