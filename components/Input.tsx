// src/components/Input.tsx
import React, { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

interface Props extends TextInputProps {
  label?: string;
}

const Input = forwardRef<TextInput, Props>(({ label, style, ...rest }, ref) => {
  const isEmpty = !rest.value || rest.value.length === 0;

  return (
    <View style={{ marginBottom: 14 }}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TextInput
        ref={ref} // ⭐ ora il ref funziona
        {...rest}
        multiline={true}
        style={[styles.input, style, { color: "#333" }]}
        placeholderTextColor="#999"
      />
    </View>
  );
});

export default Input;

const styles = StyleSheet.create({
  label: {
    fontFamily: "Outfit-Regular",
    fontSize: 14,
    color: "#444",
    marginBottom: 6,
  },

  input: {
    fontFamily: "Outfit-Regular",
    fontSize: 16,
    color: "#333",
    backgroundColor: "white",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#eee",
    textAlignVertical: "top",
    lineHeight: 30,
  },
});
