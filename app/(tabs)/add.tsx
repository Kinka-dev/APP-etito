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
  Modal,
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
  linkedRecipeId?: string;
}

interface GroupFlat {
  type: "group";
  id: string;
  title: string;
  collapsed: boolean;
  linkedRecipeId?: string;
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
  const { addRecipe, recipes } = useRecipeContext();

  /* ============================================================
     STATE BASE
     ============================================================ */

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("altro");
  const [prepTime, setPrepTime] = useState("");
  const [servings, setServings] = useState("");
  const [tags, setTags] = useState("");
  const [mainImageUri, setMainImageUri] = useState<string | null>(null);

  const [expandedActions, setExpandedActions] = useState<{
    [key: string]: boolean;
  }>({});

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

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedIngredientIndex, setSelectedIngredientIndex] = useState<
    number | null
  >(null);

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

  const toggleActions = (id: string) => {
    setExpandedActions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
  const openRecipePicker = (index: number) => {
    setSelectedIngredientIndex(index);
    setIsPickerOpen(true);
  };

  const closeRecipePicker = () => {
    setIsPickerOpen(false);
    setSelectedIngredientIndex(null);
  };

  const selectLinkedRecipe = (recipeId: string) => {
    if (selectedIngredientIndex === null) return;

    const updated = [...items];
    updated[selectedIngredientIndex] = {
      ...updated[selectedIngredientIndex],
      linkedRecipeId: recipeId,
    };

    setItems(updated);
    closeRecipePicker();
  };

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

      // 1. Trova il gruppo
      const groupIndex = prev.findIndex(
        (i) => i.type === "group" && i.id === groupId,
      );
      if (groupIndex === -1) return prev;

      // 2. Trova tutti gli ingredienti del gruppo
      const groupIngredients = prev.filter(
        (i) => i.type === "ingredient" && i.groupId === groupId,
      );

      // 3. Trova tutti gli altri elementi
      const otherItems = prev.filter(
        (i) => !(i.type === "ingredient" && i.groupId === groupId),
      );

      const group = prev[groupIndex];

      return [
        ...otherItems.slice(0, otherItems.indexOf(group) + 1),
        ...groupIngredients,
        newIngredient, // ⭐ SEMPRE IN FONDO
        ...otherItems.slice(otherItems.indexOf(group) + 1),
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
        mode: s.mode ?? "text",
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
            <View>
              {/* ❌ ELIMINA FOTO PRINCIPALE */}
              <TouchableOpacity
                onPress={() => setMainImageUri(null)}
                style={styles.deleteMainSmallButton}
              >
                <Ionicons name="close" size={20} color="#cb0047" />
              </TouchableOpacity>

              <Image
                source={{ uri: mainImageUri }}
                style={styles.headerImage}
                resizeMode="cover"
              />
            </View>
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
                label="Tempo"
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
                keyboardType="default"
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

        <View style={[styles.secIngCard, { minHeight: 420 }]}>
          <Text variant="title" style={styles.sectionTitle}>
            Ingredienti
          </Text>
          <View style={[styles.separator, { width: 370, marginLeft: -20 }]} />

          {/* FOTO INGREDIENTI */}
          {ingredientsPhoto && (
            <View>
              {/* ❌ ELIMINA FOTO INGREDIENTI */}
              <TouchableOpacity
                onPress={() => {
                  setIngredientsPhoto(null);
                  setIngredientsMode("text");
                }}
                style={styles.deleteIngSmallButton}
              >
                <Ionicons name="close" size={20} color="#cb0047" />
              </TouchableOpacity>

              <Image
                source={{ uri: ingredientsPhoto }}
                style={styles.ingImagePlaceholder}
                resizeMode="cover"
              />
            </View>
          )}

          {/* OCR INGREDIENTI */}
          {ingredientsOcrImage && (
            <Image
              source={{ uri: ingredientsOcrImage }}
              style={styles.stepImagePlaceholder}
            />
          )}

          {/* LISTA INGREDIENTI */}
          <ScrollView style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
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

                return (
                  <View key={group.id} style={styles.groupCard}>
                    {/* HEADER GRUPPO */}
                    <View style={styles.groupHeader}>
                      <Input
                        style={styles.groupTitle}
                        value={group.title}
                        placeholder="Nome gruppo"
                        onChangeText={(text) =>
                          updateGroupTitle(group.id, text)
                        }
                      />

                      <TouchableOpacity onPress={() => toggleGroup(group.id)}>
                        <Ionicons
                          name={group.collapsed ? "chevron-down" : "chevron-up"}
                          size={22}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* INGREDIENTI DEL GRUPPO */}
                    {group.collapsed && (
                      <Text style={styles.groupRecap}>
                        {groupIngredients
                          .filter(
                            (g): g is IngredientFlat => g.type === "ingredient",
                          )
                          .map((g) => g.name || "—")
                          .join(", ")}
                      </Text>
                    )}

                    {!group.collapsed && (
                      <View style={{ marginTop: 10 }}>
                        {groupIngredients.map((ing) => {
                          if (ing.type !== "ingredient") return null;
                          const ingItem = ing as IngredientFlat;

                          // ⭐ Index reale dentro items
                          const realIndex = items.findIndex(
                            (i) => i.id === ingItem.id,
                          );

                          return (
                            <View key={ingItem.id} style={styles.groupIngCard}>
                              {/* RIGA PRINCIPALE */}
                              <View style={styles.ingRow}>
                                <Input
                                  style={styles.ingName}
                                  value={ingItem.name}
                                  placeholder="Ingrediente"
                                  multiline
                                  onChangeText={(t) =>
                                    updateIngredient(ingItem.id, "name", t)
                                  }
                                />

                                <Input
                                  style={styles.ingQty}
                                  value={ingItem.quantity}
                                  placeholder="Qtà"
                                  multiline
                                  onChangeText={(t) =>
                                    updateIngredient(ingItem.id, "quantity", t)
                                  }
                                />

                                <Input
                                  style={styles.ingUnit}
                                  value={ingItem.unit}
                                  placeholder="Un."
                                  multiline
                                  onChangeText={(t) =>
                                    updateIngredient(ingItem.id, "unit", t)
                                  }
                                />
                                {/* ⭐ TOGGLE MENU */}
                                <TouchableOpacity
                                  onPress={() => toggleActions(ingItem.id)}
                                >
                                  <Ionicons
                                    name="ellipsis-vertical"
                                    size={20}
                                    color={COLORS.primary}
                                  />
                                </TouchableOpacity>
                              </View>

                              {/* ⭐ CHECKBOX RAGGRUPPAMENTO */}
                              {groupingMode && (
                                <View style={styles.ingCheckboxRow}>
                                  <TouchableOpacity
                                    onPress={() =>
                                      toggleIngredientSelection(ingItem.id)
                                    }
                                    style={[
                                      styles.checkbox,
                                      selectedForGroup.includes(ingItem.id)
                                        ? styles.checkboxSelected
                                        : styles.checkboxUnselected,
                                    ]}
                                  >
                                    {selectedForGroup.includes(ingItem.id) && (
                                      <Ionicons
                                        name="checkmark"
                                        size={18}
                                        color="#fff"
                                      />
                                    )}
                                  </TouchableOpacity>
                                </View>
                              )}

                              {expandedActions[ingItem.id] && (
                                <View style={styles.ingFooter}>
                                  <TouchableOpacity
                                    onPress={() => removeIngredient(ingItem.id)}
                                  >
                                    <Ionicons
                                      name="trash-outline"
                                      size={20}
                                      color="#cb0047"
                                    />
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    onPress={() => openRecipePicker(realIndex)}
                                  >
                                    <Ionicons
                                      name="link-outline"
                                      size={22}
                                      color={COLORS.primary}
                                    />
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    onPress={() => moveItemUp(realIndex)}
                                  >
                                    <Ionicons
                                      name="caret-up"
                                      size={22}
                                      color={COLORS.primary}
                                    />
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    onPress={() => moveItemDown(realIndex)}
                                  >
                                    <Ionicons
                                      name="caret-down"
                                      size={22}
                                      color={COLORS.primary}
                                    />
                                  </TouchableOpacity>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* FOOTER GRUPPO */}
                    <View style={styles.groupFooter}>
                      <TouchableOpacity onPress={() => removeGroup(group.id)}>
                        <Ionicons
                          name="trash-outline"
                          size={22}
                          color="#cb0047"
                        />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => moveItemUp(index)}>
                        <Ionicons
                          name="caret-up"
                          size={22}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => moveItemDown(index)}>
                        <Ionicons
                          name="caret-down"
                          size={22}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => addIngredientToGroup(group.id)}
                      >
                        <Ionicons
                          name="add-circle-outline"
                          size={22}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }

              /* ============================================================
         INGREDIENTE LIBERO
      ============================================================ */
              const ing = item as IngredientFlat;
              if (ing.groupId) return null;

              /* INGREDIENTE LIBERO */
              if (item.type === "ingredient" && !item.groupId) {
                const ing = item as IngredientFlat;

                // ⭐ Index reale dentro items
                const realIndex = items.findIndex((i) => i.id === ing.id);

                return (
                  <View key={ing.id} style={styles.ingCard}>
                    {/* RIGA PRINCIPALE */}
                    <View style={styles.ingRow}>
                      <Input
                        style={styles.ingName}
                        value={ing.name}
                        placeholder="Ingrediente"
                        multiline
                        onChangeText={(t) =>
                          updateIngredient(ing.id, "name", t)
                        }
                      />

                      <Input
                        style={styles.ingQty}
                        value={ing.quantity}
                        placeholder="Qtà"
                        multiline
                        onChangeText={(t) =>
                          updateIngredient(ing.id, "quantity", t)
                        }
                      />

                      <Input
                        style={styles.ingUnit}
                        value={ing.unit}
                        placeholder="Un."
                        multiline
                        onChangeText={(t) =>
                          updateIngredient(ing.id, "unit", t)
                        }
                      />

                      {/* ⭐ TOGGLE MENU */}
                      <TouchableOpacity
                        style={styles.freeIngMenuToggle}
                        onPress={() => toggleActions(ing.id)}
                      >
                        <Ionicons
                          name="ellipsis-vertical"
                          size={20}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* ⭐ CHECKBOX RAGGRUPPAMENTO */}
                    {groupingMode && (
                      <View style={styles.ingCheckboxRow}>
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
                            <Ionicons name="checkmark" size={18} color="#fff" />
                          )}
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* ⭐ FOOTER PULSANTI */}
                    {expandedActions[ing.id] && (
                      <View style={styles.ingFooter}>
                        <TouchableOpacity
                          onPress={() => removeIngredient(ing.id)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={22}
                            color="#cb0047"
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => openRecipePicker(realIndex)}
                        >
                          <Ionicons
                            name="link-outline"
                            size={22}
                            color={COLORS.primary}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => moveItemUp(realIndex)}>
                          <Ionicons
                            name="caret-up"
                            size={22}
                            color={COLORS.primary}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => moveItemDown(realIndex)}
                        >
                          <Ionicons
                            name="caret-down"
                            size={22}
                            color={COLORS.primary}
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              }
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
                  style={{ marginBottom: 10, textAlign: "center" }}
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
              <View style={{ gap: 12 }}>
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
              </View>
            )}

            {ingredientsMode === "photo" && (
              <View style={{ gap: 12 }}>
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
              </View>
            )}
          </ScrollView>

          {/* FOOTER SEZIONE */}
          <View style={styles.ingredientsFooter}>
            <TouchableOpacity onPress={addIngredient} style={styles.footerBtn}>
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text bold style={styles.footerLabel}>
                Nuovo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setItems([])}
              style={styles.footerBtn}
            >
              <Ionicons name="trash-outline" size={20} color="#cb0047" />
              <Text bold style={[styles.footerLabel, { color: "#cb0047" }]}>
                Svuota
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setGroupingMode((prev) => !prev)}
              style={[
                styles.footerBtn,
                groupingMode && {
                  backgroundColor: "#e8ddff",
                  borderRadius: 8,
                  paddingVertical: 2,
                },
              ]}
            >
              <Ionicons
                name="albums-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text bold style={styles.footerLabel}>
                Raggruppa
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                setIngredientsMode(
                  ingredientsMode === "photo" ? "text" : "photo",
                )
              }
              style={[
                styles.footerBtn,
                ingredientsMode === "photo" && {
                  backgroundColor: "#e8ddff",
                  borderRadius: 8,
                  paddingVertical: 2,
                  paddingHorizontal: 10,
                },
              ]}
            >
              <Ionicons
                name="camera-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text bold style={styles.footerLabel}>
                Foto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                setIngredientsMode(ingredientsMode === "ocr" ? "text" : "ocr")
              }
              style={[
                styles.footerBtn,
                ingredientsMode === "ocr" && {
                  backgroundColor: "#e8ddff",
                  borderRadius: 8,
                  paddingVertical: 2,
                  paddingHorizontal: 10,
                },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text bold style={styles.footerLabel}>
                OCR
              </Text>
            </TouchableOpacity>
          </View>
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
        <Modal visible={isPickerOpen} animationType="slide" transparent={false}>
          <SafeAreaView style={{ flex: 1, padding: 20 }}>
            <Text
              bold
              style={{
                fontSize: 22,
                marginBottom: 30,
                textAlign: "center",
                marginTop: 60,
              }}
            >
              Collega una ricetta
            </Text>

            <ScrollView>
              {recipes.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => selectLinkedRecipe(r.id)}
                  style={{
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderColor: "#ddd",
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{r.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={closeRecipePicker}
              style={{
                marginTop: 20,
                padding: 14,
                backgroundColor: COLORS.primary,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text bold style={{ fontSize: 16, color: "white" }}>
                Annulla
              </Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Modal>
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
    width: "90%",
    minHeight: 300,
    borderRadius: 14,
    backgroundColor: "#f3f3f3",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
    marginRight: 16,
    marginLeft: 16,
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
  secIngCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 18,
    paddingHorizontal: 5,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    minHeight: 120,
  },

  ingCheckboxRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    marginTop: 10,
    marginRight: 5,
    gap: 8,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },

  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  checkboxUnselected: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  ingCheckboxLabel: {
    fontSize: 13,
    color: "#555",
  },

  createGroupButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
    width: "100%",
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
    width: "100%",
  },

  verticalDivider: {
    width: 1,
    backgroundColor: "#e0e0e0",
    height: "100%",
    marginHorizontal: 10,
    marginBottom: 10,
  },

  groupRecap: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    marginBottom: 15,
    marginLeft: 15,
    marginRight: 15,
  },

  groupIngredientHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  deleteSmallButton: {
    position: "absolute",
    top: -5,
    right: -5,
    zIndex: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  deleteIngSmallButton: {
    position: "absolute",
    top: -5,
    right: 10,
    zIndex: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteMainSmallButton: {
    position: "absolute",
    top: 5,
    right: 5,
    zIndex: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  ingCard: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },

  groupIngCard: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },

  groupCard: {
    width: "100%",
    paddingHorizontal: 5,
    paddingVertical: 12,
    backgroundColor: "#f2f2ff",
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#dcdcff",
  },
  checkboxInRow: {
    marginLeft: 6,
    marginRight: 6, // come richiesto
  },
  ingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  ingName: {
    minWidth: 120,
    maxWidth: 120,
    borderColor: "#ffffff",
    borderBottomRightRadius: 0,
    borderTopRightRadius: 0,
    marginLeft: -10,
    marginBottom: -20,
    marginTop: -10,
  },

  ingQty: {
    minWidth: 70,
    maxWidth: 70,
    borderColor: "#ffffff",
    borderBottomRightRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopLeftRadius: 0,
    marginLeft: -10,
    marginBottom: -20,
    marginTop: -10,
  },

  ingUnit: {
    minWidth: 90,
    maxWidth: 90,
    borderColor: "#ffffff",
    borderBottomLeftRadius: 0,
    borderTopLeftRadius: 0,
    marginLeft: -10,
    marginBottom: -20,
    marginTop: -10,
  },

  ingLinkBtn: {
    paddingHorizontal: 6,
  },

  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },

  groupTitle: {
    flex: 1,
    minWidth: 180,
    marginRight: 5,
    textAlign: "center",
    fontFamily: "Outfit-SemiBold",
  },

  groupFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    marginHorizontal: 10,
  },
  ingredientsFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 10,
    marginTop: -5,
    marginBottom: -5,
    marginHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },

  footerBtn: {
    alignItems: "center",
    paddingHorizontal: 6,
  },

  footerLabel: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 2,
  },

  /* ⭐ PULSANTE CHECKBOX NEL FOOTER */
  footerCheckboxBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    zIndex: 10, // 🔥 evita che venga coperta
  },

  footerCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },

  footerCheckboxSelected: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  footerCheckboxUnselected: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  ingSeparator: {
    height: 1,
    backgroundColor: "#dad7d7",
    marginHorizontal: -12,
  },

  ingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },

  menuToggle: {
    paddingHorizontal: 6,
  },

  ingRowGroupingActive: {
    paddingRight: 10, // spazio per la checkbox
  },

  checkboxInCard: {
    marginLeft: 6,
    marginRight: 6, // ⭐ come richiesto
  },

  freeIngMenuToggle: {
    marginLeft: 10,
  },
});
