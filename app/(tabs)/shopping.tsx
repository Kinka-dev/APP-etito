// app/(tabs)/shopping.tsx
import Input from "@/components/Input";
import Text from "@/components/Text";
import { COLORS } from "@/constants/colors";
import { useRecipeContext } from "@/context/RecipeContext";
import { Ingredient } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  checked: boolean;
  isNew?: boolean;
}

export default function ShoppingScreen() {
  const {
    shoppingList: contextShoppingList,
    clearShoppingList,
    setShoppingList,
  } = useRecipeContext();

  const [items, setItems] = useState<ShoppingItem[]>([
    {
      id: `new-${Date.now()}-${Math.random()}`,
      name: "",
      quantity: "",
      unit: "",
      checked: false,
      isNew: true,
    },
  ]);

  // IMPORTA INGREDIENTI DAL CONTESTO
  useEffect(() => {
    if (contextShoppingList.length === 0) return;

    setItems((prev) => {
      let current = prev.filter((item) => !item.isNew);

      const existingNames = new Set(
        current.map((item) => item.name.toLowerCase().trim()),
      );

      contextShoppingList.forEach((ing: Ingredient) => {
        const ingName = (ing.name || "").toLowerCase().trim();
        if (ingName && !existingNames.has(ingName)) {
          current.push({
            id: `imp-${Date.now()}-${Math.random()}`,
            name: ing.name || "",
            quantity: ing.quantity || "",
            unit: ing.unit || "",
            checked: false,
          });
          existingNames.add(ingName);
        }
      });

      if (!current.some((i) => i.isNew)) {
        current.push({
          id: `new-${Date.now()}-${Math.random()}`,
          name: "",
          quantity: "",
          unit: "",
          checked: false,
          isNew: true,
        });
      }

      return current;
    });
  }, [contextShoppingList]);

  // AGGIUNGI O TRASFORMA RIGA NEW
  const addOrUpdateItem = (index: number) => {
    const item = items[index];
    if (item.isNew && !item.name.trim()) return;

    setItems((prev) => {
      const newItems = [...prev];

      if (item.isNew) {
        newItems[index] = {
          ...item,
          id: `item-${Date.now()}`,
          isNew: false,
        };

        newItems.push({
          id: `new-${Date.now()}-${Math.random()}`,
          name: "",
          quantity: "",
          unit: "",
          checked: false,
          isNew: true,
        });
      }

      setShoppingList(newItems.filter((i) => !i.isNew));
      return newItems;
    });
  };

  const updateField = (
    index: number,
    field: "name" | "quantity" | "unit",
    value: string,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const toggleCheck = (id: string) => {
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      );
      setShoppingList(updated.filter((i) => !i.isNew));
      return updated;
    });
  };

  const deleteItem = (id: string) => {
    setItems((prev) => {
      let filtered = prev.filter((item) => item.id !== id);

      if (!filtered.some((item) => item.isNew)) {
        filtered.push({
          id: `new-${Date.now()}-${Math.random()}`,
          name: "",
          quantity: "",
          unit: "",
          checked: false,
          isNew: true,
        });
      }

      setShoppingList(filtered.filter((i) => !i.isNew));
      return filtered;
    });
  };

  const clearAll = () => {
    Alert.alert("Svuota lista", "Vuoi eliminare tutto?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Svuota",
        style: "destructive",
        onPress: () => {
          const emptyNewRow = [
            {
              id: `new-${Date.now()}-${Math.random()}`,
              name: "",
              quantity: "",
              unit: "",
              checked: false,
              isNew: true,
            },
          ];
          setItems(emptyNewRow);
          clearShoppingList();
          setShoppingList([]);
        },
      },
    ]);
  };

  const shareList = async () => {
    const activeItems = items.filter((item) => !item.isNew && item.name.trim());
    if (activeItems.length === 0) return;

    const text = activeItems
      .map((item) =>
        `${item.checked ? "✅" : "⬜"} ${item.name} ${item.quantity} ${item.unit}`.trim(),
      )
      .join("\n");

    try {
      await Share.share({ message: `📋 Lista della Spesa\n\n${text}` });
    } catch (error) {
      Alert.alert("Errore", "Non è stato possibile condividere la lista");
    }
  };

  const moveItemUp = (index: number) => {
    setItems((prev) => {
      if (index === 0) return prev; // già in cima
      const newArr = [...prev];
      const temp = newArr[index - 1];
      newArr[index - 1] = newArr[index];
      newArr[index] = temp;
      return newArr;
    });
  };

  const moveItemDown = (index: number) => {
    setItems((prev) => {
      if (index === prev.length - 1) return prev; // già in fondo
      const newArr = [...prev];
      const temp = newArr[index + 1];
      newArr[index + 1] = newArr[index];
      newArr[index] = temp;
      return newArr;
    });
  };

  // ====================== DETTATURA VOCALE DEL TELEFONO ======================
  const startVoiceInput = (index: number) => {
    Alert.prompt(
      "🎤 Dettatura vocale",
      'Parla chiaramente. Il sistema trascriverà quello che dici.\n\nEsempio: "due litri di latte intero"',
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Conferma",
          onPress: (spokenText?: string) => {
            if (spokenText && spokenText.trim()) {
              const parsed = parseSpokenText(spokenText);

              setItems((prev) => {
                const newItems = [...prev];
                newItems[index] = {
                  ...newItems[index],
                  name: parsed.product,
                  quantity: parsed.quantity,
                  unit: parsed.unit,
                  isNew: false,
                };

                if (!newItems.some((i) => i.isNew)) {
                  newItems.push({
                    id: `new-${Date.now()}-${Math.random()}`,
                    name: "",
                    quantity: "",
                    unit: "",
                    checked: false,
                    isNew: true,
                  });
                }

                return newItems;
              });
            }
          },
        },
      ],
    );
  };

  const parseSpokenText = (text: string) => {
    const lower = text.toLowerCase().trim();

    const qtyMatch = lower.match(
      /(\d+[.,]?\d*)\s*(litro|litri|kg|grammi|g|ml|bottiglia|bottiglie|confezione|pezzo|pezzi)?/i,
    );

    let quantity = "";
    let unit = "";
    let product = text;

    if (qtyMatch) {
      quantity = qtyMatch[1].replace(",", ".");
      if (qtyMatch[2]) unit = qtyMatch[2];
      product = lower.replace(qtyMatch[0], "").trim();
    }

    product = product.replace(/^(di|del|della|delle|dei)\s+/i, "").trim();

    return {
      quantity: quantity || "",
      unit: unit || "",
      product: product || text,
    };
  };

  // ============================================================
  // 🔥 RENDER ITEM CON DRAG HANDLE
  // ============================================================

  const renderItem = ({
    item,
    drag,
    getIndex,
  }: RenderItemParams<ShoppingItem>) => {
    const index = getIndex();
    if (index === undefined) return null;

    return (
      <View style={styles.row}>
        {/* CHECKBOX */}
        {!item.isNew && (
          <View style={styles.cellCheckbox}>
            <TouchableOpacity onPress={() => toggleCheck(item.id)}>
              <Ionicons
                name={item.checked ? "checkbox" : "square-outline"}
                size={22}
                color={item.checked ? "#3a8654" : "#666"}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* NOME */}
        <View style={styles.cellName}>
          <View style={styles.inputWrapper}>
            <Input
              style={[styles.nameInput, item.checked && styles.checkedText]}
              value={item.name}
              onChangeText={(text) => updateField(index, "name", text)}
              placeholder={item.isNew ? "Scrivi prodotto…" : ""}
              multiline
              onBlur={() => addOrUpdateItem(index)}
            />
          </View>
        </View>

        {/* QTÀ */}
        <View style={styles.cellQty}>
          <View style={styles.inputWrapper}>
            <Input
              style={styles.qtyInput}
              value={item.quantity}
              onChangeText={(text) => updateField(index, "quantity", text)}
              placeholder="-"
              keyboardType="numeric"
              onBlur={() => addOrUpdateItem(index)}
            />
          </View>
        </View>

        {/* UNITÀ */}
        <View style={styles.cellUnit}>
          <View style={styles.inputWrapper}>
            <Input
              style={styles.unitInput}
              value={item.unit}
              onChangeText={(text) => updateField(index, "unit", text)}
              placeholder="-"
              onBlur={() => addOrUpdateItem(index)}
            />
          </View>
        </View>

        {/* DELETE */}
        <View style={styles.cellDelete}>
          {!item.isNew && (
            <TouchableOpacity onPress={() => deleteItem(item.id)}>
              <Ionicons name="trash-outline" size={20} color="#cb0047" />
            </TouchableOpacity>
          )}
        </View>

        {/* FRECCE SU/GIÙ */}
        <View style={styles.cellDrag}>
          {!item.isNew && (
            <>
              {/* Freccia SU */}
              <TouchableOpacity
                style={{ padding: 3 }}
                onPress={() => moveItemUp(index)}
              >
                <Ionicons name="caret-up" size={20} color={COLORS.primary} />
              </TouchableOpacity>

              {/* Freccia GIÙ */}
              <TouchableOpacity
                style={{ padding: 3 }}
                onPress={() => moveItemDown(index)}
              >
                <Ionicons name="caret-down" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER FISSO */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/spesa.png")}
          style={styles.icon}
          resizeMode="contain"
        />
        <Text bold style={styles.title}>
          Lista della Spesa
        </Text>
      </View>

      {/* INTESTAZIONE FISSA */}
      <View style={styles.headerRow}>
        <View style={styles.headerCheckbox} />
        <Text variant="title" style={styles.headerName}>
          Prodotto
        </Text>
        <Text variant="title" style={styles.headerQty}>
          Qtà
        </Text>
        <Text variant="title" style={styles.headerUnit}>
          Unità
        </Text>
        <View style={styles.separator}></View>
        <View style={styles.headerIcon} />
        <View style={styles.headerDrag} />
      </View>

      {/* LISTA SCORRIBILE */}
      <View style={{ flex: 1 }}>
        <DraggableFlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onDragEnd={({ data }) => {
            setItems(data);
            setShoppingList(data.filter((i) => !i.isNew));
          }}
        />
      </View>

      {/* BOTTONI FISSI IN BASSO */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.shareButton} onPress={shareList}>
          <Ionicons name="share-social-outline" size={22} color="white" />
          <Text bold style={styles.bottomButtonText}>
            Condividi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
          <Ionicons name="trash-outline" size={22} color="white" />
          <Text bold style={styles.bottomButtonText}>
            Svuota
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: "#fffaf0",
    marginBottom: -60,
    paddingHorizontal: 14,
  },

  header: { alignItems: "center" },
  title: { fontSize: 28, padding: 20, textAlign: "center", marginBottom: 20 },
  icon: { height: 60, width: 60, marginBottom: 10 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 15,
    backgroundColor: COLORS.primary,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 3,
    color: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginHorizontal: 10,
  },

  headerCheckbox: { width: 32 },
  headerName: { flex: 1, fontSize: 16, paddingLeft: 16, color: "white" },
  headerQty: {
    width: 50,
    textAlign: "center",
    fontSize: 16,
    color: "white",
  },
  headerUnit: {
    width: 50,
    textAlign: "center",
    fontSize: 16,
    color: "white",
  },
  headerIcon: { width: 36 },
  headerDrag: { width: 32 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "white",

    borderBottomWidth: 1,
    borderBottomColor: "#c6c6c6",
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
  },

  cellCheckbox: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  cellName: {
    flex: 1,
    paddingRight: 8,
    textAlignVertical: "center",
    paddingTop: 15,
  },

  cellQty: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    textAlignVertical: "center",
    paddingTop: 15,
  },

  cellUnit: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    textAlignVertical: "center",
    paddingTop: 15,
  },

  nameInput: {
    minHeight: 40,
    borderColor: "white",
    textAlignVertical: "center",
    textAlign: "left",
    paddingVertical: 0,
  },
  qtyInput: {
    width: "100%",
    textAlign: "left",
    borderColor: "white",
    paddingVertical: 0,
    textAlignVertical: "center",
  },
  unitInput: {
    width: "100%",
    textAlign: "left",
    borderColor: "white",
    paddingVertical: 0,
    textAlignVertical: "center",
  },

  cellDrag: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomButtons: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#fffaf0",
    marginBottom: 10,
  },

  shareButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  clearButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  bottomButtonText: { color: "white", fontSize: 16 },

  checkedText: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  cellDelete: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 3,
  },
  inputWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 18,
  },
});
