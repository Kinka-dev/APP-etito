import { COLORS } from "@/constants/colors";
import { Category } from "@/src/types";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
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
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => {
          const isActive = selected === cat.id;

          return (
            <CategoryTab
              label={cat.label}
              icon={cat.icon}
              selected={isActive}
              onPress={() => onSelect(cat.id)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    paddingVertical: 5,
  },
  scrollContent: {
    paddingHorizontal: 5,
    alignItems: "flex-start",
  },

  tabWrapper: {},

  activeWrapper: {
    backgroundColor: "rgba(0,0,0,0.06)", // delicatissimo highlight
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
});
