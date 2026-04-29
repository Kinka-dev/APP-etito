import { COLORS } from "@/constants/colors";
import React from "react";
import { Image, Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Text from "./Text";

type Props = {
  label: string;
  icon?: any;
  selected: boolean;
  onPress: () => void;
};

export default function CategoryTab({ label, icon, selected, onPress }: Props) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(selected ? 1.05 : 1, {
            damping: 6,
            stiffness: 30,
          }),
        },
      ],
      backgroundColor: withTiming(selected ? "#fff4e6" : "#ffffff", {
        duration: 60,
      }),
      borderColor: withTiming(selected ? COLORS.primary : "#dddddd", {
        duration: 60,
      }),
      shadowOpacity: withTiming(selected ? 0.1 : 0.02, { duration: 60 }),
      shadowRadius: withTiming(selected ? 6 : 3, { duration: 60 }),
    };
  });

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <Pressable onPress={onPress} style={styles.tab}>
        {icon && <Image source={icon} style={styles.icon} />}
        <Text style={[styles.text, selected && styles.textActive]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginRight: 14,
    borderRadius: 20,
    borderWidth: 2,
    shadowColor: "#000",
    elevation: 3,
    marginVertical: 10,
  },
  tab: {
    minWidth: 130, // ⭐ più spazio per icona + testo
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },

  icon: {
    width: 42,
    height: 42,
    marginBottom: 6,
  },

  text: {
    fontSize: 13,
    color: "#444",
    textAlign: "center",
    flexShrink: 1, // ⭐ evita overflow
    flexWrap: "wrap", // ⭐ permette testo su 2 righe
  },

  textActive: {
    color: COLORS.primary,
  },
});
