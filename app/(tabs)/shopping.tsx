// app/(tabs)/shopping.tsx
import Input from "@/components/Input";
import Text from "@/components/Text";
import { COLORS } from "@/constants/colors";
import { useRecipeContext } from "@/context/RecipeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  ImageBackground,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeOutRight,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  checked: boolean;
  isNew?: boolean;
  raw?: string;
}

function ShoppingRow({
  item,
  index,
  toggleCheck,
  deleteItem,
  updateField,
  addOrUpdateItem,
}: {
  item: ShoppingItem;
  index: number;
  toggleCheck: (id: string) => void;
  deleteItem: (id: string) => void;
  updateField: (index: number, field: keyof ShoppingItem, value: any) => void;
  addOrUpdateItem: (index: number) => void;
}) {
  const translateX = useSharedValue(0);
  const THRESHOLD_RIGHT = 35;
  const THRESHOLD_LEFT = -50;

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd(() => {
      if (translateX.value > THRESHOLD_RIGHT) {
        runOnJS(toggleCheck)(item.id);
      } else if (translateX.value < THRESHOLD_LEFT) {
        runOnJS(deleteItem)(item.id);
        return;
      }
      translateX.value = withTiming(0, { duration: 150 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backgroundSwipeStyle = useAnimatedStyle(() => {
    if (translateX.value < 0) return { backgroundColor: "#cb0047" };
    if (translateX.value > 0) return { backgroundColor: "#3a8654" };
    return { backgroundColor: "transparent" };
  });

  return (
    <Animated.View
      exiting={FadeOutRight.duration(200)}
      style={{ marginBottom: 10 }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            justifyContent: "center",
            paddingHorizontal: 16,
          },
          backgroundSwipeStyle,
        ]}
      >
        {translateX.value < 0 && (
          <View style={{ alignItems: "flex-end" }}>
            <Ionicons name="trash-outline" size={22} color="white" />
          </View>
        )}
        {translateX.value > 0 && (
          <View style={{ alignItems: "flex-start" }}>
            <Ionicons name="checkmark-done" size={22} color="white" />
          </View>
        )}
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.row, animatedStyle]}>
          {!item.isNew && (
            <TouchableOpacity
              onPress={() => toggleCheck(item.id)}
              style={{ paddingRight: 8 }}
            >
              <Ionicons
                name={item.checked ? "checkbox" : "square-outline"}
                size={22}
                color={item.checked ? "#3a8654" : "#666"}
              />
            </TouchableOpacity>
          )}

          <View style={{ flex: 1 }}>
            <Input
              style={[
                {
                  flex: 1,
                  fontSize: 16,
                  paddingVertical: 4,
                  marginTop: 12,
                  borderColor: "white",
                },
                item.checked && styles.checkedText,
              ]}
              value={
                item.raw ?? `${item.name} ${item.quantity} ${item.unit}`.trim()
              }
              placeholder="Scrivi…"
              multiline
              onChangeText={(text) => {
                updateField(index, "raw", text); // ⭐ memorizziamo il testo grezzo
              }}
              onBlur={() => {
                const text = item.raw ?? "";
                const parts = text.split(" ").filter(Boolean);

                updateField(index, "name", parts[0] || "");
                updateField(index, "quantity", parts[1] || "");
                updateField(index, "unit", parts.slice(2).join(" ") || "");
                updateField(index, "raw", undefined);

                addOrUpdateItem(index);
              }}
            />
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

export default function ShoppingScreen() {
  const {
    shoppingList: contextShoppingList,
    clearShoppingList,
    setShoppingList,
  } = useRecipeContext();

  const [items, setItems] = useState<ShoppingItem[]>([]);

  const flatListRef = useRef<FlatList<ShoppingItem>>(null);

  // ⭐ updateField universale
  const updateField = (
    index: number,
    field: keyof ShoppingItem,
    value: any,
  ) => {
    setItems((prev) => {
      const arr = [...prev];
      arr[index] = { ...arr[index], [field]: value };
      return arr;
    });
  };

  // ⭐ sincronizza 1:1 con il context
  useEffect(() => {
    setItems([
      ...contextShoppingList.map((i) => ({
        ...i,
        isNew: false,
      })),
      {
        id: `new-${Date.now()}`,
        name: "",
        quantity: "",
        unit: "",
        checked: false,
        isNew: true,
      },
    ]);
  }, [contextShoppingList]);

  const addOrUpdateItem = (index: number) => {
    const item = items[index];
    const normalized = item.name.trim().toLowerCase();

    if (item.isNew && !normalized) return;

    // ⭐ deduplica SOLO per ingredienti scritti manualmente
    if (normalized) {
      const dupIndex = items.findIndex(
        (it, i) =>
          i !== index &&
          !it.isNew &&
          it.name.trim().toLowerCase() === normalized,
      );

      if (dupIndex !== -1) {
        Alert.alert("Già presente", "Questo ingrediente è già nella lista.");
        flatListRef.current?.scrollToIndex({ index: dupIndex, animated: true });
        return;
      }
    }

    setItems((prev) => {
      const arr = [...prev];

      if (item.isNew) {
        arr[index] = {
          ...item,
          id: `item-${Date.now()}`,
          isNew: false,
        };

        arr.push({
          id: `new-${Date.now()}`,
          name: "",
          quantity: "",
          unit: "",
          checked: false,
          isNew: true,
        });
      }

      setShoppingList(arr.filter((i) => !i.isNew));
      return arr;
    });
  };

  const toggleCheck = (id: string) => {
    setItems((prev) => {
      const arr = prev.map((i) =>
        i.id === id ? { ...i, checked: !i.checked } : i,
      );
      setShoppingList(arr.filter((i) => !i.isNew));
      return arr;
    });
  };

  const deleteItem = (id: string) => {
    setItems((prev) => {
      let arr = prev.filter((i) => i.id !== id);

      if (!arr.some((i) => i.isNew)) {
        arr.push({
          id: `new-${Date.now()}`,
          name: "",
          quantity: "",
          unit: "",
          checked: false,
          isNew: true,
        });
      }

      setShoppingList(arr.filter((i) => !i.isNew));
      return arr;
    });
  };

  const clearAll = () => {
    Alert.alert("Svuota lista", "Vuoi eliminare tutto?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Svuota",
        style: "destructive",
        onPress: () => {
          setItems([
            {
              id: `new-${Date.now()}`,
              name: "",
              quantity: "",
              unit: "",
              checked: false,
              isNew: true,
            },
          ]);
          clearShoppingList();
          setShoppingList([]);
        },
      },
    ]);
  };

  const shareList = async () => {
    const active = items.filter((i) => !i.isNew && i.name.trim());
    if (active.length === 0) return;

    const text = active
      .map((i) => `${i.checked ? "✅" : "⬜"} ${i.name}`)
      .join("\n");

    try {
      await Share.share({ message: `📋 Lista della Spesa\n\n${text}` });
    } catch {}
  };

  return (
    <ImageBackground
      source={require("../../assets/images/sfondo.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text bold style={styles.title}>
            Lista della Spesa
          </Text>
        </View>

        <View style={styles.noteWrapper}>
          <FlatList
            ref={flatListRef}
            data={items}
            keyExtractor={(i) => i.id}
            renderItem={({ item, index }) => (
              <ShoppingRow
                item={item}
                index={index}
                toggleCheck={toggleCheck}
                deleteItem={deleteItem}
                updateField={updateField}
                addOrUpdateItem={addOrUpdateItem}
              />
            )}
          />
        </View>
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "white",
            paddingVertical: 12,
            paddingBottom: 10,
            paddingHorizontal: 16,
            borderTopWidth: 1,
            borderColor: "#ddd",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 50,
          }}
        >
          <TouchableOpacity
            onPress={shareList}
            style={{ alignItems: "center" }}
          >
            <Ionicons
              name="share-social-outline"
              size={18}
              color={COLORS.textLight}
            />
            <Text style={{ color: COLORS.textLight, fontSize: 10 }}>
              Condividi lista
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={clearAll} style={{ alignItems: "center" }}>
            <Ionicons name="trash-outline" size={18} color="#cb0047" />
            <Text style={{ color: "#cb0047", fontSize: 10 }}>Svuota lista</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1 },
  header: { paddingVertical: 20 },
  title: { fontSize: 30, textAlign: "center", marginTop: 50, marginBottom: 30 },
  noteWrapper: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: 30,
    padding: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 15,
  },

  checkedText: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },

  floatingButton: {
    position: "absolute",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 50,
  },
});
