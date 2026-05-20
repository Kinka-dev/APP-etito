import { COLORS } from "@/constants/colors";
import React from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import Text from "./Text";

type Mode = "text" | "photo" | "ocr";

interface Props {
  mode: Mode;
  onSelectText: () => void;
  onSelectPhoto: () => void;
  onSelectOCR: () => void;
  style?: ViewStyle;
}

export default function InputModeSelector({
  mode,
  onSelectText,
  onSelectPhoto,
  onSelectOCR,
  style,
}: Props) {
  return (
    <View style={[styles.container, style]}>
      {/* TESTO */}
      <TouchableOpacity
        style={[styles.pill, mode === "text" && styles.pillActive]}
        onPress={onSelectText}
      >
        <Text
          style={[styles.pillLabel, mode === "text" && styles.pillLabelActive]}
        >
          Testo
        </Text>
      </TouchableOpacity>

      {/* OCR */}
      <TouchableOpacity
        style={[styles.pill, mode === "ocr" && styles.pillActive]}
        onPress={onSelectOCR}
      >
        <Text
          style={[styles.pillLabel, mode === "ocr" && styles.pillLabelActive]}
        >
          Riconosci testo
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#f2f2f2",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  pillActive: {
    backgroundColor: "#e8ddff",
  },
  pillLabel: {
    fontSize: 12,
    color: "#555",
  },
  pillLabelActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});
