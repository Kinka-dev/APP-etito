import Input from "@/components/Input";
import Text from "@/components/Text";
import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function ConversioniScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  const converters = [
    {
      key: "imperial",
      label: "Imperiale ↔ Metrico",
      desc: "Converti cup, tbsp, oz in ml e g",
      icon: require("../../assets/images/cups.jpg"),
    },
    {
      key: "volume",
      label: "Volume ↔ Peso",
      desc: "Trasforma ml in grammi in base all’ingrediente",
      icon: require("../../assets/images/capacita.jpg"),
    },
    {
      key: "temperature",
      label: "Temperatura forno",
      desc: "Celsius, Fahrenheit, statico e ventilato",
      icon: require("../../assets/images/temperatura.jpg"),
    },
    {
      key: "yeast",
      label: "Lievito fresco ↔ secco",
      desc: "Calcolo automatico 1:3",
      icon: require("../../assets/images/lievito.jpg"),
    },
    {
      key: "flour",
      label: "Forza farina (W)",
      desc: "Miscela farine per ottenere il W desiderato",
      icon: require("../../assets/images/farine.jpg"),
    },
    {
      key: "subs",
      label: "Sostituzioni ingredienti",
      desc: "Alternative affidabili per ogni ingrediente",
      icon: require("../../assets/images/sostituzioni.jpg"),
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { flex: 1, paddingHorizontal: 16 }]}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      {selected === null && (
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/scale.png")}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text bold style={styles.title}>
            Conversioni
          </Text>
        </View>
      )}

      {/* ⭐ MENU DEI CONVERTITORI */}
      {selected === null && (
        <View style={styles.menuGrid}>
          {converters.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={styles.menuCardColumn}
              onPress={() => setSelected(c.key)}
            >
              <Image
                source={c.icon}
                style={styles.menuCardImageTop}
                resizeMode="cover"
              />

              <View style={styles.menuCardTextBlock}>
                <Text bold style={styles.menuCardTitle}>
                  {c.label}
                </Text>
                <Text style={styles.menuCardDesc}>{c.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ⭐ CARD SELEZIONATA */}
      {selected === "imperial" && <ImperialMetricCard />}
      {selected === "volume" && <VolumeWeightCard />}
      {selected === "temperature" && <TemperatureCard />}
      {selected === "yeast" && <YeastCard />}
      {selected === "flour" && <FlourStrengthCard />}
      {selected === "subs" && <IngredientSubstitutionCard />}

      {/* ⭐ TORNA AL MENU */}
      {selected !== null && (
        <TouchableOpacity
          style={styles.backTopLeft}
          onPress={() => setSelected(null)}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

/* ============================================================
   ⭐ COMPONENTE BASE PER LE CARD CON ICONA + TITOLO + FRECCIA
   ============================================================ */
type ConversionCardBaseProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  reverse: boolean;
  setReverse: (v: boolean) => void;
  children: React.ReactNode;
};

function ConversionCardBase({
  icon,
  title,
  reverse,
  setReverse,
  children,
}: ConversionCardBaseProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={40} color="#444" />
      </View>

      <Text style={styles.cardTitle}>{title}</Text>

      <TouchableOpacity
        style={styles.swapButton}
        onPress={() => setReverse(!reverse)}
      >
        <Ionicons
          name="swap-vertical-outline"
          size={28}
          color="#444"
          style={{ transform: [{ rotate: reverse ? "180deg" : "0deg" }] }}
        />
      </TouchableOpacity>

      {children}
    </View>
  );
}

/* ============================================================
   ⭐ IMPERIALE ↔ METRICO
   ============================================================ */
function ImperialMetricCard() {
  type ImperialUnit = "cup" | "tbsp" | "tsp" | "oz" | "lb" | "floz";
  type MetricUnit = "ml" | "g";

  const imperialUnits: ImperialUnit[] = [
    "cup",
    "tbsp",
    "tsp",
    "oz",
    "lb",
    "floz",
  ];
  const metricUnits: MetricUnit[] = ["ml", "g"];

  const [reverse, setReverse] = useState(false);

  const [imperialValue, setImperialValue] = useState("");
  const [metricValue, setMetricValue] = useState("");

  const [imperialUnit, setImperialUnit] = useState<ImperialUnit>("cup");
  const [metricUnit, setMetricUnit] = useState<MetricUnit>("ml");

  const imperialToMetric = (v: number) => {
    switch (imperialUnit) {
      case "cup":
        return v * 240;
      case "tbsp":
        return v * 15;
      case "tsp":
        return v * 5;
      case "oz":
        return v * 28;
      case "lb":
        return v * 454;
      case "floz":
        return v * 30;
      default:
        return 0;
    }
  };

  const metricToImperial = (v: number) => {
    switch (imperialUnit) {
      case "cup":
        return v / 240;
      case "tbsp":
        return v / 15;
      case "tsp":
        return v / 5;
      case "oz":
        return v / 28;
      case "lb":
        return v / 454;
      case "floz":
        return v / 30;
      default:
        return 0;
    }
  };

  const handleImperialChange = (text: string) => {
    setImperialValue(text);
    const num = parseFloat(text);
    if (!isNaN(num)) setMetricValue(imperialToMetric(num).toFixed(2));
    else setMetricValue("");
  };

  const handleMetricChange = (text: string) => {
    setMetricValue(text);
    const num = parseFloat(text);
    if (!isNaN(num)) setImperialValue(metricToImperial(num).toFixed(2));
    else setImperialValue("");
  };

  // ⭐ RESET
  const handleReset = () => {
    setImperialValue("");
    setMetricValue("");
    setImperialUnit("cup");
    setMetricUnit("ml");
  };

  return (
    <View style={styles.card}>
      {/* ICONA */}
      <View style={styles.iconContainer}>
        <Image
          source={require("../../assets/images/cups.png")}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>

      {/* TITOLO */}
      <Text bold style={styles.cardTitle}>
        Imperiale ↔ Metrico
      </Text>

      {/* DESCRIZIONE */}
      <Text style={styles.description}>
        Converti facilmente tra unità imperiali e metriche. Seleziona l’unità di
        partenza e quella di arrivo: la conversione avviene automaticamente.
      </Text>
      <View style={styles.separator}></View>

      {/* INPUTS + SWAP */}
      <View style={styles.rowCenter}>
        {/* COLONNA IMPERIALE */}
        <View style={styles.inputColumn}>
          <Text style={styles.label}>Imperiale</Text>

          <View style={styles.inputWithUnit}>
            <Input
              style={[styles.input, { flex: 1 }]}
              placeholder="0"
              keyboardType="numeric"
              value={imperialValue}
              onChangeText={handleImperialChange}
              onFocus={() => setImperialValue("")}
            />
            <Text style={styles.unit}>{imperialUnit}</Text>
          </View>

          <View style={styles.pillRow}>
            {imperialUnits.map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.pill, imperialUnit === u && styles.pillActive]}
                onPress={() => {
                  setImperialUnit(u);
                  if (imperialValue) handleImperialChange(imperialValue);
                }}
              >
                <Text
                  style={[
                    styles.pillText,
                    imperialUnit === u && styles.pillTextActive,
                  ]}
                >
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SWAP */}
        <TouchableOpacity
          style={{ paddingHorizontal: 10 }}
          onPress={() => {
            setReverse(!reverse);
            const temp = imperialValue;
            setImperialValue(metricValue);
            setMetricValue(temp);
          }}
        >
          <Ionicons
            name="swap-horizontal-outline"
            size={32}
            color="#444"
            style={[
              styles.swapIcon,
              { transform: [{ rotate: reverse ? "180deg" : "0deg" }] },
              { marginTop: 10 },
            ]}
          />
        </TouchableOpacity>

        {/* COLONNA METRICA */}
        <View style={styles.inputColumn}>
          <Text style={styles.label}>Metrico</Text>

          <View style={styles.inputWithUnit}>
            <Input
              style={[styles.input, { flex: 1 }]}
              placeholder="0"
              keyboardType="numeric"
              value={metricValue}
              onChangeText={handleMetricChange}
              onFocus={() => setMetricValue("")}
            />
            <Text style={styles.unit}>{metricUnit}</Text>
          </View>

          <View style={styles.pillRow}>
            {metricUnits.map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.pill, metricUnit === u && styles.pillActive]}
                onPress={() => {
                  setMetricUnit(u);
                  if (metricValue) handleMetricChange(metricValue);
                }}
              >
                <Text
                  style={[
                    styles.pillText,
                    metricUnit === u && styles.pillTextActive,
                  ]}
                >
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      <View style={styles.separator}></View>

      {/* ⭐ ESEMPI RAPIDI (ripristinati) */}
      <View style={{ marginTop: 16 }}>
        <Text bold style={styles.exampleTitle}>
          Esempi rapidi
        </Text>
        <Text style={styles.example}>• 1 cup = 240 ml</Text>
        <Text style={styles.example}>• 1 tbsp = 15 ml</Text>
        <Text style={styles.example}>• 1 tsp = 5 ml</Text>
        <Text style={styles.example}>• 1 oz = 28 g</Text>
        <Text style={styles.example}>• 1 lb = 454 g</Text>
      </View>

      {/* RESET */}
      <View style={styles.footerRow}>
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <Ionicons name="refresh-outline" size={18} color="#ffffff" />
          <Text bold style={styles.resetText}>
            Reset
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ============================================================
   ⭐ VOLUME ↔ PESO
   ============================================================ */
function VolumeWeightCard() {
  const density = {
    acqua: 1.0,
    latte: 1.03,
    olio: 0.92,
    farina00: 0.53,
    farinaManitoba: 0.55,
    zucchero: 0.85,
    zuccheroAvelo: 0.6,
    miele: 1.42,
    burroFuso: 0.91,
    panna: 1.01,
    uovaSbattute: 1.03,
  };

  type IngredientKey = keyof typeof density;
  const ingredients: IngredientKey[] = Object.keys(density) as IngredientKey[];

  const [reverse, setReverse] = useState(false);

  const [mlValue, setMlValue] = useState("");
  const [gValue, setGValue] = useState("");

  const [ingredient, setIngredient] = useState<IngredientKey>("acqua");

  const mlToG = (v: number) => v * density[ingredient];
  const gToMl = (v: number) => v / density[ingredient];

  const handleMlChange = (text: string) => {
    setMlValue(text);
    const num = parseFloat(text);
    if (!isNaN(num)) setGValue(mlToG(num).toFixed(2));
    else setGValue("");
  };

  const handleGChange = (text: string) => {
    setGValue(text);
    const num = parseFloat(text);
    if (!isNaN(num)) setMlValue(gToMl(num).toFixed(2));
    else setMlValue("");
  };

  // ⭐ RESET
  const handleReset = () => {
    setMlValue("");
    setGValue("");
    setIngredient("acqua");
  };

  return (
    <View style={styles.card}>
      {/* ICONA */}
      <View style={styles.iconContainer}>
        <Image
          source={require("../../assets/images/volume.png")}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>

      {/* TITOLO */}
      <Text bold style={styles.cardTitle}>
        Volume ↔ Peso
      </Text>

      {/* DESCRIZIONE */}
      <Text style={styles.description}>
        Converti facilmente tra ml e grammi in base all’ingrediente selezionato.
        Ogni ingrediente ha una densità diversa, quindi ml e g non corrispondono
        sempre.
      </Text>
      <View style={styles.separator}></View>

      {/* INPUTS + SWAP */}
      <View style={styles.rowCenter}>
        {/* INPUT ML */}
        <View style={styles.inputColumn}>
          <Text style={styles.label}>Millilitri</Text>
          <View style={styles.inputWithUnit}>
            <Input
              style={[styles.input, { flex: 1 }]}
              placeholder="0"
              keyboardType="numeric"
              value={mlValue}
              onChangeText={handleMlChange}
              onFocus={() => setMlValue("")}
            />
            <Text style={styles.unit}>ml</Text>
          </View>
        </View>

        {/* SWAP */}
        <TouchableOpacity
          style={{ paddingHorizontal: 10 }}
          onPress={() => {
            setReverse(!reverse);
            const temp = mlValue;
            setMlValue(gValue);
            setGValue(temp);
          }}
        >
          <Ionicons
            name="swap-horizontal-outline"
            size={32}
            color="#444"
            style={[
              styles.swapIcon,
              { marginTop: 10 },
              { transform: [{ rotate: reverse ? "180deg" : "0deg" }] },
            ]}
          />
        </TouchableOpacity>

        {/* INPUT G */}
        <View style={styles.inputColumn}>
          <Text style={styles.label}>Grammi</Text>
          <View style={styles.inputWithUnit}>
            <Input
              style={[styles.input, { flex: 1 }]}
              placeholder="0"
              keyboardType="numeric"
              value={gValue}
              onChangeText={handleGChange}
              onFocus={() => setGValue("")}
            />
            <Text style={styles.unit}>g</Text>
          </View>
        </View>
      </View>

      {/* PILLS INGREDIENTI */}
      <View style={styles.pillRowFull}>
        {ingredients.map((ing) => (
          <TouchableOpacity
            key={ing}
            style={[styles.pill, ingredient === ing && styles.pillActive]}
            onPress={() => {
              setIngredient(ing);
              if (mlValue) handleMlChange(mlValue);
              if (gValue) handleGChange(gValue);
            }}
          >
            <Text
              style={[
                styles.pillText,
                ingredient === ing && styles.pillTextActive,
              ]}
            >
              {ing}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* FORMULA */}
      <Text
        style={[
          styles.example,
          { fontSize: 12, opacity: 0.7, marginTop: 15, textAlign: "center" },
        ]}
      >
        grammi = ml × densità • ml = grammi ÷ densità
      </Text>

      {/* RESET */}
      <View style={styles.footerRow}>
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <Ionicons name="refresh-outline" size={18} color="#ffffff" />
          <Text bold style={styles.resetText}>
            Reset
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ============================================================
   ⭐ TEMPERATURA FORNO
   ============================================================ */
function TemperatureCard() {
  const [reverse, setReverse] = useState(false);

  const [cValue, setCValue] = useState("");
  const [fValue, setFValue] = useState("");

  // Statico / Ventilato
  const [staticTemp, setStaticTemp] = useState("");
  const [fanTemp, setFanTemp] = useState("");

  const CtoF = (c: number) => (c * 9) / 5 + 32;
  const FtoC = (f: number) => ((f - 32) * 5) / 9;

  const handleCChange = (text: string) => {
    setCValue(text);
    const num = parseFloat(text);
    if (!isNaN(num)) setFValue(CtoF(num).toFixed(0));
    else setFValue("");
  };

  const handleFChange = (text: string) => {
    setFValue(text);
    const num = parseFloat(text);
    if (!isNaN(num)) setCValue(FtoC(num).toFixed(0));
    else setCValue("");
  };

  // Statico ↔ Ventilato
  const handleStaticChange = (text: string) => {
    setStaticTemp(text);
    const num = parseFloat(text);
    if (!isNaN(num)) setFanTemp((num - 20).toString());
    else setFanTemp("");
  };

  const handleFanChange = (text: string) => {
    setFanTemp(text);
    const num = parseFloat(text);
    if (!isNaN(num)) setStaticTemp((num + 20).toString());
    else setStaticTemp("");
  };

  // RESET
  const handleReset = () => {
    setCValue("");
    setFValue("");
    setStaticTemp("");
    setFanTemp("");
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Image
          source={require("../../assets/images/oven.png")}
          style={styles.icon}
          resizeMode="contain"
        />{" "}
      </View>

      <Text bold style={styles.cardTitle}>
        Temperatura forno
      </Text>
      <Text style={styles.description}>
        Converti rapidamente tra Celsius e Fahrenheit e tra forno statico e
        ventilato. Le equivalenze sono calcolate automaticamente per ottenere la
        temperatura corretta in ogni ricetta.
      </Text>
      <View style={styles.separator}></View>

      {/* ⭐ SEZIONE CELSIUS ↔ FAHRENHEIT */}
      <Text bold style={styles.sectionHeader}>
        Celsius ↔ Fahrenheit
      </Text>

      <View style={styles.rowCenter}>
        {/* °C */}
        <View style={styles.inputColumn}>
          <Text style={styles.label}>Celsius</Text>
          <View style={styles.inputWithUnit}>
            <Input
              style={[styles.input, { flex: 1 }]}
              placeholder="0"
              keyboardType="numeric"
              value={cValue}
              onChangeText={handleCChange}
              onFocus={() => setCValue("")}
            />
            <Text style={styles.unit}>°C</Text>
          </View>
        </View>

        {/* SWAP */}
        <TouchableOpacity
          style={{ paddingHorizontal: 10 }}
          onPress={() => {
            setReverse(!reverse);
            const temp = cValue;
            setCValue(fValue);
            setFValue(temp);
          }}
        >
          <Ionicons
            name="swap-horizontal-outline"
            size={32}
            color="#444"
            style={[
              { transform: [{ rotate: reverse ? "180deg" : "0deg" }] },
              { marginTop: 40 },
            ]}
          />
        </TouchableOpacity>

        {/* °F */}
        <View style={styles.inputColumn}>
          <Text style={styles.label}>Fahrenheit</Text>
          <View style={styles.inputWithUnit}>
            <Input
              style={[styles.input, { flex: 1 }]}
              placeholder="0"
              keyboardType="numeric"
              value={fValue}
              onChangeText={handleFChange}
              onFocus={() => setFValue("")}
            />
            <Text style={styles.unit}>°F</Text>
          </View>
        </View>
      </View>
      <Text
        style={[
          styles.example,
          { fontSize: 12, opacity: 0.7, marginTop: 6, textAlign: "center" },
        ]}
      >
        °F = (°C × 9/5) + 32 • °C = (°F − 32) × 5/9
      </Text>

      <View style={styles.separator}></View>

      {/* ⭐ SEZIONE STATICO ↔ VENTILATO */}
      <Text bold style={[styles.sectionHeader, { marginTop: 24 }]}>
        Statico ↔ Ventilato
      </Text>

      <View style={styles.rowCenter}>
        {/* STATICO */}
        <View style={styles.inputColumn}>
          <Text style={styles.label}>Statico</Text>
          <View style={styles.inputWithUnit}>
            <Input
              style={[styles.input, { flex: 1 }]}
              placeholder="0"
              keyboardType="numeric"
              value={staticTemp}
              onChangeText={handleStaticChange}
              onFocus={() => setStaticTemp("")}
            />
            <Text style={styles.unit}>°C</Text>
          </View>
        </View>

        {/* FRECCIA */}
        <TouchableOpacity style={{ paddingHorizontal: 10 }}>
          <Ionicons
            name="swap-horizontal-outline"
            size={32}
            color="#444"
            style={[
              { transform: [{ rotate: reverse ? "180deg" : "0deg" }] },
              { marginTop: 40 },
            ]}
          />
        </TouchableOpacity>

        {/* VENTILATO */}
        <View style={styles.inputColumn}>
          <Text style={styles.label}>Ventilato</Text>
          <View style={styles.inputWithUnit}>
            <Input
              style={[styles.input, { flex: 1 }]}
              placeholder="0"
              keyboardType="numeric"
              value={fanTemp}
              onChangeText={handleFanChange}
              onFocus={() => setFanTemp("")}
            />
            <Text style={styles.unit}>°C</Text>
          </View>
        </View>
      </View>

      <Text
        style={[styles.example, { fontSize: 12, opacity: 0.7, marginTop: 6 }]}
      >
        Statico = Ventilato + 20°C • Ventilato = Statico – 20°C
      </Text>

      {/* RESET */}
      <View style={styles.footerRow}>
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <Ionicons name="refresh-outline" size={18} color="#ffffff" />
          <Text bold style={styles.resetText}>
            Reset
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ============================================================
   ⭐ LIEVITO FRESCO ↔ SECCO
   ============================================================ */
function YeastCard() {
  const [reverse, setReverse] = useState(false);

  const [freshValue, setFreshValue] = useState("");
  const [dryValue, setDryValue] = useState("");

  const freshToDry = (v: number) => v / 3;
  const dryToFresh = (v: number) => v * 3;

  const handleFreshChange = (text: string) => {
    setFreshValue(text);
    const num = parseFloat(text);
    if (!isNaN(num)) setDryValue(freshToDry(num).toFixed(2));
    else setDryValue("");
  };

  const handleDryChange = (text: string) => {
    setDryValue(text);
    const num = parseFloat(text);
    if (!isNaN(num)) setFreshValue(dryToFresh(num).toFixed(2));
    else setFreshValue("");
  };

  // ⭐ RESET
  const handleReset = () => {
    setFreshValue("");
    setDryValue("");
  };

  return (
    <View style={styles.card}>
      {/* ICONA */}
      <View style={styles.iconContainer}>
        <Image
          source={require("../../assets/images/yeast.png")}
          style={styles.icon}
          resizeMode="contain"
        />{" "}
      </View>

      {/* TITOLO */}
      <Text bold style={styles.cardTitle}>
        Lievito fresco ↔ secco
      </Text>

      {/* DESCRIZIONE */}
      <Text style={styles.description}>
        Converti facilmente tra lievito fresco e lievito secco. Il lievito secco
        è tre volte più concentrato: serve un terzo della quantità rispetto al
        fresco.
      </Text>
      <View style={styles.separator}></View>

      {/* INPUTS + SWAP */}
      <View style={styles.rowCenter}>
        {/* INPUT FRESCO */}
        <View style={styles.inputColumn}>
          <Text style={styles.label}>Fresco</Text>
          <View style={styles.inputWithUnit}>
            <Input
              style={[styles.input, { flex: 1 }]}
              placeholder="0"
              keyboardType="numeric"
              value={freshValue}
              onChangeText={handleFreshChange}
              onFocus={() => setFreshValue("")}
            />
            <Text style={styles.unit}>g</Text>
          </View>
        </View>

        {/* SWAP */}
        <TouchableOpacity
          style={{ paddingHorizontal: 10 }}
          onPress={() => {
            setReverse(!reverse);
            const temp = freshValue;
            setFreshValue(dryValue);
            setDryValue(temp);
          }}
        >
          <Ionicons
            name="swap-horizontal-outline"
            size={32}
            color="#444"
            style={[
              { transform: [{ rotate: reverse ? "180deg" : "0deg" }] },
              { marginTop: 40 },
            ]}
          />
        </TouchableOpacity>

        {/* INPUT SECCO */}
        <View style={styles.inputColumn}>
          <Text style={styles.label}>Secco</Text>
          <View style={styles.inputWithUnit}>
            <Input
              style={[styles.input, { flex: 1 }]}
              placeholder="0"
              keyboardType="numeric"
              value={dryValue}
              onChangeText={handleDryChange}
              onFocus={() => setDryValue("")}
            />
            <Text style={styles.unit}>g</Text>
          </View>
        </View>
      </View>

      {/* FORMULA */}
      <Text
        style={[
          styles.example,
          { fontSize: 12, opacity: 0.7, marginTop: 6, textAlign: "center" },
        ]}
      >
        secco = fresco ÷ 3 • fresco = secco × 3
      </Text>

      {/* RESET */}
      <View style={styles.footerRow}>
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <Ionicons name="refresh-outline" size={18} color="#ffffff" />
          <Text bold style={styles.resetText}>
            Reset
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ============================================================
   ⭐ FORZA FARINA (W)
   ============================================================ */
function FlourStrengthCard() {
  const [W0, setW0] = useState("");
  const [g0, setG0] = useState("");

  const [W1, setW1] = useState("");
  const [W2, setW2] = useState("");
  const [W3, setW3] = useState("");

  const [g1, setG1] = useState("");
  const [g2, setG2] = useState("");
  const [g3, setG3] = useState("");

  const parse = (v: string) => {
    const n = parseFloat(v.replace(",", "."));
    return isNaN(n) ? null : n;
  };

  const solveFlours = () => {
    const Wt = parse(W0);
    const Gt = parse(g0);
    const w1 = parse(W1);
    const w2 = parse(W2);
    const w3 = parse(W3);

    if (Wt == null || Gt == null || Gt <= 0) return;

    const has1 = w1 != null;
    const has2 = w2 != null;
    const has3 = w3 != null;

    // 2 farine: W1 e W2 presenti, W3 vuota
    if (has1 && has2 && !has3) {
      const denom = w1! - w2!;
      if (denom === 0) return;

      const g1Calc = (Gt * (Wt - w2!)) / denom;
      const g2Calc = Gt - g1Calc;

      if (g1Calc >= 0 && g2Calc >= 0) {
        setG1(g1Calc.toFixed(0));
        setG2(g2Calc.toFixed(0));
        setG3("");
      }
      return;
    }

    // 3 farine: tutte presenti
    if (has1 && has2 && has3) {
      const d1 = Math.abs(Wt - w1!);
      const d2 = Math.abs(Wt - w2!);
      const d3 = Math.abs(Wt - w3!);

      const inv1 = 1 / (d1 + 1);
      const inv2 = 1 / (d2 + 1);
      const inv3 = 1 / (d3 + 1);

      const sum = inv1 + inv2 + inv3;
      if (sum === 0) return;

      const G1 = (inv1 / sum) * Gt;
      const G2 = (inv2 / sum) * Gt;
      const G3 = (inv3 / sum) * Gt;

      setG1(G1.toFixed(0));
      setG2(G2.toFixed(0));
      setG3(G3.toFixed(0));
    }
  };

  useEffect(() => {
    solveFlours();
  }, [W0, g0, W1, W2, W3]);

  const handleReset = () => {
    setW0("");
    setG0("");
    setW1("");
    setW2("");
    setW3("");
    setG1("");
    setG2("");
    setG3("");
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Image
          source={require("../../assets/images/flour.png")}
          style={styles.icon}
          resizeMode="contain"
        />{" "}
      </View>

      <Text bold style={styles.cardTitle}>
        Forza farina (W)
      </Text>

      <Text style={styles.description}>
        Inserisci peso e forza della farina che devi ottenere e la forza delle
        farine che hai a disposizione. Otterrai automaticamente i grammi delle
        farine da miscelare.
      </Text>
      <View style={styles.separator}></View>

      {/* Farina da ottenere */}
      <View style={styles.rowCenter}>
        <Text style={styles.sectionTitle}>Farina da ottenere:</Text>

        <Input
          label="Forza (W)"
          style={styles.input}
          placeholder="W₀"
          keyboardType="numeric"
          value={W0}
          onChangeText={setW0}
          onFocus={() => setW0("")}
        />

        <Input
          label="Peso (g)"
          style={styles.input}
          placeholder="g₀"
          keyboardType="numeric"
          value={g0}
          onChangeText={setG0}
          onFocus={() => setG0("")}
        />
      </View>

      <Text style={styles.bigSymbol}>=</Text>

      {/* Farina 1 */}
      <View style={styles.rowCenter}>
        <Text style={styles.sectionTitle}>Farina 1:</Text>

        <Input
          style={styles.input}
          placeholder="W₁"
          keyboardType="numeric"
          value={W1}
          onChangeText={setW1}
          onFocus={() => setW1("")}
        />

        <Input
          style={styles.input}
          placeholder="g₁"
          keyboardType="numeric"
          value={g1}
          onChangeText={setG1}
          onFocus={() => setG1("")}
        />
      </View>

      <Text style={styles.bigSymbol}>+</Text>

      {/* Farina 2 */}
      <View style={styles.rowCenter}>
        <Text style={styles.sectionTitle}>Farina 2:</Text>

        <Input
          style={styles.input}
          placeholder="W₂"
          keyboardType="numeric"
          value={W2}
          onChangeText={setW2}
          onFocus={() => setW2("")}
        />

        <Input
          style={styles.input}
          placeholder="g₂"
          keyboardType="numeric"
          value={g2}
          onChangeText={setG2}
          onFocus={() => setG2("")}
        />
      </View>

      <Text style={styles.bigSymbol}>+</Text>

      {/* Farina 3 */}
      <View style={styles.rowCenter}>
        <Text style={styles.sectionTitle}>Farina 3:</Text>

        <Input
          style={styles.input}
          placeholder="W₃"
          keyboardType="numeric"
          value={W3}
          onChangeText={setW3}
          onFocus={() => setW3("")}
        />

        <Input
          style={styles.input}
          placeholder="g₃"
          keyboardType="numeric"
          value={g3}
          onChangeText={setG3}
          onFocus={() => setG3("")}
        />
      </View>

      {/* Reset in basso a destra */}
      <View style={styles.footerRow}>
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <Ionicons name="refresh-outline" size={18} color="#ffffff" />
          <Text bold style={styles.resetText}>
            Reset
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
/* ============================================================
   ⭐ SOSTITUZIONI UTILI
   ============================================================ */
function IngredientSubstitutionCard() {
  const substitutions = [
    { ingredient: "Burro", substitute: "Olio", ratio: "100 g → 80 g" },
    { ingredient: "Zucchero", substitute: "Miele", ratio: "100 g → 70 g" },
    {
      ingredient: "Latte",
      substitute: "Acqua + burro",
      ratio: "100 ml → 90 ml + 10 g",
    },
    { ingredient: "Uova", substitute: "Yogurt", ratio: "1 uovo → 60 g yogurt" },
    {
      ingredient: "Panna",
      substitute: "Latte + burro",
      ratio: "100 ml → 80 ml + 20 g",
    },
    {
      ingredient: "Farina 00",
      substitute: "Manitoba",
      ratio: "1:1 (più assorbente)",
    },

    {
      ingredient: "Lievito chimico",
      substitute: "Bicarbonato + acido",
      ratio: "1 bustina → 6 g bicarbonato + 12 g succo limone",
    },
    {
      ingredient: "Maizena",
      substitute: "Farina 00",
      ratio: "1 cucchiaio → 2 cucchiai farina (meno setosa)",
    },
    {
      ingredient: "Maizena",
      substitute: "Fecola di patate",
      ratio: "1:1 (più umida)",
    },
    {
      ingredient: "Fecola di patate",
      substitute: "Maizena",
      ratio: "1:1 (più asciutta)",
    },
    {
      ingredient: "Ricotta",
      substitute: "Yogurt greco",
      ratio: "100 g → 80 g",
    },
    {
      ingredient: "Mascarpone",
      substitute: "Panna + yogurt",
      ratio: "100 g → 60 g panna + 40 g yogurt",
    },
    {
      ingredient: "Panna fresca",
      substitute: "Latte + burro",
      ratio: "250 ml → 200 ml latte + 50 g burro",
    },
    {
      ingredient: "Cioccolato fondente",
      substitute: "Cacao + burro + zucchero",
      ratio: "100 g → 40 g cacao + 40 g burro + 20 g zucchero",
    },
    {
      ingredient: "Cioccolato al latte",
      substitute: "Fondente + latte + zucchero",
      ratio: "100 g → 70 g fondente + 20 g latte + 10 g zucchero",
    },
    {
      ingredient: "Yogurt",
      substitute: "Panna acida",
      ratio: "100 g → 100 g (più acida)",
    },
    {
      ingredient: "Panna acida",
      substitute: "Yogurt + limone",
      ratio: "100 g → 100 g yogurt + 1 cucchiaino limone",
    },
    {
      ingredient: "Burro",
      substitute: "Margarina",
      ratio: "1:1 (meno sapore)",
    },
    {
      ingredient: "Burro",
      substitute: "Burro chiarificato",
      ratio: "100 g → 75 g",
    },
    {
      ingredient: "Zucchero semolato",
      substitute: "Zucchero a velo",
      ratio: "100 g → 100 g (più fine)",
    },
    {
      ingredient: "Zucchero semolato",
      substitute: "Zucchero di canna",
      ratio: "100 g → 110 g (più umido)",
    },
    {
      ingredient: "Farina di mandorle",
      substitute: "Mandorle tritate",
      ratio: "100 g → 100 g (più grossolane)",
    },
    {
      ingredient: "Farina di mandorle",
      substitute: "Farina 00 + aroma mandorla",
      ratio: "100 g → 70 g farina + 30 g burro + aroma",
    },
    {
      ingredient: "Latte",
      substitute: "Bevanda vegetale",
      ratio: "1:1 (mandorla più dolce, soia più neutra)",
    },
    {
      ingredient: "Uova",
      substitute: "Acquafaba",
      ratio: "1 uovo → 45 ml acquafaba",
    },
    {
      ingredient: "Uova",
      substitute: "Banana schiacciata",
      ratio: "1 uovo → 60 g banana (solo dolci)",
    },
    {
      ingredient: "Uova",
      substitute: "Semi di lino",
      ratio: "1 uovo → 1 cucchiaio lino + 3 cucchiai acqua",
    },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Image
          source={require("../../assets/images/subs.png")}
          style={styles.icon}
          resizeMode="contain"
        />{" "}
      </View>

      <Text bold style={styles.cardTitle}>
        Sostituzioni ingredienti
      </Text>

      <Text style={styles.description}>
        Quando ti manca un ingrediente, puoi usare queste sostituzioni
        equivalenti mantenendo un buon risultato nella ricetta.
      </Text>
      <View style={styles.separator}></View>

      {substitutions.map((s, i) => (
        <View key={i} style={styles.subRowCentered}>
          <View style={styles.subLine}>
            <Text style={styles.subIngredient}>{s.ingredient}</Text>
            <Ionicons name="arrow-forward-outline" size={18} color="#666" />
            <Text style={styles.subSub}>{s.substitute}</Text>
          </View>

          <Text style={styles.subRatio}>{s.ratio}</Text>
        </View>
      ))}
    </View>
  );
}

/* ============================================================
   ⭐ STILI
   ============================================================ */
const styles = StyleSheet.create({
  container: {
    paddingTop: 90,
    backgroundColor: "#fffaf0",
  },
  header: {
    // paddingVertical: 20,
    alignItems: "center",
  },
  title: { fontSize: 28, padding: 20, textAlign: "center", marginBottom: 20 },
  icon: {
    height: 60,
    width: 60,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 6,
    marginTop: 10,
  },
  cardTitle: {
    textAlign: "center",
    fontSize: 22,
    marginBottom: 20,
  },
  swapButton: {
    alignSelf: "center",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },

  selector: {
    backgroundColor: "#ddd",
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: 10,
  },
  selectorText: {
    fontSize: 16,
    fontWeight: "500",
  },
  result: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },

  exampleTitle: {
    fontSize: 14,
    marginBottom: 4,
    color: "#444",
    textAlign: "center",
  },

  example: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    color: "#555",
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "flex-start", // ⭐ NON center
    justifyContent: "center",
    gap: 12,
  },

  inputColumn: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    alignItems: "center",
  },

  input: {
    height: 48,
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 14,
    borderRadius: 12,
    fontSize: 18,
    textAlign: "center",
    width: "100%",
    borderColor: "white",
  },

  pillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },

  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#eee",
  },

  pillActive: {
    backgroundColor: "#444",
  },

  pillText: {
    fontSize: 14,
    color: "#444",
  },

  pillTextActive: {
    color: "white",
    fontWeight: "600",
  },
  inputBlock: {
    flex: 1,
    minWidth: 0, // ⭐ impedisce l’allargamento
    flexShrink: 0, // ⭐ impedisce di deformarsi
  },

  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  swapIcon: {
    paddingTop: 30,
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginTop: 10,
    marginBottom: 30,
  },

  pillRowFull: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: 15,
  },

  description: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
    marginRight: 8,
    width: 120,
    marginTop: 20,
  },

  bigSymbol: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    color: "#444",
    marginRight: 60,
  },
  footerRow: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
  },

  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },

  resetText: {
    marginLeft: 4,
    fontSize: 13,
    color: "#ffffff",
  },

  shapeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#eee",
    borderRadius: 8,
    marginHorizontal: 4,
  },

  shapeActive: {
    backgroundColor: "#ddd",
  },

  shapeText: {
    fontSize: 14,
    color: "#444",
  },

  xSymbol: {
    fontSize: 22,
    fontWeight: "700",
    marginHorizontal: 6,
    color: "#444",
  },
  dimLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#555",
    marginBottom: 2,
    marginTop: 5,
  },
  modeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#eee",
    marginHorizontal: 4,
  },

  modeActive: {
    backgroundColor: "#ddd",
  },
  sectionHeader: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#444",
  },

  inputWithUnit: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },

  unit: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
    color: "#444",
  },
  subRow: {
    flexDirection: "column",
    backgroundColor: "#f7f7f7",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  subIngredient: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
    flexShrink: 1, // ⭐ evita overflow
    maxWidth: "100%", // ⭐ impedisce di uscire dalla card
  },

  subSub: {
    fontSize: 16,
    color: "#555",
    fontWeight: "500",
    textAlign: "center",
    flexShrink: 1, // ⭐ evita overflow
    maxWidth: "100%",
  },

  subRatio: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginTop: 4,
    flexShrink: 1,
    maxWidth: "100%",
  },
  menuButton: {
    backgroundColor: "#f2f2f2",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  menuButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },

  backButton: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#eee",
    borderRadius: 10,
  },

  backButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#444",
  },
  subRowCentered: {
    backgroundColor: "#f7f7f7",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },

  subLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap", // ⭐ permette di andare a capo
    gap: 10,
    marginBottom: 4,
    width: "100%",
  },
  menuGrid: {
    flexDirection: "column",
    width: "100%",
    justifyContent: "center",
    marginTop: 5,
  },

  menuCard: {
    width: "100%",
    backgroundColor: "#fff",
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },

  menuIcon: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },

  menuLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
  },

  backTopLeft: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 999,
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 50,
    elevation: 3,
  },
  menuCardColumn: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    overflow: "hidden",
    width: "100%",
  },
  menuCardTextBlock: {
    padding: 20,
  },

  menuCardTitle: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },

  menuCardDesc: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 16,
  },
  menuCardImageTop: {
    width: "100%",
    height: 220,
    backgroundColor: "#eee",
  },
});
