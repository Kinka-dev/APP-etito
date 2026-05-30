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
  labelStyle?: any;
};

const AnimatedView = Animated.createAnimatedComponent(View);

const CategoryTab = forwardRef<View, Props>(
  ({ icon, label, selected, onPress, onLayout, labelStyle }, ref) => {
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        {
          scale: withSpring(selected ? 1.02 : 1, {
            damping: 10,
            stiffness: 120,
          }),
        },
      ],
      backgroundColor: selected ? "#f7f7f7" : "white",
      borderWidth: selected ? 2 : 1,
      borderColor: selected ? COLORS.primary : "rgba(0,0,0,0.08)",
      shadowOpacity: selected ? 0.15 : 0.05,
      shadowRadius: selected ? 8 : 4,
      elevation: selected ? 4 : 1,
    }));

    return (
      <AnimatedView
        ref={ref}
        style={[styles.card, animatedStyle]}
        onLayout={onLayout}
      >
        <Pressable onPress={onPress} style={styles.row}>
          <View style={styles.textContainer}>
            <Text bold style={[styles.label, labelStyle]}>
              {label}
            </Text>
          </View>

          {icon && (
            <Image source={icon} style={styles.icon} resizeMode="cover" />
          )}
        </Pressable>
      </AnimatedView>
    );
  },
);

export default CategoryTab;

const styles = StyleSheet.create({
  card: {
    height: 160,
    width: 130,
    marginHorizontal: 4,
    marginVertical: 3,
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "column",
    borderRadius: 18,
    paddingVertical: 0,
    backgroundColor: "white",
    shadowColor: "#000",
  },

  row: {
    flexDirection: "column-reverse",
    alignItems: "center",
    padding: 5,
  },

  textContainer: {},

  label: {
    fontSize: 11,
    color: COLORS.text,
    flexWrap: "wrap",
    width: 70,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 0,
  },

  icon: {
    width: 110,
    height: 110,
    borderRadius: 14,
  },
});
