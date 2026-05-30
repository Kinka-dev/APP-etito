import { COLORS } from "@/constants/colors";
import { Category } from "@/src/types";
import React, { useEffect, useRef } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Text from "./Text";

const { width } = Dimensions.get("window");

type CategoryItem = {
  id: Category;
  label: string;
  image: any;
};

type Props = {
  value: Category;
  options: CategoryItem[];
  onChange: (v: Category) => void;
};

export default function CategorySwipeCards({
  value,
  options,
  onChange,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);

  // ⭐ Quando apro la schermata, scrolla automaticamente alla categoria selezionata
  useEffect(() => {
    const index = options.findIndex((o) => o.id === value);
    if (index >= 0) {
      scrollRef.current?.scrollTo({ x: index * width, animated: false });
    }
  }, [value]);

  const handleSelect = (cat: CategoryItem, index: number) => {
    onChange(cat.id);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={{ width }}
    >
      {options.map((cat, index) => {
        const selected = value === cat.id;

        return (
          <TouchableOpacity
            key={cat.id}
            style={[styles.card, selected && styles.cardSelected]}
            onPress={() => handleSelect(cat, index)}
            activeOpacity={0.8}
          >
            <View style={styles.row}>
              {/* <Image source={cat.image} style={styles.icon} /> */}
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {cat.label}
              </Text>
            </View>
            {/* <View style={{ backgroundColor: "red", width: 200, height: 40 }}>
              <Text style={{ color: "white" }}>{String(cat.id)}</Text>
            </View> */}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginVertical: 30,
    overflow: "hidden",
  },
  cardSelected: {
    backgroundColor: COLORS.primary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -130,
  },
  icon: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  label: {
    fontSize: 13,
    color: COLORS.text,
    marginLeft: 0,
  },
  labelSelected: {
    color: "white",
  },
});
