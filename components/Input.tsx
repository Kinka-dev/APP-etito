// src/components/Input.tsx
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

export default function Input({ label, style, ...rest }: Props) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TextInput
        {...rest}
        style={[styles.input, style, { color: "#333" }]} // ⭐ colore sempre applicato
        placeholderTextColor="#999"
      />
    </View>
  );
}

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
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    textAlignVertical: "center",
  },
});
