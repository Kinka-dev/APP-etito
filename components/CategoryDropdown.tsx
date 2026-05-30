import { COLORS } from "@/constants/colors";
import { Category } from "@/src/types";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "./Text";

export type CategoryItem = {
  id: Category | "all";
  label: string;
};

type Props = {
  categories: CategoryItem[];
  selected: Category | "all";
  onSelect: (id: Category | "all") => void;
};

export default function CategoryDropdown({
  categories,
  selected,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrapper}>
      {/* Pulsante */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => setOpen((o) => !o)}
      >
        <Text bold style={styles.buttonText}>
          {selected === "all"
            ? "Scegli una categoria: "
            : categories.find((c) => c.id === selected)?.label}
        </Text>
      </TouchableOpacity>

      {/* Dropdown */}
      {open && (
        <View style={styles.dropdown}>
          {categories.map((cat: CategoryItem) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.item}
              onPress={() => {
                onSelect(cat.id);
                setOpen(false);
              }}
            >
              <Text
                style={[
                  styles.itemText,
                  selected === cat.id && styles.selectedItem,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },

  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 10,
  },

  buttonText: {
    fontSize: 15,
    color: COLORS.primary,
  },

  dropdown: {
    marginTop: 6,
    backgroundColor: "white",
    borderRadius: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#ffffff",
  },

  item: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },

  itemText: {
    fontSize: 14,
  },

  selectedItem: {
    color: COLORS.primary,
  },
});
