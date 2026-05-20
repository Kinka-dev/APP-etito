// CategoryTabSquare.tsx
import { COLORS } from "@/constants/colors";
import React, { forwardRef } from "react";
import {
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import Text from "./Text";

type Props = {
  label: string;
  icon?: any;
  selected: boolean;
  onPress: () => void;
  onLayout?: (e: LayoutChangeEvent) => void;
};

const AnimatedView = Animated.createAnimatedComponent(View);

const CategoryTabSquare = forwardRef<View, Props>(
  ({ icon, label, selected, onPress, onLayout }, ref) => {
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        {
          scale: withSpring(selected ? 1.08 : 1, {
            damping: 8,
            stiffness: 60,
          }),
        },
      ],
      shadowOpacity: selected ? 0.35 : 0.15,
      shadowRadius: selected ? 14 : 8,
    }));

    return (
      <AnimatedView
        ref={ref}
        style={[styles.card, animatedStyle]}
        onLayout={onLayout}
      >
        <Pressable style={styles.inner} onPress={onPress}>
          <Text bold style={[styles.label, selected && styles.labelSelected]}>
            {label}
          </Text>
          <Image source={icon} style={styles.image} resizeMode="cover" />
        </Pressable>
      </AnimatedView>
    );
  },
);

export default CategoryTabSquare;

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    marginHorizontal: 10,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    overflow: "hidden",
    flexDirection: "row",
  },

  inner: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
  },

  image: {
    width: 60,
    height: 60,
  },

  label: {
    fontSize: 13,
    color: "#000000",
    textAlign: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },

  labelSelected: {
    color: COLORS.primary,
    textShadowColor: "rgba(197, 197, 197, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
