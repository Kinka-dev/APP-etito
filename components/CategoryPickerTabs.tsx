// CategoryPickerTabs.tsx
import { CATEGORY_IMAGES, CATEGORY_LABELS } from "@/constants/categories";
import { Category } from "@/src/types";
import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import CategoryTab from "./CategoryTab";

type Props = {
  value: Category;
  options: Category[];
  onChange: (v: Category) => void;
  labelStyle?: any;
};

export default function CategoryPickerTabs({
  value,
  options,
  onChange,
  labelStyle,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((opt) => (
        <CategoryTab
          key={opt}
          label={CATEGORY_LABELS[opt]}
          icon={CATEGORY_IMAGES[opt]} // ⭐ ICONA FINALMENTE PASSATA
          selected={value === opt}
          onPress={() => onChange(opt)}
          labelStyle={labelStyle}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
});
