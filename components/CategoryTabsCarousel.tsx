import { Category } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import CategoryTab from "./CategoryTab";

export type CategoryItem = {
  id: Category | "all";
  label: string;
  icon?: any;
};

type Props = {
  categories: CategoryItem[];
  selected: Category | "all";
  onSelect: (id: Category | "all") => void;
};

type TabLayout = {
  x: number;
  width: number;
};

export default function CategoryTabsCarousel({
  categories,
  selected,
  onSelect,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const layoutsRef = useRef<Record<string, TabLayout>>({});
  const [contentWidth, setContentWidth] = useState(0);

  const screenWidth = Dimensions.get("window").width;
  const SIDE_PADDING = screenWidth / 2; // padding grande per centrare prima/ultima

  const currentIndex = categories.findIndex((c) => c.id === selected);

  const centerById = (id: Category | "all") => {
    const layout = layoutsRef.current[id as string];
    if (!layout || !scrollRef.current) return;

    const { x, width } = layout;
    const rawX = x + width / 2 - screenWidth / 2;

    const maxScroll = Math.max(contentWidth - screenWidth, 0);
    const clampedX = Math.min(Math.max(rawX, 0), maxScroll);

    scrollRef.current.scrollTo({
      x: clampedX,
      animated: true,
    });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const goLeft = () => {
    if (currentIndex <= 0) return;
    const newIndex = currentIndex - 1;
    const id = categories[newIndex].id;
    onSelect(id);
    centerById(id);
  };

  const goRight = () => {
    if (currentIndex >= categories.length - 1) return;
    const newIndex = currentIndex + 1;
    const id = categories[newIndex].id;
    onSelect(id);
    centerById(id);
  };

  const isLeftDisabled = currentIndex <= 0;
  const isRightDisabled = currentIndex >= categories.length - 1;

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents="none"
        style={[styles.fadeLeft, { opacity: fadeAnim }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.fadeRight, { opacity: fadeAnim }]}
      />

      <Pressable
        style={[styles.leftArrow, isLeftDisabled && styles.arrowDisabled]}
        onPress={goLeft}
        disabled={isLeftDisabled}
      >
        <Ionicons
          name="chevron-back"
          size={32}
          color={isLeftDisabled ? "#bbb" : "#363636"}
        />
      </Pressable>

      <ScrollView
        ref={scrollRef}
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: SIDE_PADDING,
          paddingRight: SIDE_PADDING,
          alignItems: "center",
        }}
        onContentSizeChange={(w) => setContentWidth(w)}
      >
        {categories.map((cat) => (
          <CategoryTab
            key={cat.id}
            label={cat.label}
            icon={cat.icon}
            selected={selected === cat.id}
            onPress={() => {
              onSelect(cat.id);
              centerById(cat.id);
            }}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              layoutsRef.current[cat.id as string] = { x, width };
            }}
          />
        ))}
      </ScrollView>

      <Pressable
        style={[styles.rightArrow, isRightDisabled && styles.arrowDisabled]}
        onPress={goRight}
        disabled={isRightDisabled}
      >
        <Ionicons
          name="chevron-forward"
          size={32}
          color={isRightDisabled ? "#bbb" : "#363636"}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    marginVertical: 10,
  },
  leftArrow: {
    position: "absolute",
    left: 0,
    top: "50%",
    zIndex: 20,
    padding: 10,
    borderRadius: 30,
  },
  rightArrow: {
    position: "absolute",
    right: 0,
    top: "50%",
    zIndex: 20,
    padding: 10,
    borderRadius: 30,
  },
  arrowDisabled: {
    opacity: 0.3,
  },
  fadeLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 45,
    zIndex: 10,
  },
  fadeRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 45,
    zIndex: 10,
  },
});
