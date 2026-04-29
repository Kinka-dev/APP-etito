// app/add.tsx
import CategoryPickerTabs from "@/components/CategoryPickerTabs";
import Input from "@/components/Input";
import { OCRButton } from "@/components/OCRButton";
import Text from "@/components/Text";
import { CATEGORIES } from "@/constants/categories";
import { COLORS } from "@/constants/colors";
import { useRecipeContext } from "@/context/RecipeContext";
import { Category, Recipe } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Image,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeOutUp,
  Layout,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

/* ============================================================
   TIPI — IDENTICI A edit/[id].tsx
   ============================================================ */

interface IngredientFlat {
  type: "ingredient";
  id: string;
  name: string;
  quantity: string;
  unit: string;
  groupId: string | null;
}

interface GroupFlat {
  type: "group";
  id: string;
  title: string;
  collapsed: boolean;
}

type FlatItem = IngredientFlat | GroupFlat;

interface StepForm {
  description: string;
  title: string;
  imageUri?: string | null;
  textImageUri?: string | null;
  mode?: "text" | "ocr" | "photo";
}

type StepListItem = StepForm | { isAddButton: true };

/* ============================================================
   SCREEN
   ============================================================ */

export default function AddRecipeScreen() {
  const { addRecipe } = useRecipeContext();

  /* ============================================================
     STATE BASE
     ============================================================ */
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("altro");
  const [prepTime, setPrepTime] = useState("");
  const [servings, setServings] = useState("");
  const [tags, setTags] = useState("");
  const [mainImageUri, setMainImageUri] = useState<string | null>(null);

  const [ingredientsMode, setIngredientsMode] = useState<
    "text" | "ocr" | "photo"
  >("text");

  const [ingredientsOcrImage, setIngredientsOcrImage] = useState<string | null>(
    null,
  );
  const [ingredientsPhoto, setIngredientsPhoto] = useState<string | null>(null);

  const [groupingMode, setGroupingMode] = useState(false);
  const [selectedForGroup, setSelectedForGroup] = useState<string[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState("");

  const [notesMode, setNotesMode] = useState<"text" | "ocr" | "photo">("text");
  const [notesText, setNotesText] = useState("");
  const [notesImage, setNotesImage] = useState<string | null>(null);

  /* ============================================================
     STATE INGREDIENTI — LISTA PIATTA
     ============================================================ */
  const [items, setItems] = useState<FlatItem[]>([]);
  const existingGroups = items.filter((i) => i.type === "group") as GroupFlat[];

  /* ============================================================
     STEP
     ============================================================ */
  const [steps, setSteps] = useState<StepForm[]>([
    { description: "", title: "", imageUri: undefined },
  ]);

  /* ============================================================
     IMMAGINI
     ============================================================ */
  useEffect(() => {
    if (items.length === 0) {
      setItems([
        {
          type: "ingredient",
          id: "ing_" + Date.now().toString(36),
          name: "",
          quantity: "",
          unit: "",
          groupId: null,
        },
      ]);
    }
  }, []);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permesso galleria negato");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (result.canceled) return null;

    return result.assets[0].uri;
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Permesso fotocamera negato");
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
    });

    if (result.canceled) return null;

    return result.assets[0].uri;
  }

  const chooseImageSource = (onPick: (uri: string) => void) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Annulla", "Scatta foto", "Scegli dalla galleria"],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            // Fotocamera
            const result = await ImagePicker.launchCameraAsync({
              quality: 0.9,
            });
            if (!result.canceled) onPick(result.assets[0].uri);
          }

          if (buttonIndex === 2) {
            // Galleria
            const result = await ImagePicker.launchImageLibraryAsync({
              quality: 0.9,
            });
            if (!result.canceled) onPick(result.assets[0].uri);
          }
        },
      );
    } else {
      // ANDROID → piccolo menu personalizzato
      Alert.alert(
        "Scegli immagine",
        "",
        [
          {
            text: "Scatta foto",
            onPress: async () => {
              const result = await ImagePicker.launchCameraAsync({
                quality: 0.9,
              });
              if (!result.canceled) onPick(result.assets[0].uri);
            },
          },
          {
            text: "Scegli dalla galleria",
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                quality: 0.9,
              });
              if (!result.canceled) onPick(result.assets[0].uri);
            },
          },
          { text: "Annulla", style: "cancel" },
        ],
        { cancelable: true },
      );
    }
  };

  /* ============================================================
     FUNZIONI INGREDIENTI — IDENTICHE A edit/[id].tsx
     ============================================================ */

  const addIngredient = () => {
    setItems((prev) => [
      ...prev,
      {
        type: "ingredient",
        id: `ing-${Date.now()}`,
        name: "",
        quantity: "",
        unit: "",
        groupId: null,
      },
    ]);
  };

  const addIngredientToGroup = (groupId: string) => {
    setItems((prev) => {
      const index = prev.findIndex(
        (i) => i.type === "group" && i.id === groupId,
      );
      if (index === -1) return prev;

      const newIngredient: IngredientFlat = {
        type: "ingredient",
        id: `ing-${Date.now()}`,
        name: "",
        quantity: "",
        unit: "",
        groupId,
      };

      return [
        ...prev.slice(0, index + 1),
        newIngredient,
        ...prev.slice(index + 1),
      ];
    });
  };

  const removeIngredient = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const removeGroup = (groupId: string) => {
    setItems((prev) =>
      prev.filter(
        (i) =>
          !(
            (i.type === "group" && i.id === groupId) ||
            (i.type === "ingredient" && i.groupId === groupId)
          ),
      ),
    );
  };

  const toggleGroup = (groupId: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.type === "group" && i.id === groupId
          ? { ...i, collapsed: !i.collapsed }
          : i,
      ),
    );
  };

  const moveItemUp = (index: number) => {
    if (index === 0) return;
    setItems((prev) => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  };

  const moveItemDown = (index: number) => {
    setItems((prev) => {
      if (index === prev.length - 1) return prev;
      const arr = [...prev];
      [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
      return arr;
    });
  };

  const toggleIngredientSelection = (id: string) => {
    setSelectedForGroup((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const createGroupFromSelection = () => {
    if (selectedForGroup.length === 0) return;

    const groupId = "group-" + Date.now();

    const newGroup: GroupFlat = {
      type: "group",
      id: groupId,
      title: newGroupTitle || "Nuovo gruppo",
      collapsed: false,
    };

    setItems((prev) => {
      const updated = [];

      // 1. aggiungi il gruppo in cima (o dove preferisci)
      updated.push(newGroup);

      // 2. ingredienti selezionati → assegnati al gruppo
      selectedForGroup.forEach((id) => {
        const ing = prev.find((i) => i.type === "ingredient" && i.id === id);
        if (ing) {
          updated.push({
            ...ing,
            groupId,
          });
        }
      });

      // 3. aggiungi tutti gli altri item NON selezionati
      prev.forEach((i) => {
        if (i.type === "ingredient" && selectedForGroup.includes(i.id)) return;
        if (i.type === "group") return; // i gruppi vecchi rimangono dopo
        updated.push(i);
      });

      // 4. aggiungi i gruppi esistenti (se vuoi mantenerli)
      prev.forEach((i) => {
        if (i.type === "group") updated.push(i);
      });

      return updated;
    });

    // reset
    setGroupingMode(false);
    setSelectedForGroup([]);
    setNewGroupTitle("");
    setShowGroupModal(false);
  };

  /* ============================================================
   STEP — FUNZIONI IDENTICHE A edit/[id].tsx
   ============================================================ */

  const updateStepTitle = (index: number, text: string) => {
    setSteps((prev) => {
      const updated = [...prev];
      updated[index].title = text;
      return updated;
    });
  };

  const updateStepDescription = (index: number, text: string) => {
    setSteps((prev) => {
      const updated = [...prev];
      updated[index].description = text;
      return updated;
    });
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const moveStepUp = (index: number) => {
    if (index === 0) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSteps((prev) => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  };

  const moveStepDown = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSteps((prev) => {
      if (index === prev.length - 1) return prev;
      const arr = [...prev];
      [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
      return arr;
    });
  };

  /* ============================================================
   UPDATE GROUP TITLE — IDENTICO A edit/[id].tsx
   ============================================================ */
  const updateGroupTitle = (groupId: string, text: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.type === "group" && i.id === groupId ? { ...i, title: text } : i,
      ),
    );
  };

  /* ============================================================
   UPDATE INGREDIENT — IDENTICO A edit/[id].tsx
   ============================================================ */
  const updateIngredient = (
    ingredientId: string,
    field: "name" | "quantity" | "unit",
    value: string,
  ) => {
    setItems((prev) =>
      prev.map((i) =>
        i.type === "ingredient" && i.id === ingredientId
          ? { ...i, [field]: value }
          : i,
      ),
    );
  };

  // ⭐ PARSER DI INGREDIENTI (quantità + unità + nome)
  function parseSpokenText(text: string) {
    const regex =
      /^(\d+(?:[.,]\d+)?)\s*(g|gr|grammi|kg|ml|l|litri|tsp|tbsp|cup|pz|pezzi)?\s*(.*)$/i;

    const match = text.trim().match(regex);

    if (!match) {
      return {
        quantity: "",
        unit: "",
        product: text.trim(),
      };
    }

    return {
      quantity: match[1] || "",
      unit: match[2] || "",
      product: match[3] || "",
    };
  }

  async function recognizeTextFromImage(uri: string): Promise<string> {
    // try {
    //   const result = await scanOCR(uri);

    //   if (!result?.blocks?.length) return "";

    //   return result.blocks
    //     .map((b: { text: string }) => b.text)
    //     .join("\n");
    // } catch (e) {
    //   console.log("Errore OCR:", e);
    return "";
    // }
  }

  // ⭐ OCR GENERICO PER QUALSIASI FOTO
  async function extractTextFromImage(uri: string): Promise<string> {
    try {
      const result = await recognizeTextFromImage(uri); // la tua funzione OCR
      return result || "";
    } catch (e) {
      console.log("Errore OCR:", e);
      return "";
    }
  }

  // ⭐ PARSER TESTO → INGREDIENTI
  function parseIngredientsFromText(text: string) {
    if (!text.trim()) return;

    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const parsed: IngredientFlat[] = [];

    for (const line of lines) {
      const { quantity, unit, product } = parseSpokenText(line); // tua funzione già esistente

      parsed.push({
        id: "ing-" + Math.random().toString(36).slice(2),
        type: "ingredient",
        name: product || line,
        quantity: quantity || "",
        unit: unit || "",
        groupId: null,
      });
    }

    // ⭐ aggiungi gli ingredienti OCR alla lista
    setItems((prev) => [...prev, ...parsed]);
  }

  const handleOCRIngredients = async () => {
    const uri = await pickImage(); // o la tua funzione
    if (!uri) return;

    setIngredientsOcrImage(uri);

    const text = await extractTextFromImage(uri);
    parseIngredientsFromText(text);
  };

  const handlePhotoIngredients = async () => {
    const uri = await takePhoto();
    if (!uri) return;

    setIngredientsPhoto(uri);
  };

  const handleOCRSteps = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;

    setSteps((prev) => {
      const copy = [...prev];
      copy[index].textImageUri = uri; // ← FOTO TESTO OCR
      return copy;
    });

    // OCR lo aggiungeremo dopo
  };

  const handlePhotoSteps = async (index: number) => {
    const uri = await takePhoto();
    if (!uri) return;

    setSteps((prev) => {
      const copy = [...prev];
      copy[index].textImageUri = uri; // ✔ foto del testo
      return copy;
    });
  };

  const handlePhotoNotes = async () => {
    const uri = await takePhoto();
    if (!uri) return;
    setNotesImage(uri);
  };

  const handleOCRNotes = async () => {
    const uri = await takePhoto();
    if (!uri) return;

    async function runOCR(uri: string): Promise<string> {
      // TODO: integrare OCR reale
      return "Testo riconosciuto (placeholder)";
    }

    const text = await runOCR(uri);
    setNotesText(text);
  };

  const toggleStepMode = (index: number, mode: "ocr" | "photo") => {
    setSteps((prev) => {
      const copy = [...prev];

      // se clicco lo stesso pulsante → chiudi
      if (copy[index].mode === mode) {
        copy[index].mode = "text";
      } else {
        copy[index].mode = mode;
      }

      return copy;
    });
  };

  const startDictation = (
    onResult: (text: string) => void,
    title: string = "Dettatura vocale",
  ) => {
    Alert.prompt(
      title,
      "Parla chiaramente. Il sistema trascriverà quello che dici.",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Conferma",
          onPress: (spokenText?: string) => {
            if (spokenText && spokenText.trim()) {
              onResult(spokenText.trim());
            }
          },
        },
      ],
    );
  };

  /* ============================================================
     SALVA
     ============================================================ */

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Errore", "Il titolo è obbligatorio");
      return;
    }

    // ricostruisci struttura finale
    const groups: {
      id: string;
      title: string;
      items: { id: string; name: string; quantity: string; unit: string }[];
    }[] = [];

    const free: { id: string; name: string; quantity: string; unit: string }[] =
      [];

    const groupOrder = items.filter((i) => i.type === "group") as GroupFlat[];

    groupOrder.forEach((g) => {
      const groupItems = items.filter(
        (i) =>
          i.type === "ingredient" &&
          (i as IngredientFlat).groupId === g.id &&
          (i as IngredientFlat).name.trim() !== "",
      ) as IngredientFlat[];

      groups.push({
        id: g.id,
        title: g.title,
        items: groupItems.map((ing) => ({
          id: ing.id,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
        })),
      });
    });

    items.forEach((i) => {
      if (
        i.type === "ingredient" &&
        i.groupId === null &&
        i.name.trim() !== ""
      ) {
        free.push({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
        });
      }
    });

    const finalIngredients =
      free.length > 0
        ? [
            {
              id: "ungrouped",
              title: "",
              items: free,
            },
            ...groups,
          ]
        : groups;

    const cleanedSteps = steps
      .filter(
        (s) =>
          s.description.trim() !== "" ||
          s.title.trim() !== "" ||
          s.imageUri ||
          s.textImageUri,
      )
      .map((s: StepForm, index: number) => ({
        id: `step-${Date.now()}-${index}`,
        title: s.title,
        description: s.description,
        imageUri: s.imageUri,
        textImageUri: s.textImageUri, // ⭐ ORA VIENE SALVATA
        mode: s.mode, // ⭐ AGGIUNTO
        checked: false,
      }));

    // ⭐ CREA UNA RICETTA COMPLETA
    const newRecipe: Recipe = {
      id:
        "rec_" + Date.now().toString(36) + Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
      isFavorite: false,

      title: title.trim(),
      category,
      prepTime: parseInt(prepTime) || 0,
      servings: parseInt(servings) || 1,
      imageUri: mainImageUri || undefined,

      tags: tags.trim()
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],

      ingredients: finalIngredients,

      // ⭐ steps completi con mode e textImageUri
      steps: cleanedSteps,

      // ⭐ note con testo / OCR / foto
      notes: {
        text: notesText.trim() || undefined,
        image: notesImage || undefined,
        mode: notesMode || "text",
      },

      // ⭐ NUOVI CAMPI INGREDIENTI
      ingredientsMode,
      ingredientsOcrImage,
      ingredientsPhoto,
    };

    // ⭐ SALVA LA RICETTA COMPLETA
    addRecipe(newRecipe);

    Alert.alert("Successo", "Ricetta salvata correttamente!");
    router.back();
  };

  /* ============================================================
     RENDER — UI COMPLETA
     ============================================================ */

  const visibleItems = items.filter((item) => {
    if (item.type === "group") return true;

    const existingGroups = items.filter(
      (i) => i.type === "group",
    ) as GroupFlat[];

    const parent = items.find(
      (g) => g.type === "group" && g.id === item.groupId,
    );

    // ingredienti senza gruppo → sempre visibili
    if (!parent) return true;

    // se il gruppo è collassato → nascondi ingredienti
    return parent.type === "group" && !parent.collapsed;
  });

  const moveSelectionToExistingGroup = (groupId: string) => {
    setItems((prev) => {
      return prev.map((item) => {
        if (item.type === "ingredient" && selectedForGroup.includes(item.id)) {
          return { ...item, groupId };
        }
        return item;
      });
    });

    // reset
    setGroupingMode(false);
    setSelectedForGroup([]);
  };

  /* ============================================================
     RENDER — UI COMPLETA
     ============================================================ */

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/new.png")}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text bold style={styles.title}>
            Nuova Ricetta
          </Text>
        </View>
        {/* FOTO PRINCIPALE */}
        <TouchableOpacity
          onPress={() => chooseImageSource((uri) => setMainImageUri(uri))}
        >
          {mainImageUri ? (
            <Image source={{ uri: mainImageUri }} style={styles.headerImage} />
          ) : (
            <View style={styles.headerImage}>
              <View style={styles.headerPlaceholder}>
                <Ionicons
                  name="image-outline"
                  size={50}
                  color={COLORS.primary}
                />
                <Text style={styles.headerPlaceholderText}>
                  Tocca per aggiungere immagine
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* INFO BASE */}
        <View style={styles.card}>
          <Text variant="title" style={styles.sectionTitle}>
            Informazioni base
          </Text>
          <View style={styles.separator} />

          <Input
            label="Titolo"
            value={title}
            onChangeText={setTitle}
            placeholder="Nome della ricetta"
          />

          <Text style={styles.inputLabel}>Categoria</Text>

          <CategoryPickerTabs
            value={category}
            options={CATEGORIES}
            onChange={setCategory}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Input
                label="Tempo (min)"
                value={prepTime}
                onChangeText={setPrepTime}
                keyboardType="default"
              />
            </View>

            <View style={styles.half}>
              <Input
                label="Porzioni"
                value={servings}
                onChangeText={setServings}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Input
            label="Tag (separati da virgola)"
            value={tags}
            onChangeText={setTags}
            placeholder="es: veloce, vegetariano"
          />
        </View>

        {/* INGREDIENTI */}

        <View style={[styles.card, { minHeight: 420 }]}>
          <Text variant="title" style={styles.sectionTitle}>
            Ingredienti
          </Text>
          <View style={[styles.separator, { width: 370, marginLeft: -20 }]} />

          {/* SIDE ZONE GLOBALE */}
          <View style={styles.ingredientsSideZone}>
            {/* NUOVO INGREDIENTE */}
            <TouchableOpacity
              onPress={addIngredient}
              style={{ paddingVertical: 6, alignItems: "center" }}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text bold style={{ fontSize: 11, color: COLORS.primary }}>
                Nuovo
              </Text>
            </TouchableOpacity>

            <View style={styles.stepDivider}></View>

            {/* SVUOTA */}
            <TouchableOpacity
              onPress={() => setItems([])}
              style={{ padding: 6, alignItems: "center" }}
            >
              <Ionicons name="trash-outline" size={20} color="#cb0047" />
              <Text bold style={{ fontSize: 11, color: "#cb0047" }}>
                Svuota
              </Text>
            </TouchableOpacity>
            <View style={styles.stepDivider}></View>

            {/* RAGGRUPPA */}
            <TouchableOpacity
              onPress={() => setGroupingMode((prev) => !prev)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 4,
                backgroundColor: groupingMode ? "#e8ddff" : "transparent",
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Ionicons
                name="albums-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text bold style={{ fontSize: 11, color: COLORS.primary }}>
                Raggruppa
              </Text>
            </TouchableOpacity>
            <View style={styles.stepDivider}></View>

            {/* FOTO */}
            <TouchableOpacity
              onPress={() =>
                setIngredientsMode(
                  ingredientsMode === "photo" ? "text" : "photo",
                )
              }
              style={{
                paddingVertical: 6,
                paddingHorizontal: 21,
                backgroundColor:
                  ingredientsMode === "photo" ? "#e8ddff" : "transparent",
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Ionicons
                name="camera-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text bold style={{ fontSize: 11, color: COLORS.primary }}>
                Foto
              </Text>
            </TouchableOpacity>
            <View style={styles.stepDivider}></View>

            {/* OCR */}
            <TouchableOpacity
              onPress={() =>
                setIngredientsMode(ingredientsMode === "ocr" ? "text" : "ocr")
              }
              style={{
                paddingVertical: 6,
                paddingHorizontal: 21,
                backgroundColor:
                  ingredientsMode === "ocr" ? "#e8ddff" : "transparent",
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Ionicons
                name="document-text-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text bold style={{ fontSize: 11, color: COLORS.primary }}>
                OCR
              </Text>
            </TouchableOpacity>
          </View>

          {/* CONTENUTO INGREDIENTI */}

          <ScrollView style={{ paddingRight: 90 }}>
            {items.map((item, index) => {
              /* ============================================================
                 GRUPPO
                ============================================================ */
              if (item.type === "group") {
                const group = item as GroupFlat;

                const groupIngredients = items.filter(
                  (i) =>
                    i.type === "ingredient" &&
                    (i as IngredientFlat).groupId === group.id,
                );

                const recapString = groupIngredients
                  .map((i) => (i as IngredientFlat).name || "—")
                  .join(", ");

                return (
                  <View key={group.id} style={styles.groupRow}>
                    <View style={styles.groupCardUnified}>
                      {/* LAYOUT A DUE COLONNE */}
                      <View style={styles.groupInnerRow}>
                        {/* SIDEBAR INTERNA */}
                        <View style={styles.groupSidebar}>
                          <TouchableOpacity
                            onPress={() => removeGroup(group.id)}
                            style={styles.sideBtn}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={20}
                              color="#cb0047"
                            />
                          </TouchableOpacity>
                          <View
                            style={[styles.stepDivider, { width: 50 }]}
                          ></View>

                          <TouchableOpacity
                            onPress={() => moveItemUp(index)}
                            style={styles.sideBtn}
                          >
                            <Ionicons
                              name="caret-up"
                              size={20}
                              color={COLORS.primary}
                            />
                          </TouchableOpacity>
                          <View
                            style={[styles.stepDivider, { width: 50 }]}
                          ></View>

                          <TouchableOpacity
                            onPress={() => moveItemDown(index)}
                            style={styles.sideBtn}
                          >
                            <Ionicons
                              name="caret-down"
                              size={20}
                              color={COLORS.primary}
                            />
                          </TouchableOpacity>
                          <View
                            style={[styles.stepDivider, { width: 50 }]}
                          ></View>

                          <TouchableOpacity
                            onPress={() => addIngredientToGroup(group.id)}
                            style={styles.sideBtn}
                          >
                            <Ionicons
                              name="add-circle-outline"
                              size={20}
                              color={COLORS.primary}
                            />
                          </TouchableOpacity>
                        </View>

                        {/* DIVIDER */}
                        <View style={styles.verticalDivider} />

                        {/* CONTENUTO GRUPPO */}
                        <View style={styles.groupContent}>
                          <View style={styles.groupFolderTab}>
                            <Input
                              style={styles.groupTitleInputUnified}
                              value={group.title}
                              placeholder="Nome gruppo"
                              onChangeText={(text) =>
                                updateGroupTitle(group.id, text)
                              }
                            />

                            <TouchableOpacity
                              onPress={() => toggleGroup(group.id)}
                            >
                              <Ionicons
                                name={
                                  group.collapsed
                                    ? "chevron-down"
                                    : "chevron-up"
                                }
                                size={20}
                                color={COLORS.primary}
                              />
                            </TouchableOpacity>
                          </View>

                          {/* ⭐ RECAP INGREDIENTI QUANDO COLLASSATO */}

                          {group.collapsed && (
                            <Text style={styles.groupRecap}>
                              {items
                                .filter(
                                  (i) =>
                                    i.type === "ingredient" &&
                                    (i as IngredientFlat).groupId === group.id,
                                )
                                .map((i) => (i as IngredientFlat).name || "—")
                                .join(", ")}
                            </Text>
                          )}

                          {!group.collapsed && (
                            <View style={styles.groupItemsContainer}>
                              {items
                                .filter(
                                  (i) =>
                                    i.type === "ingredient" &&
                                    (i as IngredientFlat).groupId === group.id,
                                )
                                .map((ing) => {
                                  const ingItem = ing as IngredientFlat;

                                  return (
                                    <View
                                      key={ingItem.id}
                                      style={styles.groupIngredientCard}
                                    >
                                      <View
                                        style={styles.groupIngredientHeader}
                                      >
                                        <Input
                                          style={styles.ingGroupName}
                                          value={ingItem.name}
                                          placeholder="Ingrediente"
                                          onChangeText={(t) =>
                                            updateIngredient(
                                              ingItem.id,
                                              "name",
                                              t,
                                            )
                                          }
                                        />

                                        {/* ⭐ X PER ELIMINARE L’INGREDIENTE */}
                                        <TouchableOpacity
                                          onPress={() =>
                                            removeIngredient(ingItem.id)
                                          }
                                          style={
                                            styles.groupIngredientDeleteBtn
                                          }
                                        >
                                          <Ionicons
                                            name="close"
                                            size={18}
                                            color="#cb0047"
                                          />
                                        </TouchableOpacity>
                                      </View>

                                      {/* QUANTITÀ + UNITÀ */}
                                      <View style={styles.ingredientRowBottom}>
                                        <Input
                                          style={styles.ingGroupQty}
                                          value={ingItem.quantity}
                                          placeholder="Qtà"
                                          onChangeText={(t) =>
                                            updateIngredient(
                                              ingItem.id,
                                              "quantity",
                                              t,
                                            )
                                          }
                                        />
                                        <Input
                                          style={styles.ingGroupUnit}
                                          value={ingItem.unit}
                                          placeholder="Un."
                                          onChangeText={(t) =>
                                            updateIngredient(
                                              ingItem.id,
                                              "unit",
                                              t,
                                            )
                                          }
                                        />
                                      </View>

                                      <View
                                        style={[
                                          styles.stepDivider,
                                          { width: 250, marginLeft: -10 },
                                        ]}
                                      ></View>
                                    </View>
                                  );
                                })}
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              }

              /* ============================================================
                 INGREDIENTE LIBERO
                ============================================================ */
              const ing = item as IngredientFlat;
              if (ing.groupId) return null;

              return (
                <View key={ing.id} style={styles.ingredientRow}>
                  <View style={styles.ingredientCard}>
                    <View style={styles.ingredientInnerRow}>
                      {/* SIDEBAR INTERNA */}
                      <View
                        style={[styles.ingredientSidebar, { marginLeft: 4 }]}
                      >
                        <TouchableOpacity
                          onPress={() => removeIngredient(ing.id)}
                          style={styles.sideBtn}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color="#cb0047"
                          />
                        </TouchableOpacity>
                        <View
                          style={[styles.stepDivider, { width: 50 }]}
                        ></View>

                        <TouchableOpacity
                          onPress={() => moveItemUp(index)}
                          style={styles.sideBtn}
                        >
                          <Ionicons
                            name="caret-up"
                            size={20}
                            color={COLORS.primary}
                          />
                        </TouchableOpacity>
                        <View
                          style={[styles.stepDivider, { width: 50 }]}
                        ></View>

                        <TouchableOpacity
                          onPress={() => moveItemDown(index)}
                          style={styles.sideBtn}
                        >
                          <Ionicons
                            name="caret-down"
                            size={20}
                            color={COLORS.primary}
                          />
                        </TouchableOpacity>
                        <View></View>
                      </View>

                      {/* DIVIDER */}
                      <View style={styles.verticalDivider} />

                      {/* CONTENUTO */}
                      <View style={styles.ingredientContent}>
                        <Input
                          style={styles.ingName}
                          value={ing.name}
                          placeholder="Ingrediente"
                          onChangeText={(t) =>
                            updateIngredient(ing.id, "name", t)
                          }
                        />

                        <View style={styles.ingredientRowBottom}>
                          <Input
                            style={styles.ingQty}
                            value={ing.quantity}
                            placeholder="Qtà"
                            onChangeText={(t) =>
                              updateIngredient(ing.id, "quantity", t)
                            }
                          />
                          <Input
                            style={styles.ingUnit}
                            value={ing.unit}
                            placeholder="Un."
                            onChangeText={(t) =>
                              updateIngredient(ing.id, "unit", t)
                            }
                          />
                          {groupingMode && (
                            <TouchableOpacity
                              onPress={() => toggleIngredientSelection(ing.id)}
                              style={[
                                styles.checkbox,
                                selectedForGroup.includes(ing.id)
                                  ? styles.checkboxSelected
                                  : styles.checkboxUnselected,
                              ]}
                            >
                              {selectedForGroup.includes(ing.id) && (
                                <Ionicons
                                  name="checkmark"
                                  size={20}
                                  color={"#ffffff"}
                                />
                              )}
                            </TouchableOpacity>
                          )}
                          <View
                            style={[
                              styles.separator,
                              { marginTop: 30, marginBottom: 20 },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* CREA GRUPPO */}
            {groupingMode && (
              <TouchableOpacity
                onPress={() => setShowGroupModal(true)}
                style={styles.createGroupButton}
              >
                <Text bold style={styles.createGroupButtonText}>
                  Crea gruppo
                </Text>
              </TouchableOpacity>
            )}

            {/* GRUPPI ESISTENTI */}
            {groupingMode && existingGroups.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text
                  variant="small"
                  style={{
                    marginBottom: 10,
                    textAlign: "center",
                  }}
                >
                  oppure
                </Text>
                <Text
                  bold
                  style={{
                    fontSize: 16,
                    marginBottom: 10,
                    color: COLORS.text,
                    textAlign: "center",
                  }}
                >
                  Aggiungi ad un gruppo esistente:
                </Text>

                {existingGroups.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => moveSelectionToExistingGroup(g.id)}
                    style={styles.existingGroupButton}
                  >
                    <Text bold style={{ fontSize: 16, color: COLORS.primary }}>
                      {g.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* FOTO / OCR */}
            {ingredientsMode === "ocr" && (
              <View>
                <View
                  style={{
                    width: 250,
                    marginBottom: 10,
                    marginLeft: 10,
                  }}
                >
                  <Text variant="small">
                    Scatta una foto o scegli dalla galleria la foto del testo
                    degli ingredienti per ottenere la trascrizione automatica
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "column",
                    marginTop: 10,
                    gap: 10,
                    marginLeft: 10,
                  }}
                >
                  <OCRButton
                    label="Scatta foto del testo"
                    icon="camera-outline"
                    onPress={handlePhotoIngredients}
                  />

                  <OCRButton
                    label="Scegli da galleria"
                    icon="image-outline"
                    onPress={() =>
                      chooseImageSource((uri) => {
                        setIngredientsPhoto(uri);
                        setIngredientsMode("photo");
                      })
                    }
                  />

                  {ingredientsOcrImage && (
                    <View>
                      {/* ❌ ELIMINA IMMAGINE OCR INGREDIENTI */}
                      <TouchableOpacity
                        onPress={() => {
                          setIngredientsOcrImage(null);
                          setIngredientsMode("text");
                        }}
                        style={styles.deleteSmallButton}
                      >
                        <Ionicons name="close" size={20} color="#cb0047" />
                      </TouchableOpacity>

                      <Image
                        source={{ uri: ingredientsOcrImage }}
                        style={styles.stepImagePlaceholder}
                      />
                    </View>
                  )}
                </View>
              </View>
            )}

            {ingredientsMode === "photo" && (
              <View>
                <View
                  style={{
                    width: 250,
                    marginBottom: 10,
                    marginLeft: 10,
                  }}
                >
                  <Text variant="small">
                    Scatta una foto o scegli dalla galleria la foto del testo
                    degli ingredienti per conservarla in formato fotografico
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "column",
                    marginTop: 10,
                    gap: 10,
                    marginLeft: 10,
                  }}
                >
                  <OCRButton
                    label="Scatta foto del testo"
                    icon="camera-outline"
                    onPress={handlePhotoIngredients}
                  />
                  <OCRButton
                    label="Scegli da galleria"
                    icon="image-outline"
                    onPress={() =>
                      chooseImageSource((uri) => {
                        setIngredientsPhoto(uri);
                        setIngredientsMode("photo");
                      })
                    }
                  />

                  {ingredientsPhoto && (
                    <View>
                      {/* ❌ ELIMINA FOTO INGREDIENTI */}
                      <TouchableOpacity
                        onPress={() => {
                          setIngredientsPhoto(null);
                          setIngredientsMode("text");
                        }}
                        style={styles.deleteSmallButton}
                      >
                        <Ionicons name="close" size={20} color="#cb0047" />
                      </TouchableOpacity>

                      <Image
                        source={{ uri: ingredientsPhoto }}
                        style={styles.ingImagePlaceholder}
                      />
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        {/* PROCEDIMENTO */}
        <View style={styles.procedimentoContainer}>
          {/* TITOLO + AGGIUNGI */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
            }}
          >
            <Text
              variant="title"
              style={[styles.sectionTitle, { textAlign: "center" }]}
            >
              Procedimento
            </Text>
          </View>

          <View style={[styles.separator, { marginBottom: 30 }]} />

          {/* LISTA STEP */}
          {steps.map((item, index) => (
            <Animated.View
              key={index}
              entering={FadeInDown.delay(50)}
              exiting={FadeOutUp}
              layout={Layout.springify()}
            >
              {/* CARD SINGOLO STEP */}
              <View style={styles.stepCard}>
                {/* RIGA ORIZZONTALE */}
                <View style={styles.stepRow}>
                  {/* CONTENUTO */}
                  <View style={styles.stepRowInner}>
                    {/* BADGE + TITOLO */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 15,
                        marginTop: 5,
                      }}
                    >
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: COLORS.primary,
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 10,
                        }}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontWeight: "600",
                            fontSize: 14,
                          }}
                        >
                          {index + 1}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Input
                          style={[
                            styles.stepTitleInput,
                            {
                              textAlign: "center",
                              marginTop: 0,
                              marginBottom: -22,
                            },
                          ]}
                          value={item.title}
                          onChangeText={(text) => updateStepTitle(index, text)}
                          placeholder="Titolo passaggio"
                          multiline
                        />
                      </View>
                    </View>

                    {/* FOTO PROCEDIMENTO */}
                    <TouchableOpacity
                      style={styles.stepImageButton}
                      onPress={() =>
                        chooseImageSource((uri) => {
                          setSteps((prev) =>
                            prev.map((s, i) =>
                              i === index ? { ...s, imageUri: uri } : s,
                            ),
                          );
                        })
                      }
                    >
                      {item.imageUri ? (
                        <View>
                          {/* ❌ ELIMINA FOTO PROCEDIMENTO */}
                          <TouchableOpacity
                            onPress={() => {
                              setSteps((prev) =>
                                prev.map((s, i) =>
                                  i === index ? { ...s, imageUri: null } : s,
                                ),
                              );
                            }}
                            style={styles.deleteSmallButton}
                          >
                            <Ionicons name="close" size={20} color="#cb0047" />
                          </TouchableOpacity>

                          <Image
                            source={{ uri: item.imageUri }}
                            style={styles.stepImagePlaceholder}
                          />
                        </View>
                      ) : (
                        <View style={styles.stepImagePlaceholder}>
                          <Ionicons
                            name="image-outline"
                            size={40}
                            color={COLORS.primary}
                          />
                          <Text style={styles.stepImageText}>
                            Tocca per aggiungere immagine
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* CONTENUTO VARIABILE */}
                    {(!item.mode || item.mode === "text") && (
                      <Input
                        style={styles.stepDescriptionInput}
                        value={item.description}
                        onChangeText={(t) => updateStepDescription(index, t)}
                        placeholder="Scrivi qui la descrizione"
                        multiline
                      />
                    )}

                    {item.mode === "ocr" && (
                      <View style={{ flexDirection: "column", gap: 10 }}>
                        <View
                          style={{
                            width: 250,
                            marginBottom: 10,
                          }}
                        >
                          <Text variant="small">
                            Scatta una foto o scegli dalla galleria la foto del
                            testo del procedimento per ottenere la trascrizione
                            automatica
                          </Text>
                        </View>
                        <OCRButton
                          label="Scatta foto del testo"
                          icon="camera-outline"
                          onPress={() => handlePhotoSteps(index)}
                        />

                        <OCRButton
                          label="Scegli da galleria"
                          icon="image-outline"
                          onPress={() =>
                            chooseImageSource((uri) => {
                              setSteps((prev) =>
                                prev.map((s, i) =>
                                  i === index
                                    ? { ...s, textImageUri: uri, mode: "photo" }
                                    : s,
                                ),
                              );
                            })
                          }
                        />

                        {item.description.length > 0 && (
                          <View>
                            {/* ❌ ELIMINA TESTO OCR */}
                            <TouchableOpacity
                              onPress={() => {
                                setSteps((prev) =>
                                  prev.map((s, i) =>
                                    i === index
                                      ? { ...s, description: "", mode: "text" }
                                      : s,
                                  ),
                                );
                              }}
                              style={styles.deleteSmallButton}
                            >
                              <Ionicons
                                name="close"
                                size={20}
                                color="#cb0047"
                              />
                            </TouchableOpacity>

                            <Text style={styles.ocrPreview}>
                              {item.description}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {item.mode === "photo" && (
                      <View style={{ flexDirection: "column", gap: 10 }}>
                        <View
                          style={{
                            width: 250,
                            marginBottom: 10,
                          }}
                        >
                          <Text variant="small">
                            Scatta una foto o scegli dalla galleria la foto del
                            testo del procedimento per conservarla in formato
                            fotografico
                          </Text>
                        </View>
                        <OCRButton
                          label="Scatta foto del testo"
                          icon="camera-outline"
                          onPress={() => handlePhotoSteps(index)}
                        />
                        <OCRButton
                          label="Scegli da galleria"
                          icon="image-outline"
                          onPress={() =>
                            chooseImageSource((uri) => {
                              setSteps((prev) =>
                                prev.map((s, i) =>
                                  i === index
                                    ? { ...s, textImageUri: uri, mode: "photo" }
                                    : s,
                                ),
                              );
                            })
                          }
                        />

                        {item.textImageUri && (
                          <View>
                            {/* ❌ ELIMINA FOTO OCR */}
                            <TouchableOpacity
                              onPress={() => {
                                setSteps((prev) =>
                                  prev.map((s, i) =>
                                    i === index
                                      ? {
                                          ...s,
                                          textImageUri: null,
                                          mode: "text",
                                        }
                                      : s,
                                  ),
                                );
                              }}
                              style={styles.deleteSmallButton}
                            >
                              <Ionicons
                                name="close"
                                size={20}
                                color="#cb0047"
                              />
                            </TouchableOpacity>

                            <Image
                              source={{ uri: item.textImageUri }}
                              style={[
                                styles.stepImagePlaceholder,
                                { marginTop: 12 },
                              ]}
                            />
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* SIDE ZONE */}
                  <View style={styles.stepSideZone}>
                    <TouchableOpacity
                      onPress={() =>
                        setSteps((prev) => [
                          ...prev,
                          { description: "", title: "", imageUri: undefined },
                        ])
                      }
                      style={{
                        padding: 6,
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={20}
                        color={COLORS.primary}
                      />
                      <Text
                        bold
                        style={{ fontSize: 11, color: COLORS.primary }}
                      >
                        Nuovo
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.stepDivider} />

                    {/* DUPLICA */}
                    <TouchableOpacity
                      onPress={() => {
                        const clone = { ...item };
                        setSteps((prev) => {
                          const arr = [...prev];
                          arr.splice(index + 1, 0, clone);
                          return arr;
                        });
                      }}
                      style={{
                        padding: 6,
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name="copy-outline"
                        size={20}
                        color={COLORS.primary}
                      />
                      <Text
                        bold
                        style={{ fontSize: 11, color: COLORS.primary }}
                      >
                        Duplica
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.stepDivider} />

                    {/* ELIMINA */}
                    <TouchableOpacity
                      onPress={() => removeStep(index)}
                      style={{
                        padding: 6,
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#cb0047"
                      />
                      <Text bold style={{ fontSize: 11, color: "#cb0047" }}>
                        Elimina
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.stepDivider} />

                    {/* FRECCIA SU */}
                    <TouchableOpacity
                      onPress={() => moveStepUp(index)}
                      style={{
                        padding: 6,
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name="caret-up"
                        size={28}
                        color={COLORS.primary}
                      />
                      <Text
                        bold
                        style={{ fontSize: 11, color: COLORS.primary }}
                      >
                        Sposta su
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.stepDivider} />

                    {/* FRECCIA GIÙ */}
                    <TouchableOpacity
                      onPress={() => moveStepDown(index)}
                      style={{
                        padding: 6,
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name="caret-down"
                        size={28}
                        color={COLORS.primary}
                      />
                      <Text
                        bold
                        style={{ fontSize: 11, color: COLORS.primary }}
                      >
                        Sposta giù
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.stepDivider} />

                    {/* FOTO */}
                    <TouchableOpacity
                      onPress={() => toggleStepMode(index, "photo")}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 20,
                        alignItems: "center",
                        backgroundColor:
                          item.mode === "photo" ? "#e8ddff" : "transparent",
                        borderRadius: 8,
                      }}
                    >
                      <Ionicons
                        name="camera-outline"
                        size={22}
                        color={COLORS.primary}
                      />
                      <Text
                        bold
                        style={{ fontSize: 11, color: COLORS.primary }}
                      >
                        Foto
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.stepDivider} />
                    {/* OCR */}
                    <TouchableOpacity
                      onPress={() => toggleStepMode(index, "ocr")}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 20,
                        alignItems: "center",
                        backgroundColor:
                          item.mode === "ocr" ? "#e8ddff" : "transparent",
                        borderRadius: 8,
                      }}
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={22}
                        color={COLORS.primary}
                      />
                      <Text
                        bold
                        style={{ fontSize: 11, color: COLORS.primary }}
                      >
                        OCR
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View
                  style={[
                    styles.stepDivider,
                    { marginTop: 10, marginBottom: 5 },
                  ]}
                />
              </View>
            </Animated.View>
          ))}
        </View>

        {/* NOTE */}
        <View style={styles.notesContainer}>
          {/* TITOLO */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 20,
              position: "relative",
            }}
          >
            <Text
              variant="title"
              style={[styles.sectionTitle, { textAlign: "center" }]}
            >
              Note
            </Text>
          </View>

          <View style={styles.separator} />

          {/* CARD NOTE */}
          <View style={styles.notesCardInner}>
            {/* CONTENUTO */}
            <View style={styles.notesContent}>
              {/* ⭐ INPUT TESTO — SEMPRE VISIBILE ⭐ */}
              <Input
                multiline
                value={notesText}
                onChangeText={setNotesText}
                placeholder="Scrivi qui le tue note"
                style={styles.notesInput}
              />
              <TouchableOpacity
                onPress={() =>
                  startDictation((text) => {
                    setNotesText(text);
                    setNotesMode("text");
                  }, "Detta le note")
                }
              >
                <Ionicons name="mic-outline" size={22} color="#cb0047" />
              </TouchableOpacity>

              {/* OCR */}
              {notesMode === "ocr" && (
                <View
                  style={{
                    marginLeft: 15,
                    marginRight: 100,
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 240,
                      marginBottom: 10,
                    }}
                  >
                    <Text variant="small">
                      Scatta una foto o scegli dalla galleria la foto del testo
                      delle note per ottenere la trascrizione automatica
                    </Text>
                  </View>
                  <OCRButton
                    label="Scatta foto del testo"
                    icon="camera-outline"
                    onPress={handlePhotoNotes}
                  />

                  <OCRButton
                    label="Scegli da galleria"
                    icon="image-outline"
                    onPress={() =>
                      chooseImageSource((uri) => {
                        setNotesImage(uri);
                        setNotesMode("photo");
                      })
                    }
                  />

                  {notesText.length > 0 && (
                    <View>
                      {/* ❌ ELIMINA TESTO OCR NOTE */}
                      <TouchableOpacity
                        onPress={() => {
                          setNotesText("");
                          setNotesMode("text");
                        }}
                        style={styles.deleteSmallButton}
                      >
                        <Ionicons name="close" size={20} color="#cb0047" />
                      </TouchableOpacity>

                      <Text style={styles.ocrPreview}>{notesText}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* FOTO */}
              {notesMode === "photo" && (
                <View
                  style={{
                    marginLeft: 15,
                    marginRight: 100,
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 240,
                      marginBottom: 10,
                    }}
                  >
                    <Text variant="small">
                      Scatta una foto o scegli dalla galleria la foto del testo
                      delle note per conservarle in formato fotografico
                    </Text>
                  </View>

                  <OCRButton
                    label="Scatta foto del testo"
                    icon="camera-outline"
                    onPress={handlePhotoNotes}
                  />
                  <OCRButton
                    label="Scegli da galleria"
                    icon="image-outline"
                    onPress={() =>
                      chooseImageSource((uri) => {
                        setNotesImage(uri);
                        setNotesMode("photo");
                      })
                    }
                  />

                  {notesImage && (
                    <View>
                      {/* ❌ ELIMINA FOTO NOTE */}
                      <TouchableOpacity
                        onPress={() => {
                          setNotesImage(null);
                          setNotesMode("text");
                        }}
                        style={styles.deleteSmallButton}
                      >
                        <Ionicons name="close" size={20} color="#cb0047" />
                      </TouchableOpacity>

                      <Image
                        source={{ uri: notesImage }}
                        style={[styles.stepImagePlaceholder, { marginTop: 12 }]}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* ⭐ SIDE ZONE ⭐ */}
            <View style={styles.notesSideZone}>
              {/* ELIMINA */}
              <TouchableOpacity
                onPress={() => {
                  setNotesText("");
                  setNotesImage(null);
                  setNotesMode("text");
                }}
                style={{
                  padding: 6,
                  marginRight: 5,
                  alignItems: "center",
                  marginTop: -10,
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#cb0047" />
                <Text bold style={{ fontSize: 11, color: "#cb0047" }}>
                  Elimina
                </Text>
              </TouchableOpacity>

              <View style={styles.stepDivider} />

              {/* FOTO */}
              <TouchableOpacity
                onPress={() =>
                  setNotesMode(notesMode === "photo" ? "text" : "photo")
                }
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 20,
                  backgroundColor:
                    notesMode === "photo" ? "#e8ddff" : "transparent",
                  borderRadius: 8,
                }}
              >
                <Ionicons
                  name="camera-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text bold style={{ fontSize: 11, color: COLORS.primary }}>
                  Foto
                </Text>
              </TouchableOpacity>
              <View style={styles.stepDivider} />

              {/* OCR */}
              <TouchableOpacity
                onPress={() =>
                  setNotesMode(notesMode === "ocr" ? "text" : "ocr")
                }
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 20,
                  backgroundColor:
                    notesMode === "ocr" ? "#e8ddff" : "transparent",
                  borderRadius: 8,
                }}
              >
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text bold style={{ fontSize: 11, color: COLORS.primary }}>
                  OCR
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SALVA */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text variant="title" style={styles.saveButtonText}>
            Salva Modifiche
          </Text>
        </TouchableOpacity>
        {showGroupModal && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                padding: 20,
                borderRadius: 16,
                width: "100%",
              }}
            >
              <Text bold style={{ fontSize: 18, marginBottom: 12 }}>
                Nome del gruppo
              </Text>

              <Input
                value={newGroupTitle}
                onChangeText={setNewGroupTitle}
                placeholder="Es: Impasto, Crema, Farcitura..."
              />

              <TouchableOpacity
                onPress={createGroupFromSelection}
                style={{
                  backgroundColor: COLORS.primary,
                  padding: 14,
                  borderRadius: 12,
                  marginTop: 20,
                  alignItems: "center",
                }}
              >
                <Text
                  bold
                  style={{ color: "white", fontSize: 16, fontWeight: "600" }}
                >
                  Crea
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowGroupModal(false)}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  marginTop: 10,
                  alignItems: "center",
                }}
              >
                <Text bold style={{ color: COLORS.primary, fontSize: 16 }}>
                  Annulla
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================================================
   STILI — IDENTICI A edit/[id].tsx
   ============================================================ */

const styles = StyleSheet.create({
  /* ============================================================
     LAYOUT GENERALE
     ============================================================ */
  container: {
    flex: 1,
    backgroundColor: "#fffaf0",
    paddingTop: 50,
    marginBottom: -60,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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

  /* ============================================================
     CARD GENERICA
     ============================================================ */
  card: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 18,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    color: COLORS.text,
    marginBottom: 14,
    textAlign: "center",
  },

  /* ============================================================
     INFO BASE
     ============================================================ */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  half: { flex: 1 },

  inputLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 10,
  },

  pickerContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
  },

  /* ============================================================
     FOTO PRINCIPALE
     ============================================================ */
  headerImage: {
    width: "100%",
    height: 240,
    backgroundColor: "#ffffff",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  headerPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  headerPlaceholderText: {
    marginTop: 8,
    color: "#aaa",
    fontSize: 15,
  },

  /* ============================================================
     PULSANTI AGGIUNTA INGREDIENTI
     ============================================================ */
  addButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 10,
  },

  bigAddButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
  },

  bigAddButtonText: {
    color: "white",
    marginLeft: 6,
    fontSize: 15,
    padding: 5,
  },

  /* ============================================================
   STEP — CARD IDENTICA A edit/[id].tsx
   ============================================================ */
  procedimentoContainer: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 24,
    paddingTop: 20,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },

  /* CARD SINGOLO STEP */
  stepCard: {
    backgroundColor: "white",
    marginBottom: 24,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    marginTop: -24,
  },

  /* RIGA ORIZZONTALE (contenuto + side zone) */
  stepRow: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },

  /* CONTENUTO DELLO STEP */
  stepRowInner: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 30,
    paddingLeft: 30,
    paddingRight: 0,
    marginRight: 100,
  },

  /* ZONA LATERALE (frecce, duplica, elimina, foto, ocr) */
  stepSideZone: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: 70,
    backgroundColor: "white",
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "flex-start",
  },

  stepTitleCentered: {
    fontSize: 18,
    color: COLORS.primary,
    textAlign: "center",
    width: "100%",
    marginBottom: 12,
  },

  stepImageButton: {
    width: "100%",
    marginVertical: 15,
  },

  stepImagePlaceholder: {
    width: "100%",
    height: 300,
    borderRadius: 14,
    backgroundColor: "#f3f3f3",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },

  ingImagePlaceholder: {
    width: 250,
    height: 300,
    borderRadius: 14,
    backgroundColor: "#f3f3f3",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },

  stepImageText: {
    marginTop: 6,
    color: "#777",
    fontSize: 14,
    paddingHorizontal: 10,
    textAlign: "center",
  },

  stepTitleInput: {
    fontSize: 16,
    marginTop: 35,
    textAlign: "center",
    marginRight: 20,
  },

  stepDescriptionInput: {
    fontSize: 16,
    minHeight: 160,
    textAlignVertical: "top",
    marginBottom: -30,
  },

  stepDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 3,
    width: "100%",
  },

  /* ============================================================
     SALVA
     ============================================================ */
  saveButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 18,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 80,
  },

  saveButtonText: {
    color: "white",
    fontSize: 18,
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginTop: 5,
    marginBottom: 20,
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    marginTop: 4,
  },

  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#eee",
  },

  tabActive: {
    backgroundColor: COLORS.primary,
    opacity: 0.9,
  },

  ocrPreview: {
    backgroundColor: "#fafafa",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 15,
    color: COLORS.text,
    marginTop: 15,
  },

  folderTabsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 16,
  },

  folderTab: {
    paddingVertical: 8,
    paddingHorizontal: 25,
    backgroundColor: "#e8e8e8",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1,
    borderColor: "#cfcfcf",
    borderBottomWidth: 3, // linea più spessa per effetto "incastrato"
    borderBottomColor: "#bdbdbd",
  },

  folderTabActive: {
    backgroundColor: "#fff",
    borderBottomColor: "#fff", // sparisce la linea → effetto "tab sollevata"
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  folderTabLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },

  notesCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 18,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 50,
  },

  notesContainer: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 0,
    overflow: "hidden",
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },

  notesCardInner: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgb(255, 255, 255)",
    marginBottom: 24,
    position: "relative",
    overflow: "hidden",
  },

  notesContent: {
    padding: 18,
    paddingRight: 0,
  },

  notesSideZone: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: 70,
    backgroundColor: "white",
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "flex-start",
  },

  notesInput: {
    fontSize: 16,
    color: "#444",
    marginTop: -15,
    paddingVertical: 10,
    minHeight: 160,
    marginRight: 100,
    marginLeft: 15,
    textAlignVertical: "top",
  },

  /* ============================================================
   INGREDIENTI — STILI AGGIORNATI
============================================================ */

  ingredientsSideZone: {
    marginTop: 75,
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: 75,
    backgroundColor: "white",
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "flex-start",
    zIndex: 10,
    marginBottom: 30,
  },

  /* RIGA INGREDIENTE LIBERO */
  ingredientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  /* CARD INGREDIENTE LIBERO */
  ingredientCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    paddingTop: 14,
    paddingRight: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 250,
    maxWidth: 250,
    minHeight: 185,
  },

  /* HEADER INGREDIENTE LIBERO (nome + pulsanti) */
  ingredientHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  ingredientButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  /* CHECKBOX */
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: -15,
    right: 0,
  },

  checkboxUnselected: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#ccc",
  },

  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  /* INPUT NOME (100% larghezza, maxWidth) */
  ingName: {
    flex: 1,
    minWidth: 0,
    maxWidth: 300,
    width: "100%",
    fontSize: 16,
    marginBottom: -5,
  },

  /* QTÀ (30%) */
  ingQty: {
    flex: 0.3,
    minWidth: 90,
    maxWidth: 90,
    textAlign: "center",
    fontSize: 16,
    marginBottom: 15,
  },

  /* UNITÀ (70%) */
  ingUnit: {
    flex: 0.7,
    minWidth: 70,
    maxWidth: 70,
    textAlign: "center",
    fontSize: 16,
    marginBottom: 15,
  },

  /* RIGA QTÀ + UNITÀ */
  ingredientRowBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },

  /* ============================================================
   GRUPPI
============================================================ */

  groupRow: {
    flexDirection: "row",
    marginBottom: 20,
  },

  groupCardUnified: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0d7ff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 250,
    maxWidth: 250,
  },

  /* HEADER GRUPPO (pulsanti dentro la card) */
  groupFolderTab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0e8ff",
    padding: 10,
    paddingBottom: -10,
    marginLeft: -10,
  },

  groupButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  groupTitleInputUnified: {
    flex: 1,
    fontSize: 17,
    minWidth: 150,
    maxWidth: 160,
  },

  /* CONTENITORE INGREDIENTI NEL GRUPPO */
  groupItemsContainer: {
    paddingRight: 10,
    gap: 6,
  },

  /* CARD INGREDIENTE DENTRO GRUPPO */
  groupIngredientCard: {
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgb(255, 255, 255)",
    paddingVertical: 12,
    flexDirection: "column",
    marginTop: -10,
    marginBottom: -10,
  },

  ingGroupName: {
    flex: 1,
    minWidth: 150,
    maxWidth: 150,
    width: "100%",
    fontSize: 16,
    marginBottom: -5,
  },
  ingGroupQty: {
    flex: 0.3,
    minWidth: 80,
    maxWidth: 80,
    textAlign: "center",
    fontSize: 16,
  },
  ingGroupUnit: {
    flex: 0.7,
    minWidth: 80,
    maxWidth: 80,
    textAlign: "center",
    fontSize: 16,
  },

  /* ============================================================
   BOTTONI RAGGRUPPA
============================================================ */

  createGroupButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
    width: 250,
  },

  createGroupButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  existingGroupButton: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f7f4ff",
    borderWidth: 1,
    borderColor: "#e0d7ff",
    marginBottom: 10,
    width: 250,
  },

  ingredientRowTop: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },

  ingredientInnerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  ingredientSidebar: {
    width: 30,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
    marginTop: 5,
  },

  groupInnerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  groupSidebar: {
    width: 35,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-around",
    marginLeft: 5,
    marginTop: 15,
    marginBottom: 15,
    gap: 10,
  },

  verticalDivider: {
    width: 1,
    backgroundColor: "#e0e0e0",
    height: "100%",
    marginHorizontal: 10,
    marginBottom: 10,
  },

  ingredientContent: {
    flex: 1,
  },

  groupContent: {
    flex: 1,
    gap: 10,
  },

  sideBtn: {
    paddingVertical: 2,
  },

  groupRecap: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
    marginRight: 4,
  },

  groupIngredientHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  groupIngredientDeleteBtn: {
    padding: 4,
    marginLeft: 6,
  },

  deleteSmallButton: {
    position: "absolute",
    top: -10,
    right: -10,
    zIndex: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
