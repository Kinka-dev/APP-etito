import { Category } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
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

export default function CategoryTabsCarousel({
  categories,
  selected,
  onSelect,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);

  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const fadeLeft = useRef(new Animated.Value(0)).current;
  const fadeRight = useRef(new Animated.Value(1)).current;

  const animateFade = (value: Animated.Value, to: number) => {
    Animated.timing(value, {
      toValue: to,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const handleScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const max =
      e.nativeEvent.contentSize.width - e.nativeEvent.layoutMeasurement.width;

    const leftVisible = x > 10;
    const rightVisible = x < max - 10;

    setShowLeft(leftVisible);
    setShowRight(rightVisible);

    animateFade(fadeLeft, leftVisible ? 0.7 : 0);
    animateFade(fadeRight, rightVisible ? 0.7 : 0);
  };

  const scrollLeft = () => {
    scrollRef.current?.scrollTo({
      x: 0,
      animated: true,
    });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <View style={styles.container}>
      {/* ⭐ Fade sinistro */}
      <Animated.View
        pointerEvents="none"
        style={[styles.fadeLeft, { opacity: fadeLeft }]}
      />

      {/* ⭐ Freccia sinistra */}
      {showLeft && (
        <TouchableOpacity style={styles.leftArrow} onPress={scrollLeft}>
          <Animated.View style={{ transform: [{ scale: fadeLeft }] }}>
            <Ionicons name="chevron-back" size={22} color="#666" />
          </Animated.View>
        </TouchableOpacity>
      )}

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {categories.map((cat) => {
          const isActive = selected === cat.id;

          return (
            <CategoryTab
              key={cat.id}
              label={cat.label}
              icon={cat.icon}
              selected={isActive}
              onPress={() => onSelect(cat.id)}
            />
          );
        })}
      </ScrollView>

      {/* ⭐ Fade destro */}
      <Animated.View
        pointerEvents="none"
        style={[styles.fadeRight, { opacity: fadeRight }]}
      />

      {/* ⭐ Freccia destra */}
      {showRight && (
        <TouchableOpacity style={styles.rightArrow} onPress={scrollRight}>
          <Animated.View style={{ transform: [{ scale: fadeRight }] }}>
            <Ionicons name="chevron-forward" size={22} color="#666" />
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    paddingVertical: 5,
    position: "relative",
  },

  scrollContent: {
    paddingHorizontal: 5,
    alignItems: "flex-start",
  },

  leftArrow: {
    position: "absolute",
    left: 0,
    top: "50%",
    transform: [{ translateY: -12 }],
    zIndex: 20,
    padding: 6,
  },

  rightArrow: {
    position: "absolute",
    right: 0,
    top: "50%",
    transform: [{ translateY: -12 }],
    zIndex: 20,
    padding: 6,
  },

  fadeLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 30,
    backgroundColor: "white",
    zIndex: 10,
    opacity: 0.7,
  },

  fadeRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 30,
    backgroundColor: "white",
    zIndex: 10,
    opacity: 0.7,
  },
});
