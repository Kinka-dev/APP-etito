// app/(tabs)/shopping.tsx
import Input from "@/components/Input";
import Text from "@/components/Text";
import { useRecipeContext } from "@/context/RecipeContext";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeInRight,
  FadeOutLeft,
  FadeOutRight,
  runOnJS,
  SharedValue,
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

type UpdateFieldFn = (
  index: number,
  field: keyof ShoppingItem,
  value: any,
) => void;

// -----------------------------------------------------
// RIGA DELLA LISTA
// -----------------------------------------------------
function ShoppingRow({
  item,
  index,
  toggleCheck,
  deleteItem,
  updateField,
  addOrUpdateItem,
  pencilX,
  pencilY,
  pencilRotation,
  startEraseAnimation,
  startCheckAnimation,
  startUncheckAnimation,
  rowRefs,
  textRefs,
}: {
  item: ShoppingItem;
  index: number;
  toggleCheck: (id: string) => void;
  deleteItem: (id: string) => void;
  updateField: UpdateFieldFn;
  addOrUpdateItem: (index: number) => void;
  pencilX: SharedValue<number>;
  pencilY: SharedValue<number>;
  pencilRotation: SharedValue<number>;
  startEraseAnimation: (index: number) => void;
  startCheckAnimation: (index: number) => void;
  startUncheckAnimation: (index: number) => void;
  rowRefs: React.MutableRefObject<Record<number, any>>;
  textRefs: React.MutableRefObject<Record<number, any>>;
}) {
  const translateX = useSharedValue(0);
  const rowOpacity = useSharedValue(1);

  const THRESHOLD_RIGHT = 20;
  const THRESHOLD_LEFT = -20;

  const fullText =
    item.raw ?? `${item.name} ${item.quantity} ${item.unit}`.trim();

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(0) // evita attivazione immediata
    .activeOffsetX([-20, 20]) // richiede movimento orizzontale reale
    .failOffsetY([-10, 10]) // evita conflitti verticali
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd(() => {
      if (translateX.value > THRESHOLD_RIGHT) {
        runOnJS(startEraseAnimation)(index);
        rowOpacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(deleteItem)(item.id);
        });
      }

      if (translateX.value < THRESHOLD_LEFT) {
        runOnJS(startEraseAnimation)(index);
        rowOpacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(deleteItem)(item.id);
        });
      }

      translateX.value = withTiming(0, { duration: 120 });
    });

  return (
    <Animated.View
      exiting={FadeOutRight.duration(200)}
      style={{ marginBottom: 10 }}
    >
      <GestureDetector gesture={panGesture}>
        <Animated.View
          ref={(el: View | null) => {
            rowRefs.current[index] = el;
          }}
          style={[styles.row]}
        >
          <TouchableOpacity
            onPress={() => {
              if (item.checked) {
                startUncheckAnimation(index);
              } else {
                startCheckAnimation(index);
              }
            }}
            style={{
              width: 28,
              marginRight: 8,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Animated.View
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: "#3a8654",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "white",
                marginBottom: 5,
              }}
            >
              {item.checked && (
                <Ionicons name="checkmark" size={20} color="#3a8654" />
              )}
            </Animated.View>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Input
              style={[
                {
                  flex: 1,
                  fontSize: 16,
                  paddingVertical: 4,
                  marginTop: 12,
                  borderColor: "white",
                  textAlignVertical: "center",
                },
                item.checked && styles.checkedText,
              ]}
              value={fullText}
              placeholder="Scrivi…"
              multiline
              onChangeText={(text) => updateField(index, "raw", text)}
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

            {/* Testo invisibile per misurare la larghezza reale */}
            <View
              ref={(el: View | null) => {
                textRefs.current[index] = el;
              }}
              style={{
                position: "absolute",
                opacity: 0,
                pointerEvents: "none",
              }}
            >
              <Text style={{ fontSize: 16 }}>{fullText}</Text>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

// -----------------------------------------------------
// SCREEN PRINCIPALE
// -----------------------------------------------------
export default function ShoppingScreen() {
  const {
    shoppingList: contextShoppingList,
    clearShoppingList,
    setShoppingList,
  } = useRecipeContext();
  const flatListRef = useRef<FlatList<ShoppingItem>>(null);

  const pencilX = useSharedValue(0);
  const pencilY = useSharedValue(0);
  const pencilRotation = useSharedValue(0);

  const PENCIL_WIDTH = 150;
  const PUNTA_OFFSET = 12;

  const [topMenuOpen, setTopMenuOpen] = useState(false);

  const [gommaOffset, setGommaOffset] = useState(140);
  const GOMMA_OFFSET = gommaOffset;

  const rowRefs = useRef<Record<number, any>>({});
  const textRefs = useRef<Record<number, any>>({});

  const [items, setItems] = useState<ShoppingItem[]>([]);

  const updateField: UpdateFieldFn = (index, field, value) => {
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

  // -----------------------------------------------------
  // ⭐ ANIMAZIONE MATITA (funziona davvero)
  // -----------------------------------------------------
  const startEraseAnimation = (index: number) => {
    const row = rowRefs.current[index];
    const text = textRefs.current[index];

    if (!row || !text) return;

    row.measureInWindow(
      (pageX: number, pageY: number, width: number, height: number) => {
        text.measure(
          (tx: number, ty: number, textWidth: number, textHeight: number) => {
            const ROW_PADDING_LEFT = -30;
            const PENCIL_VERTICAL_OFFSET = -40;
            const centerY = pageY + height / 2 - 10 + PENCIL_VERTICAL_OFFSET;

            pencilRotation.value = withTiming(270, { duration: 150 });

            pencilX.value = withTiming(
              pageX + ROW_PADDING_LEFT - GOMMA_OFFSET,
              { duration: 150 },
            );
            pencilY.value = withTiming(centerY, { duration: 150 });

            const steps = 6;
            const amplitude = 12;
            const segment = textWidth / steps;

            let delay = 150;

            for (let i = 0; i <= steps; i++) {
              const x = pageX + ROW_PADDING_LEFT + segment * i - GOMMA_OFFSET;

              const y = centerY + (i % 2 === 0 ? -amplitude : amplitude);

              setTimeout(() => {
                pencilX.value = withTiming(x, { duration: 80 });
                pencilY.value = withTiming(y, { duration: 80 });
              }, delay);

              delay += 80;
            }

            setTimeout(() => {
              pencilRotation.value = withTiming(0, { duration: 200 });
              pencilX.value = withTiming(0, { duration: 200 });
              pencilY.value = withTiming(0, { duration: 200 });
            }, delay + 300);
          },
        );
      },
    );
  };

  const startCheckAnimation = (index: number) => {
    const row = rowRefs.current[index];

    if (!row) return;

    row.measureInWindow(
      (pageX: number, pageY: number, width: number, height: number) => {
        const ROW_PADDING_LEFT = -75;
        const PENCIL_VERTICAL_OFFSET = -75;
        const checkboxX = pageX + ROW_PADDING_LEFT;
        const checkboxY = pageY + height / 2 - 10 + PENCIL_VERTICAL_OFFSET;

        pencilRotation.value = withTiming(45, { duration: 120 });
        pencilX.value = withTiming(checkboxX, { duration: 120 });
        pencilY.value = withTiming(checkboxY, { duration: 120 });

        setTimeout(() => {
          pencilX.value = withTiming(checkboxX + 8, { duration: 120 });
          pencilY.value = withTiming(checkboxY + 8, { duration: 120 });
        }, 120);

        setTimeout(() => {
          pencilX.value = withTiming(checkboxX + 16, { duration: 120 });
          pencilY.value = withTiming(checkboxY - 2, { duration: 120 });
        }, 240);

        setTimeout(() => {
          runOnJS(toggleCheck)(items[index].id);
        }, 400); // DOPO che la V è stata disegnata

        setTimeout(() => {
          pencilRotation.value = withTiming(0, { duration: 200 });
          pencilX.value = withTiming(0, { duration: 200 });
          pencilY.value = withTiming(0, { duration: 200 });
        }, 400);
      },
    );
  };

  const startUncheckAnimation = (index: number) => {
    const row = rowRefs.current[index];

    if (!row) return;

    row.measureInWindow(
      (pageX: number, pageY: number, width: number, height: number) => {
        const ROW_PADDING_LEFT = -75;
        const PENCIL_VERTICAL_OFFSET = -75;

        const checkboxX = pageX + ROW_PADDING_LEFT;
        const checkboxY = pageY + height / 2 - 10 + PENCIL_VERTICAL_OFFSET;

        // 1) Posiziona la matita all’inizio della V (in alto a sinistra)
        pencilRotation.value = withTiming(220, { duration: 120 });
        pencilX.value = withTiming(checkboxX, { duration: 120 });
        pencilY.value = withTiming(checkboxY - 2, { duration: 120 });

        // 2) Primo tratto: ↗️ (salita)
        setTimeout(() => {
          pencilX.value = withTiming(checkboxX + 8, { duration: 120 });
          pencilY.value = withTiming(checkboxY - 12, { duration: 120 });
        }, 120);

        // 3) Secondo tratto: ↘️ (discesa)
        setTimeout(() => {
          pencilX.value = withTiming(checkboxX + 16, { duration: 120 });
          pencilY.value = withTiming(checkboxY + 2, { duration: 120 });
        }, 240);

        // 4) Ora togliamo il check
        setTimeout(() => {
          runOnJS(toggleCheck)(items[index].id);
        }, 360);

        // 5) Ritorno della matita
        setTimeout(() => {
          pencilRotation.value = withTiming(0, { duration: 200 });
          pencilX.value = withTiming(0, { duration: 200 });
          pencilY.value = withTiming(0, { duration: 200 });
        }, 500);
      },
    );
  };

  // -----------------------------------------------------
  // LOGICA LISTA
  // -----------------------------------------------------
  const addOrUpdateItem = (index: number) => {
    const item = items[index];
    const normalized = item.name.trim().toLowerCase();

    if (item.isNew && !normalized) return;

    setItems((prev) => {
      const arr = [...prev];

      // aggiorna l’item senza cambiare id
      arr[index] = { ...item, isNew: false };

      // aggiungi un nuovo item SOLO se stai modificando l’ultimo
      if (index === prev.length - 1) {
        arr.push({
          id: `new-${Date.now()}`,
          name: "",
          quantity: "",
          unit: "",
          checked: false,
          isNew: true,
        });
      }

      return arr;
    });
  };

  const toggleCheck = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
    );
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

  // -----------------------------------------------------
  // RENDER
  // -----------------------------------------------------
  return (
    <ImageBackground
      source={require("../../assets/images/notes.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20}
      >
        <SafeAreaView style={styles.container}>
          <View
            style={{
              position: "absolute",
              top: 65,
              right: 25,
              zIndex: 999,
            }}
          >
            <TouchableOpacity
              onPress={() => setTopMenuOpen((prev) => !prev)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons
                name={topMenuOpen ? "close" : "ellipsis-horizontal"}
                size={24}
                color="#333"
              />
            </TouchableOpacity>
          </View>
          {topMenuOpen && (
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setTopMenuOpen(false)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "transparent",
                zIndex: 997,
              }}
            />
          )}
          {topMenuOpen && (
            <Animated.View
              entering={FadeInRight.duration(150)}
              exiting={FadeOutLeft.duration(150)}
              style={{
                position: "absolute",
                top: 55,
                right: 20,
                backgroundColor: "white",
                borderRadius: 12,
                paddingVertical: 4,
                width: 320,
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 6,
                zIndex: 998,
                flexDirection: "row",
              }}
            >
              {/* ACTION 1 */}
              <TouchableOpacity
                onPress={() => {
                  setTopMenuOpen(false);
                  shareList(); // tua funzione
                }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="share-outline"
                  size={18}
                  color="#333"
                  style={{ marginRight: 8 }}
                />
                <Text style={{ fontSize: 15 }}>Condividi lista</Text>
              </TouchableOpacity>

              {/* DIVIDER */}
              <View
                style={{
                  width: 1,
                  backgroundColor: "#eee",
                  marginVertical: 4,
                }}
              />

              {/* ACTION 2 */}
              <TouchableOpacity
                onPress={() => {
                  setTopMenuOpen(false);
                  clearAll(); // tua funzione
                }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color="#d33"
                  style={{ marginRight: 8 }}
                />
                <Text style={{ fontSize: 15, color: "#d33" }}>
                  Svuota lista
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <View style={styles.header}>
            <Text bold style={styles.title}>
              Lista della Spesa
            </Text>
          </View>

          {/* Matita sotto al titolo */}
          <Animated.View
            style={[
              styles.pencil,
              useAnimatedStyle(() => ({
                transform: [
                  { translateX: pencilX.value },
                  { translateY: pencilY.value },
                  { rotateZ: `${pencilRotation.value}deg` },
                ],
              })),
            ]}
          >
            <Image
              source={require("../../assets/images/pencil.png")}
              style={{ width: 150, height: 20 }}
              resizeMode="contain"
            />
          </Animated.View>

          <View
            style={{
              position: "absolute",
              opacity: 0,
              pointerEvents: "none",
            }}
          >
            <View
              onLayout={(e) => {
                const gommaWidth = e.nativeEvent.layout.width;
                setGommaOffset(150 - gommaWidth);
              }}
              style={{
                width: 150,
                height: 20,
                overflow: "hidden",
                flexDirection: "row",
              }}
            >
              <Image
                source={require("../../assets/images/pencil.png")}
                style={{
                  width: 150,
                  height: 20,
                  transform: [{ translateX: -130 }],
                }}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.noteWrapper}>
            <FlatList
              ref={flatListRef}
              data={items}
              keyExtractor={(i) => i.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 120 }}
              renderItem={({ item, index }) => (
                <ShoppingRow
                  item={item}
                  index={index}
                  toggleCheck={toggleCheck}
                  deleteItem={deleteItem}
                  updateField={updateField}
                  addOrUpdateItem={addOrUpdateItem}
                  pencilX={pencilX}
                  pencilY={pencilY}
                  pencilRotation={pencilRotation}
                  startEraseAnimation={startEraseAnimation}
                  startCheckAnimation={startCheckAnimation}
                  startUncheckAnimation={startUncheckAnimation}
                  rowRefs={rowRefs}
                  textRefs={textRefs}
                />
              )}
            />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

// -----------------------------------------------------
// STILI
// -----------------------------------------------------
const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1 },
  header: { paddingVertical: 25 },
  title: {
    fontSize: 30,
    textAlign: "center",
    marginTop: 50,
    marginBottom: 50,
    lineHeight: 30,
  },
  noteWrapper: {
    flex: 1,
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  checkedText: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  pencil: {
    position: "absolute",
    top: 170,
    left: 100,
    zIndex: 999,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingBottom: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 999,
  },
});
