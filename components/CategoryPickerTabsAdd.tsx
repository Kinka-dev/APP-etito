// CategoryPickerTabsAdd.tsx
import { CATEGORY_IMAGES, CATEGORY_LABELS } from "@/constants/categories";
import { Category } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import CategoryTabSquare from "./CategoryTabSquare";

type Props = {
  value: Category;
  options: Category[];
  onChange: (v: Category) => void;
};

export default function CategoryPickerTabsAdd({
  value,
  options,
  onChange,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [scrollX, setScrollX] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({});

  const canScrollLeft = scrollX > 0;
  const canScrollRight = scrollX + containerWidth < contentWidth;

  const scrollBy = (offset: number) => {
    scrollRef.current?.scrollTo({ x: scrollX + offset, animated: true });
  };

  const centerTab = (cat: Category) => {
    const layout = tabLayouts.current[cat];
    if (!layout) return;

    const targetX = layout.x - containerWidth / 2 + layout.width / 2;

    scrollRef.current?.scrollTo({
      x: Math.max(0, targetX),
      animated: true,
    });
  };

  const handleSelect = (cat: Category) => {
    onChange(cat);
    setTimeout(() => centerTab(cat), 10);
  };

  return (
    <View
      style={styles.wrapper}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {canScrollLeft && <View style={styles.fadeLeft} />}

      {canScrollLeft && (
        <Pressable style={styles.arrowLeft} onPress={() => scrollBy(-200)}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </Pressable>
      )}

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
        onContentSizeChange={(w) => setContentWidth(w)}
        onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={16}
      >
        {options.map((opt) => (
          <CategoryTabSquare
            key={opt}
            label={CATEGORY_LABELS[opt]}
            icon={CATEGORY_IMAGES[opt]}
            selected={value === opt}
            onPress={() => handleSelect(opt)}
            onLayout={(e: LayoutChangeEvent) => {
              const { x, width } = e.nativeEvent.layout;
              tabLayouts.current[opt] = { x, width };
            }}
          />
        ))}
      </ScrollView>

      {canScrollRight && (
        <Pressable style={styles.arrowRight} onPress={() => scrollBy(200)}>
          <Ionicons name="chevron-forward" size={26} color="#000" />
        </Pressable>
      )}

      {canScrollRight && <View style={styles.fadeRight} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    justifyContent: "center",
    paddingVertical: 20,
  },

  container: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },

  arrowLeft: {
    position: "absolute",
    left: -20,
    zIndex: 20,
    height: "100%",
    justifyContent: "center",
    paddingLeft: 6,
  },

  arrowRight: {
    position: "absolute",
    right: -20,
    zIndex: 20,
    height: "100%",
    justifyContent: "center",
    paddingRight: 6,
  },

  fadeLeft: {
    position: "absolute",
    left: 0,
    width: 20,
    height: "100%",
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.8)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },

  fadeRight: {
    position: "absolute",
    right: 0,
    width: 20,
    height: "100%",
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.8)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
});
