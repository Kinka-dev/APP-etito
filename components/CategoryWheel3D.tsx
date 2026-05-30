import { Category } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Text from "./Text";

const { width } = Dimensions.get("window");

export type CategoryItem = {
  id: Category | "all";
  label: string;
  icon: any;
};

type Props = {
  categories: CategoryItem[];
  selected: Category | "all";
  onSelect: (id: Category | "all") => void;
};

export default function CategoryWheel3D({
  categories,
  selected,
  onSelect,
}: Props) {
  const selectedIndex = categories.findIndex((c) => c.id === selected);

  const prevIndex = (selectedIndex - 1 + categories.length) % categories.length;
  const nextIndex = (selectedIndex + 1) % categories.length;

  const anim = useSharedValue(0);

  const centerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(anim.value, [-1, 0, 1], [-width, 0, width]) },
      { scale: interpolate(anim.value, [-1, 0, 1], [0.8, 1, 0.8]) },
      { rotateY: `${interpolate(anim.value, [-1, 0, 1], [40, 0, -40])}deg` },
    ],
  }));

  const leftStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          anim.value,
          [-1, 0, 1],
          [-width * 0.6, -width * 0.4, 0],
        ),
      },
      { scale: interpolate(anim.value, [-1, 0, 1], [0.9, 0.7, 0.5]) },
      { rotateY: `${interpolate(anim.value, [-1, 0, 1], [-20, -40, -60])}deg` },
    ],
    opacity: interpolate(anim.value, [-1, 0, 1], [1, 0.5, 0]),
  }));

  const rightStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          anim.value,
          [-1, 0, 1],
          [0, width * 0.4, width * 0.6],
        ),
      },
      { scale: interpolate(anim.value, [-1, 0, 1], [0.5, 0.7, 0.9]) },
      { rotateY: `${interpolate(anim.value, [-1, 0, 1], [60, 40, 20])}deg` },
    ],
    opacity: interpolate(anim.value, [-1, 0, 1], [0, 0.5, 1]),
  }));

  const rotateRight = () => {
    anim.value = withTiming(
      1,
      { duration: 450, easing: Easing.out(Easing.cubic) },
      () => {
        anim.value = 0;
        runOnJS(onSelect)(categories[nextIndex].id);
      },
    );
  };

  const rotateLeft = () => {
    anim.value = withTiming(
      -1,
      { duration: 450, easing: Easing.out(Easing.cubic) },
      () => {
        anim.value = 0;
        runOnJS(onSelect)(categories[prevIndex].id);
      },
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.arrowLeft} onPress={rotateLeft}>
        <Ionicons name="chevron-back" size={40} color="black" />
      </TouchableOpacity>

      {/* Sinistra */}
      <Animated.View style={[styles.sideItem, leftStyle]}>
        <Image source={categories[prevIndex].icon} style={styles.sideImage} />
        <Text style={styles.sideLabel}>{categories[prevIndex].label}</Text>
      </Animated.View>

      {/* Centrale */}
      <Animated.View style={[styles.centerItem, centerStyle]}>
        <Image
          source={categories[selectedIndex].icon}
          style={styles.centerImage}
        />
        <Text bold style={styles.centerLabel}>
          {categories[selectedIndex].label}
        </Text>
      </Animated.View>

      {/* Destra */}
      <Animated.View style={[styles.sideItem, rightStyle]}>
        <Image source={categories[nextIndex].icon} style={styles.sideImage} />
        <Text style={styles.sideLabel}>{categories[nextIndex].label}</Text>
      </Animated.View>

      <TouchableOpacity style={styles.arrowRight} onPress={rotateRight}>
        <Ionicons name="chevron-forward" size={40} color="black" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 340,
    alignItems: "center",
    justifyContent: "center",
  },

  centerItem: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  centerImage: {
    width: 240,
    height: 240,
    borderRadius: 25,
  },
  centerLabel: {
    marginTop: 10,
    fontSize: 20,
    textAlign: "center",
  },

  sideItem: {
    position: "absolute",
    top: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  sideImage: {
    width: 160,
    height: 160,
    borderRadius: 20,
    opacity: 0.8,
  },
  sideLabel: {
    marginTop: 5,
    fontSize: 14,
    textAlign: "center",
  },

  arrowLeft: {
    position: "absolute",
    left: 10,
    zIndex: 20,
  },
  arrowRight: {
    position: "absolute",
    right: 10,
    zIndex: 20,
  },
});
