// src/components/Text.tsx
import { Text as RNText, StyleSheet, TextProps } from "react-native";

type TextVariant =
  | "title" // Titoli grandi delle ricette
  | "subtitle" // Sottotitoli / info
  | "heading" // Sezioni (Ingredienti, Procedimento...)
  | "body" // Testo normale
  | "small" // Testi piccoli (tag, quantità...)
  | "button"; // Testi dei pulsanti

interface CustomTextProps extends TextProps {
  variant?: TextVariant;
  bold?: boolean;
  semiBold?: boolean;
}

export default function Text({
  variant = "body",
  bold = false,
  semiBold = false,
  style,
  ...props
}: CustomTextProps) {
  return (
    <RNText
      style={[
        styles.base,
        styles[variant],
        bold && styles.bold,
        semiBold && styles.semiBold,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: "Outfit-Regular",
    color: "#333",
  },
  title: {
    fontSize: 28,
    fontFamily: "Outfit-SemiBold",
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: "Outfit-Medium",
  },
  heading: {
    fontSize: 21,
    fontFamily: "Outfit-SemiBold",
    marginBottom: 12,
  },
  body: {
    fontSize: 16.5,
    lineHeight: 24,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
  },
  bold: {
    fontFamily: "Outfit-SemiBold",
  },
  semiBold: {
    fontFamily: "Outfit-Medium",
  },
});
