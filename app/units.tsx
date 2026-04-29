// app/converter.tsx
import { COLORS } from "@/constants/colors";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const liquids = {
  acqua: 1,
  latte: 1.03,
  olio: 0.92,
  vino: 0.99,
};

export default function ConverterScreen() {
  const [value, setValue] = useState("");
  const [fromUnit, setFromUnit] = useState("ml");
  const [toUnit, setToUnit] = useState("g");
  const [liquidType, setLiquidType] = useState("acqua");

  const convert = () => {
    let num = parseFloat(value);
    if (isNaN(num)) return 0;

    // ml → g (per liquidi)
    if (fromUnit === "ml" && toUnit === "g") {
      const density = liquids[liquidType as keyof typeof liquids] || 1;
      return (num * density).toFixed(2);
    }

    // g → ml
    if (fromUnit === "g" && toUnit === "ml") {
      const density = liquids[liquidType as keyof typeof liquids] || 1;
      return (num / density).toFixed(2);
    }

    // Conversioni semplici
    const conversions: any = {
      "ml-g": num * 1,
      "g-ml": num * 1,
      "cup-ml": num * 240,
      "ml-cup": num / 240,
      "tbsp-ml": num * 15,
      "ml-tbsp": num / 15,
    };

    const key = `${fromUnit}-${toUnit}`;
    return conversions[key] !== undefined ? conversions[key].toFixed(2) : num;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Convertitore Cucina</Text>

        <TextInput
          style={styles.input}
          placeholder="Valore"
          value={value}
          onChangeText={setValue}
          keyboardType="numeric"
        />

        <View style={styles.row}>
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Da</Text>
            <TouchableOpacity style={styles.picker} onPress={() => {}}>
              <Text>{fromUnit}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>A</Text>
            <TouchableOpacity style={styles.picker} onPress={() => {}}>
              <Text>{toUnit}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Liquidi */}
        {(fromUnit === "ml" || toUnit === "ml") && (
          <View style={styles.liquidSelector}>
            <Text style={styles.label}>Tipo di liquido</Text>
            <View style={styles.liquidRow}>
              {Object.keys(liquids).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.liquidBtn,
                    liquidType === type && styles.liquidBtnActive,
                  ]}
                  onPress={() => setLiquidType(type)}
                >
                  <Text
                    style={
                      liquidType === type
                        ? styles.liquidTextActive
                        : styles.liquidText
                    }
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.result}>
          {value
            ? `${value} ${fromUnit} = ${convert()} ${toUnit}`
            : "Inserisci un valore"}
        </Text>

        {/* Sostituzioni comuni */}
        <Text style={styles.subTitle}>Sostituzioni utili</Text>
        <Text style={styles.subText}>
          • 1 uovo = 1 cucchiaio di semi di lino + 3 cucchiai di acqua
        </Text>
        <Text style={styles.subText}>
          • 1 bicchiere di latte = 1 bicchiere di acqua + 2 cucchiai di burro
        </Text>
        <Text style={styles.subText}>• 100g zucchero = 80g miele</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fffaf0" },
  content: { padding: 16 },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: COLORS.text,
  },
  input: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  row: { flexDirection: "row", gap: 16, marginBottom: 20 },
  pickerContainer: { flex: 1 },
  label: { fontSize: 15, color: COLORS.textLight, marginBottom: 6 },
  picker: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  liquidSelector: { marginBottom: 20 },
  liquidRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  liquidBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
  },
  liquidBtnActive: { backgroundColor: COLORS.primary },
  liquidText: { color: COLORS.text },
  liquidTextActive: { color: "white" },
  result: {
    fontSize: 24,
    textAlign: "center",
    marginVertical: 30,
    color: COLORS.primary,
    fontWeight: "600",
  },
  subTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 30,
    marginBottom: 12,
  },
  subText: { fontSize: 16, marginBottom: 8, color: COLORS.text },
});
