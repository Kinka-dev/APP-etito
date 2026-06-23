// app/edit/[id].tsx
import CategoryDropdown from "@/components/CategoryDropdown";
import { useChooseImageSource } from "@/components/chooseImageSource";
import Input from "@/components/Input";
import Text from "@/components/Text";
import {
  CATEGORIES,
  CATEGORY_IMAGES,
  CATEGORY_LABELS,
} from "@/constants/categories";
import { COLORS } from "@/constants/colors";
import { useRecipeContext } from "@/context/RecipeContext";
import { Category, Recipe } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import Fuse from "fuse.js";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  Keyboard,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import MlkitOcr from "react-native-mlkit-ocr";
import Animated, {
  Easing,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeOutLeft,
  FadeOutRight,
  FadeOutUp,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { nutritionDB } from "../data/nutritionDB";
import { nutritionIndex } from "../data/nutritionIndex";
import { normalizeImage } from "../utils/normalizeImage";
import { parseIngredientLine } from "../utils/parseIngredients";
type IoniconName = keyof typeof Ionicons.glyphMap;

const CATEGORY_ITEMS = CATEGORIES.map((cat) => ({
  id: cat,
  label: CATEGORY_LABELS[cat],
  image: CATEGORY_IMAGES[cat],
}));

/* ============================================================
   TIPI
============================================================ */

export interface IngredientFlat {
  type: "ingredient";
  id: string;
  name: string;
  quantity: number | "";
  unit: string;
  groupId: string | null;
  linkedRecipeId?: string | null;
  kcal?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
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
  imageUri: string | null;
  textImageUri: string | null;
  collapsed: boolean;
  actionsOpen: boolean;
}

/* ============================================================
   COMPONENTE IMMAGINE STEP
============================================================ */

type StepImageProps = {
  uri: string | null;
  onPress: () => void;
};

function StepImage({ uri, onPress }: StepImageProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: "100%",
        height: 200,
        backgroundColor: "#f0f0f0",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#eee",
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      ) : (
        <>
          <Ionicons name="camera-outline" size={50} color={COLORS.secondary} />
          <Text style={styles.heroPlaceholderText}>
            Tocca per aggiungere immagine
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const StepOcrPreview = ({ uri }: { uri: string }) => {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    RNImage.getSize(
      uri,
      (w: number, h: number) => setSize({ w, h }),
      () => {},
    );
  }, [uri]);

  if (!size) return null;

  const MAX_WIDTH = 300;
  const displayW = MAX_WIDTH;
  const displayH = (size.h / size.w) * MAX_WIDTH;

  return (
    <View style={{ alignItems: "center", marginTop: 10 }}>
      <ExpoImage
        source={{ uri }}
        style={{
          width: displayW,
          height: displayH,
          borderRadius: 12,
          backgroundColor: "#eee",
        }}
        contentFit="cover"
      />
    </View>
  );
};

const allIngredients = Object.values(nutritionDB).flatMap((category) =>
  Object.entries(category).map(([name, data]) => ({
    name,
    ...data,
  })),
);

type NutritionSuggestion = {
  name: string;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
};

/* ============================================================
   SCREEN EDIT
============================================================ */

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams();
  const { recipes, addRecipe, getRecipeById, updateRecipe } =
    useRecipeContext();

  const [category, setCategory] = useState<Category | "all">("all");

  const [title, setTitle] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [mainImageUri, setMainImageUri] = useState<string | null>(null);

  const [notesText, setNotesText] = useState("");
  const [notesImage, setNotesImage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"ingredienti" | "procedimento">(
    "ingredienti",
  );

  const [suggestions, setSuggestions] = useState<NutritionSuggestion[]>([]);
  const [activeSuggestionFor, setActiveSuggestionFor] = useState<string | null>(
    null,
  );

  const [openStepOverlay, setOpenStepOverlay] = useState<number | null>(null);

  const [openActions, setOpenActions] = useState<string | null>(null);
  const [groupingMode, setGroupingMode] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState("");

  const [ingredientsPhoto, setIngredientsPhoto] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<IngredientFlat[]>([]);
  const [groups, setGroups] = useState<GroupFlat[]>([]);
  const [items, setItems] = useState<FlatItem[]>([]);

  const [steps, setSteps] = useState<StepForm[]>([]);
  const [openStepMenu, setOpenStepMenu] = useState<number | null>(null);

  const [saveModalVisible, setSaveModalVisible] = useState(false);

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedIngredientIndex, setSelectedIngredientIndex] = useState<
    number | null
  >(null);
  const uid = () =>
    Math.random().toString(36).slice(2) + Date.now().toString(36);

  const [cropSize, setCropSize] = useState<{ w: number; h: number } | null>(
    null,
  );
  const MAX_WIDTH = 300;

  const displayW = MAX_WIDTH;
  const displayH = cropSize ? (cropSize.h / cropSize.w) * MAX_WIDTH : 0;

  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(0);

  useEffect(() => {
    if (!ingredientsPhoto) return;

    RNImage.getSize(
      ingredientsPhoto,
      (w: number, h: number) => {
        setCropSize({ w, h });
      },
      (error) => console.log("Error loading image size:", error),
    );
  }, [ingredientsPhoto]);

  useEffect(() => {
    setIngredients((prev) =>
      prev.map((i) => ({
        ...i,
        groupId: i.groupId === "" ? null : i.groupId,
      })),
    );
  }, []);

  const chooseImage = useChooseImageSource((croppedUri) => {
    setMainImageUri(croppedUri);
  });

  const chooseStepImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      exif: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    // ⭐ Normalizzazione completa (EXIF + resize coerente)
    const normalizedUri = await normalizeImage(asset.uri);

    // ⭐ Callback per salvare l’immagine ritagliata
    globalThis._onCrop = (finalUri: string) => {
      setSteps((prev) =>
        prev.map((s, i) => (i === index ? { ...s, imageUri: finalUri } : s)),
      );
    };

    // ⭐ Apri il CropScreen SENZA parametri che forzano zoom
    router.push({
      pathname: "/CropScreen",
      params: { uri: normalizedUri },
    });
  };

  const chooseOCRImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      exif: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    // ⭐ Normalizzazione completa (EXIF + resize coerente)
    const normalizedUri = await normalizeImage(asset.uri);

    // ⭐ Callback globale per il CropScreen OCR
    globalThis._onCropStepOcr = async (finalUri: string) => {
      // 1) salva l’immagine ritagliata
      setSteps((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, textImageUri: finalUri } : s,
        ),
      );

      // 2) estrai il testo
      const text = await extractTextFromImage(finalUri);

      // 3) salva il testo nella descrizione dello step
      setSteps((prev) =>
        prev.map((s, i) => (i === index ? { ...s, description: text } : s)),
      );
    };

    // ⭐ Apri il CropScreen OCR
    router.push({
      pathname: "/StepOcrCropScreen",
      params: { uri: normalizedUri },
    });
  };

  const chooseIngredientsPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      exif: true,
    });

    if (result.canceled) return;

    const normalized = await normalizeImage(result.assets[0].uri);

    globalThis._onCropIngredient = async (finalUri: string) => {
      setIngredientsPhoto(finalUri);

      const text = await extractTextFromImage(finalUri);
      parseIngredientsFromText(text);
    };

    router.push({
      pathname: "/IngredientCropScreen",
      params: { uri: normalized },
    });
  };

  const allIngredients = Object.values(nutritionDB).flatMap((category) =>
    Object.entries(category).map(([name, data]) => ({
      name,
      ...data,
    })),
  );

  const fuse = new Fuse(allIngredients, {
    keys: ["name"],
    threshold: 0.4,
    ignoreLocation: true,
  });

  /* ============================================================
     CARICAMENTO RICETTA
  ============================================================ */

  useEffect(() => {
    const recipe = getRecipeById(id as string);
    if (!recipe) return;

    console.log("RECIPE LOADED IN EDIT:", recipe);

    setTitle(recipe.title);
    setCategory(recipe.category);
    setPrepTime(String(recipe.prepTime ?? ""));
    setCookTime(String(recipe.cookTime ?? ""));
    setServings(String(recipe.servings ?? ""));
    setMainImageUri(recipe.imageUri ?? null);

    // TAGS
    if (Array.isArray(recipe.tags)) setTags(recipe.tags);
    else if (typeof recipe.tags === "string") setTags(recipe.tags);

    // NOTE
    setNotesText(recipe.notes?.text ?? "");
    setNotesImage(recipe.notes?.image ?? null);

    /* INGREDIENTI → FlatItem */
    const flat: FlatItem[] = [];

    recipe.ingredients.forEach((group) => {
      if (group.id !== "ungrouped") {
        flat.push({
          id: group.id,
          type: "group",
          title: group.title,
          collapsed: false,
        });
      }

      group.items.forEach((ing) => {
        flat.push({
          id: ing.id,
          type: "ingredient",
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          groupId: group.id,
          linkedRecipeId: ing.linkedRecipeId ?? null,

          kcal: ing.kcal ?? 0,
          carbs: ing.carbs ?? 0,
          protein: ing.protein ?? 0,
          fat: ing.fat ?? 0,
        });
      });
    });

    setItems(flat);

    // INGREDIENTS + GROUPS separati
    setIngredients(
      flat.filter((i) => i.type === "ingredient") as IngredientFlat[],
    );
    setGroups(flat.filter((i) => i.type === "group") as GroupFlat[]);

    /* STEPS */
    setSteps(
      recipe.steps.map((s) => ({
        title: s.title,
        description: s.description,
        imageUri: s.imageUri ?? null,
        textImageUri: s.textImageUri ?? null,
        collapsed: false,
        actionsOpen: false,
      })),
    );
  }, [id]);

  useEffect(() => {
    setIngredients((prev) =>
      prev.map((i) => ({
        ...i,
        groupId:
          i.groupId === "" || i.groupId === null || i.groupId === "ungrouped"
            ? null
            : i.groupId,
      })),
    );
  }, []);

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 350 });

    slideUp.value = withTiming(1, {
      duration: 550,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, []);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(slideUp.value, [0, 1], [80, 0]),
      },
    ],
    opacity: slideUp.value,
  }));

  // ⭐ visibilità ingredienti + gruppi (identico ad ADD)
  const visibleItems = React.useMemo(() => {
    if (!ingredients || !groups) return [];

    // Ingredienti liberi
    const freeIngredients = ingredients.filter(
      (i) => !i.groupId || i.groupId === null || i.groupId === "",
    );

    // Gruppi
    const orderedGroups = [...groups];

    // Ordine finale identico ad ADD:
    // 1) ingredienti liberi
    // 2) gruppi
    return [...freeIngredients, ...orderedGroups];
  }, [ingredients, groups]);

  function applyNutrition(ingredient: IngredientFlat): IngredientFlat {
    const key = ingredient.name.trim().toLowerCase();
    const data = nutritionIndex[key];

    if (!data) return ingredient;

    const q = Number(ingredient.quantity) || 0;

    return {
      ...ingredient,
      kcal: (data.kcal * q) / 100,
      carbs: (data.carbs * q) / 100,
      protein: (data.protein * q) / 100,
      fat: (data.fat * q) / 100,
    };
  }

  function getSuggestions(query: string): string[] {
    if (!query.trim()) return [];

    const q = query.trim().toLowerCase();

    return Object.keys(nutritionIndex)
      .filter((key) => key.includes(q))
      .slice(0, 5); // max 5 suggerimenti
  }

  /* ============================================================
     FUNZIONI UPDATE
  ============================================================ */

  const updateIngredient = <K extends keyof IngredientFlat>(
    id: string,
    field: K,
    value: IngredientFlat[K],
  ) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    );
  };

  const updateIngredientObject = (id: string, updated: IngredientFlat) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updated } : i)),
    );
  };

  const updateIngredientField = (id: string, field: string, value: any) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    );
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const updateGroupTitle = (groupId: string, text: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, title: text } : g)),
    );
  };

  const toggleGroup = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, collapsed: !g.collapsed } : g,
      ),
    );
  };

  const ingredientsInGroup = (groupId: string) =>
    ingredients.filter((i) => i.groupId === groupId);

  /* ============================================================
     ORDINAMENTO INGREDIENTI
  ============================================================ */

  const moveInsideGroup = (
    groupId: string,
    ingredientId: string,
    direction: "up" | "down",
  ) => {
    const inside = ingredients.filter((i) => i.groupId === groupId);
    const outside = ingredients.filter((i) => i.groupId !== groupId);

    const idx = inside.findIndex((i) => i.id === ingredientId);
    if (idx === -1) return;

    if (direction === "up" && idx > 0) {
      [inside[idx - 1], inside[idx]] = [inside[idx], inside[idx - 1]];
    }

    if (direction === "down" && idx < inside.length - 1) {
      [inside[idx], inside[idx + 1]] = [inside[idx + 1], inside[idx]];
    }

    setIngredients([...outside, ...inside]);
  };

  const moveFreeIngredient = (id: string, direction: "up" | "down") => {
    const free = ingredients.filter((i) => i.groupId === null);
    const grouped = ingredients.filter((i) => i.groupId !== null);

    const idx = free.findIndex((i) => i.id === id);
    if (idx === -1) return;

    if (direction === "up" && idx > 0) {
      [free[idx - 1], free[idx]] = [free[idx], free[idx - 1]];
    }

    if (direction === "down" && idx < free.length - 1) {
      [free[idx], free[idx + 1]] = [free[idx + 1], free[idx]];
    }

    setIngredients([...grouped, ...free]);
  };

  const moveIngredientUp = (id: string) => {
    const ing = ingredients.find((i) => i.id === id);
    if (!ing) return;

    if (ing.groupId) moveInsideGroup(ing.groupId, id, "up");
    else moveFreeIngredient(id, "up");
  };

  const moveIngredientDown = (id: string) => {
    const ing = ingredients.find((i) => i.id === id);
    if (!ing) return;

    if (ing.groupId) moveInsideGroup(ing.groupId, id, "down");
    else moveFreeIngredient(id, "down");
  };

  const openRecipePicker = (realIndex: number) => {
    setSelectedIngredientIndex(realIndex);
    setIsPickerOpen(true);
  };

  const closeRecipePicker = () => {
    setIsPickerOpen(false);
  };

  const moveGroup = (groupId: string, direction: "up" | "down") => {
    setGroups((prev) => {
      const arr = [...prev];
      const idx = arr.findIndex((g) => g.id === groupId);
      if (idx === -1) return prev;

      if (direction === "up" && idx > 0) {
        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      }

      if (direction === "down" && idx < arr.length - 1) {
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      }

      return arr;
    });
  };

  const removeGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setIngredients((prev) =>
      prev.map((i) => (i.groupId === groupId ? { ...i, groupId: null } : i)),
    );
  };

  /* ============================================================
     GROUPING MODE
  ============================================================ */

  const toggleIngredientSelection = (id: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const createNewGroup = (title: string) => {
    if (!title.trim()) return;

    const newGroupId = uid();

    // 1️⃣ crea SEMPRE il gruppo
    setGroups((prev) => [
      ...prev,
      { id: newGroupId, type: "group", title, collapsed: false },
    ]);

    // 2️⃣ se ci sono ingredienti selezionati → assegnali
    if (selectedIngredients.length > 0) {
      setIngredients((prev) =>
        prev.map((i) =>
          selectedIngredients.includes(i.id)
            ? { ...i, groupId: newGroupId }
            : i,
        ),
      );
    }

    // 3️⃣ reset
    setSelectedIngredients([]);
    setGroupingMode(false);
  };

  const addIngredientsToGroup = (groupId: string, selectedIds: string[]) => {
    setIngredients((prev) =>
      prev.map((ing) =>
        selectedIds.includes(ing.id) ? { ...ing, groupId } : ing,
      ),
    );
  };

  const addIngredientToGroup = (groupId: string) => {
    const newIngredient: IngredientFlat = {
      id: uid(),
      type: "ingredient",
      name: "",
      quantity: "",
      unit: "",
      groupId,
      linkedRecipeId: null,
    };

    setIngredients((prev) => [...prev, newIngredient]);
  };

  /* ============================================================
     OCR INGREDIENTI
  ============================================================ */
  const chooseImageForIngredients = useChooseImageSource(async (croppedUri) => {
    setIngredientsPhoto(croppedUri);

    const text = await extractTextFromImage(croppedUri);
    parseIngredientsFromText(text);
  });

  const handleOCRIngredients = () => {
    chooseIngredientsPhoto();
  };

  function parseIngredientsFromText(text: string) {
    if (!text.trim()) return;

    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const parsed: IngredientFlat[] = [];

    for (const line of lines) {
      const { quantity, unit, name } = parseIngredientLine(line);

      parsed.push({
        id: uid(),
        type: "ingredient",
        name: name || line,
        quantity:
          quantity === "" || quantity === null || quantity === undefined
            ? ""
            : Number(quantity),

        unit: unit || "",
        groupId: null,
        linkedRecipeId: null,
      });
    }

    setIngredients((prev) => [...prev, ...parsed]);
  }

  /* ============================================================
     OCR GENERALE
  ============================================================ */

  const recognizeTextFromImage = async (uri: string) => {
    try {
      const result = await MlkitOcr.detectFromUri(uri);
      return result.map((b) => b.text).join("\n");
    } catch {
      return "";
    }
  };

  async function extractTextFromImage(uri: string): Promise<string> {
    try {
      const result = await recognizeTextFromImage(uri);
      return result || "";
    } catch (e) {
      console.log("Errore OCR:", e);
      return "";
    }
  }

  /* ============================================================
     STEP FUNCTIONS
  ============================================================ */

  const updateStepTitle = (index: number, text: string) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, title: text } : s)),
    );
  };

  const updateStepDescription = (index: number, text: string) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, description: text } : s)),
    );
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
      const arr = [...prev];
      if (index === arr.length - 1) return arr;
      [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
      return arr;
    });
  };

  const duplicateStep = (index: number) => {
    setSteps((prev) => {
      const arr = [...prev];
      const item = prev[index];

      const clone: StepForm = {
        title: item.title,
        description: item.description,
        imageUri: item.imageUri ?? null,
        textImageUri: null,
        collapsed: false,
        actionsOpen: false,
      };

      arr.splice(index + 1, 0, clone);
      return arr;
    });
  };

  /* ============================================================
     SALVA (EDIT)
  ============================================================ */

  const buildUpdatedRecipe = (baseId?: string): Recipe => {
    const recipe = getRecipeById(id as string);
    if (!recipe) throw new Error("Recipe not found");

    // ⭐ Ingredienti liberi
    const freeIngredients = ingredients
      .filter((i) => !i.groupId && i.name.trim() !== "")
      .map((ing) => ({
        id: ing.id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        linkedRecipeId: ing.linkedRecipeId ?? null,
        kcal: ing.kcal ?? 0,
        carbs: ing.carbs ?? 0,
        protein: ing.protein ?? 0,
        fat: ing.fat ?? 0,
      }));

    // ⭐ Gruppi veri
    const grouped = groups
      .map((g) => ({
        id: g.id,
        title: g.title,
        items: ingredients
          .filter((i) => i.groupId === g.id && i.name.trim() !== "")
          .map((ing) => ({
            id: ing.id,
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            linkedRecipeId: ing.linkedRecipeId ?? null,
            kcal: ing.kcal ?? 0,
            carbs: ing.carbs ?? 0,
            protein: ing.protein ?? 0,
            fat: ing.fat ?? 0,
          })),
      }))
      .filter((g) => g.items.length > 0);

    const finalIngredients = [
      {
        id: "ungrouped",
        title: "Ingredienti",
        items: freeIngredients,
      },
      ...grouped,
    ];

    const cleanedSteps = steps
      .filter(
        (s) =>
          s.title.trim() ||
          s.description.trim() ||
          s.imageUri ||
          s.textImageUri,
      )
      .map((s, index) => ({
        id: recipe.steps[index]?.id ?? `step-${Date.now()}-${index}`,
        title: s.title,
        description: s.description,
        imageUri: s.imageUri,
        textImageUri: s.textImageUri,
        checked: false,
        collapsed: false,
      }));

    return {
      ...recipe,
      id: baseId ?? recipe.id,
      title: title.trim(),
      category: category === "all" ? "altro" : category,
      prepTime: prepTime.trim(),
      cookTime: cookTime.trim(),
      servings: parseInt(servings) || 1,
      imageUri: mainImageUri || undefined,
      tags,
      ingredients: finalIngredients,
      steps: cleanedSteps,
      notes: {
        text: notesText.trim() || undefined,
        image: notesImage || undefined,
        mode: "text",
      },
    };
  };

  const handleOverwrite = () => {
    try {
      const updated = buildUpdatedRecipe();
      updateRecipe(updated);
      Alert.alert("Successo", "Ricetta aggiornata!");
      router.back();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAsNew = () => {
    try {
      const newId = Date.now().toString();
      const newRecipe = buildUpdatedRecipe(newId);

      addRecipe(newRecipe);
      Alert.alert("Successo", "Ricetta salvata come nuova!");
      router.push(`/recipe/${newId}`);
    } catch (e) {
      console.error(e);
    }
  };

  const noIngredients =
    ingredients.length === 0 && groups.length === 0 && !ingredientsPhoto;

  const opacity = useSharedValue(1);

  const pulse = useSharedValue(1);
  const pulseColor = useSharedValue(0);

  useEffect(() => {
    if (noIngredients) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 400 }),
          withTiming(1, { duration: 400 }),
        ),
        -1,
        false,
      );

      pulseColor.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 }),
        ),
        -1,
        false,
      );
    } else {
      pulse.value = withTiming(1, { duration: 300 });
      pulseColor.value = withTiming(0, { duration: 300 });
    }
  }, [noIngredients]);

  const pulseStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      pulseColor.value,
      [0, 1],
      [COLORS.textLight, COLORS.secondary], // da grigio → rosa
    );

    return {
      transform: [{ scale: pulse.value }],
      opacity: pulse.value < 1.05 ? 1 : 0.8,
      color,
    };
  });

  const getStepActions = (index: number) => [
    {
      label: "OCR",
      icon: "text-outline" as IoniconName,
      onPress: () => chooseOCRImage(index),
    },
    {
      label: "Duplica",
      icon: "copy-outline" as IoniconName,
      onPress: () => duplicateStep(index),
    },
    {
      label: "Su",
      icon: "caret-up-outline" as IoniconName,
      onPress: () => moveStepUp(index),
    },
    {
      label: "Giù",
      icon: "caret-down-outline" as IoniconName,
      onPress: () => moveStepDown(index),
    },
    {
      label: "Elimina",
      icon: "trash-outline" as IoniconName,
      danger: true,
      onPress: () => removeStep(index),
    },
  ];

  const renderStepAction = (index: number, a: any) => (
    <TouchableOpacity
      key={a.label}
      style={[styles.actionExpanded, a.danger && styles.actionExpandedDanger]}
      onPress={() => {
        a.onPress();
        setOpenStepOverlay(null);
      }}
    >
      <Ionicons
        name={a.icon}
        size={20}
        color={a.danger ? "#cb0047" : COLORS.primary}
        style={{ marginBottom: 4 }}
      />
      <Text
        style={[styles.actionExpandedText, a.danger && { color: "#cb0047" }]}
      >
        {a.label}
      </Text>
    </TouchableOpacity>
  );

  const renderStepActionsCollapsed = (index: number) => {
    const actions = getStepActions(index);

    return actions.map((a, i) => (
      <React.Fragment key={i}>
        <TouchableOpacity
          style={styles.stepActionBtnCollapsed}
          onPress={() => {
            a.onPress();
            setOpenStepOverlay(null);
          }}
        >
          <Ionicons
            name={a.icon}
            size={20}
            color={a.danger ? "#cb0047" : COLORS.secondary}
          />
          <Text
            style={[
              styles.stepActionLabelCollapsed,
              a.danger && { color: "#cb0047" },
            ]}
          >
            {a.label}
          </Text>
        </TouchableOpacity>

        {i < actions.length - 1 && <View style={styles.stepDividerVertical} />}
      </React.Fragment>
    ));
  };

  const renderStepActionsExpanded = (index: number) => {
    const actions = getStepActions(index);

    return (
      <View style={styles.expandedGrid}>
        {/* ⭐ RIGA 1 */}
        <View style={styles.expandedRow}>
          {renderStepAction(index, actions[0])}
          <View style={styles.stepDividerVerticalTop} />
          {renderStepAction(index, actions[1])}
        </View>

        {/* ⭐ RIGA 2 */}
        <View style={styles.expandedRow}>
          {renderStepAction(index, actions[2])}
          <View style={styles.stepDividerVerticalTop} />
          {renderStepAction(index, actions[3])}
        </View>

        {/* ⭐ RIGA 3 (solo Elimina → centrato) */}
        <View style={[styles.expandedRow, { borderColor: "white" }]}>
          {renderStepAction(index, actions[4])}
        </View>
      </View>
    );
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <KeyboardAwareScrollView
            enableOnAndroid={true}
            extraScrollHeight={80}
            extraHeight={Platform.OS === "ios" ? 120 : 80}
            keyboardOpeningTime={0}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingBottom: 10,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* ============================================================
             HERO
          ============================================================ */}
            <ImageBackground
              source={require("../../assets/images/sfondo.png")}
              style={styles.bg}
              resizeMode="cover"
            >
              <Animated.View style={[styles.heroContainer, heroStyle]}>
                <TouchableOpacity
                  onPress={() => chooseImage()}
                  style={{ height: 300 }}
                >
                  {mainImageUri ? (
                    <>
                      <Image
                        source={{ uri: mainImageUri }}
                        style={styles.heroImage}
                      />
                      <TouchableOpacity
                        onPress={() => setMainImageUri(null)}
                        style={styles.deleteMainSmallButton}
                      >
                        <Ionicons name="close" size={20} color="#cb0047" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={styles.heroPlaceholder}>
                      <Ionicons
                        name="camera-outline"
                        size={60}
                        color={COLORS.secondary}
                      />
                      <Text style={styles.heroPlaceholderText}>
                        Tocca per aggiungere immagine
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </ImageBackground>

            {/* ============================================================
             CARD ESPANDIBILE
          ============================================================ */}
            <Animated.View style={[styles.cardExpanded, cardStyle]}>
              <View>
                <View style={styles.header}>
                  <Text variant="title" style={styles.title}>
                    Modifica ricetta
                  </Text>
                </View>

                {/* TITOLO */}
                <Input
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Nome della ricetta"
                  multiline
                  style={styles.titleInput}
                />

                {/* CATEGORIA */}
                <View
                  style={{
                    marginBottom: 25,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: COLORS.primary }}>•••</Text>
                  <CategoryDropdown
                    categories={CATEGORY_ITEMS}
                    selected={category}
                    onSelect={setCategory}
                  />
                  <Text style={{ color: COLORS.primary }}>•••</Text>
                </View>

                {/* ⭐ INFO IN RIGA */}
                <View style={styles.infoColumn}>
                  <View style={styles.labelRow}>
                    <Ionicons
                      name="time-outline"
                      size={22}
                      color={COLORS.primary}
                      style={{ marginBottom: 17 }}
                    />

                    <Text style={styles.label}>Preparazione:</Text>
                    <Input
                      placeholder="20 minuti"
                      value={prepTime}
                      onChangeText={setPrepTime}
                      style={styles.infoInput}
                    />
                  </View>
                </View>

                <View style={styles.infoColumn}>
                  <View style={styles.labelRow}>
                    <Ionicons
                      name="flame-outline"
                      size={22}
                      color={COLORS.primary}
                      style={{ marginBottom: 17 }}
                    />

                    <Text style={styles.label}>Cottura:</Text>
                    <Input
                      placeholder="45 minuti"
                      value={cookTime}
                      onChangeText={setCookTime}
                      style={styles.infoInput}
                    />
                  </View>
                </View>

                <View style={styles.infoColumn}>
                  <View style={styles.labelRow}>
                    <Ionicons
                      name="people-outline"
                      size={22}
                      color={COLORS.primary}
                      style={{ marginBottom: 17 }}
                    />

                    <Text style={styles.label}>Porzioni:</Text>
                    <Input
                      placeholder="4"
                      value={servings}
                      onChangeText={setServings}
                      style={[styles.infoInput, { minWidth: 50 }]}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* ⭐ TAGS */}
                <Text
                  variant="heading"
                  style={[styles.sectionTitle, { marginBottom: 20 }]}
                >
                  Tags
                </Text>
                <View style={styles.tagsContainer}>
                  <Ionicons
                    name="pricetag-outline" // ⭐ la più simile a un hashtag elegante
                    size={20}
                    color={COLORS.primary}
                    style={{ marginBottom: 10 }}
                  />
                  <Input
                    placeholder="Piatto Estivo"
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={() => {
                      if (tagInput.trim()) {
                        setTags((prev) => [...prev, tagInput.trim()]);
                        setTagInput("");
                      }
                    }}
                    style={styles.tagInput}
                  />

                  <View style={styles.tagsList}>
                    {tags.map((tag, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.tag}
                        onPress={() =>
                          setTags((prev) => prev.filter((t) => t !== tag))
                        }
                      >
                        <Text bold style={styles.tagText}>
                          #{tag} ✕
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* ⭐ NOTE */}
                <View style={styles.notesInline}>
                  <Text variant="heading" style={styles.sectionTitle}>
                    Note e Curiosità
                  </Text>

                  <Input
                    placeholder="Aggiungi qui info e curiosità sulla ricetta..."
                    value={notesText}
                    onChangeText={setNotesText}
                    multiline
                    style={styles.notesInput}
                  />

                  {notesText.length > 0 && (
                    <TouchableOpacity
                      style={[styles.deleteSmallButton, { top: 50 }]}
                      onPress={() => setNotesText("")}
                    >
                      <Ionicons name="close" size={15} color="#cb0047" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* ============================================================
             TABS
             ============================================================ */}
                <View style={styles.tabsContainer}>
                  <TouchableOpacity
                    onPress={() => setActiveTab("ingredienti")}
                    style={[
                      styles.tab,
                      activeTab === "ingredienti" && styles.tabActive,
                    ]}
                  >
                    <Text
                      bold
                      style={[
                        styles.tabLabel,
                        activeTab === "ingredienti" && styles.tabLabelActive,
                      ]}
                    >
                      Ingredienti
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setActiveTab("procedimento")}
                    style={[
                      styles.tab,
                      activeTab === "procedimento" && styles.tabActive,
                    ]}
                  >
                    <Text
                      bold
                      style={[
                        styles.tabLabel,
                        activeTab === "procedimento" && styles.tabLabelActive,
                      ]}
                    >
                      Procedimento
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* ============================================================
                  INGREDIENTI — STILE APPLE NOTES
               ============================================================ */}
                {activeTab === "ingredienti" && (
                  <View style={styles.sectionWrapper}>
                    {/* ===========================
                      FOTO OCR
                    ============================ */}
                    {ingredientsPhoto && cropSize && (
                      <View style={{ width: "100%", marginBottom: 20 }}>
                        <TouchableOpacity
                          onPress={() => setIngredientsPhoto(null)}
                          style={styles.deleteSmallButton}
                        >
                          <Ionicons name="close" size={15} color="#cb0047" />
                        </TouchableOpacity>

                        <View style={{ alignItems: "center" }}>
                          <ExpoImage
                            source={{ uri: ingredientsPhoto }}
                            style={{
                              width: displayW,
                              height: displayH,
                              borderRadius: 12,
                              backgroundColor: "#eee",
                            }}
                            contentFit="cover"
                            // ⭐ cover qui va bene perché l'immagine è già ritagliata e proporzionata
                          />
                        </View>
                      </View>
                    )}

                    {noIngredients && (
                      <View style={styles.emptyIngredientsWrapper}>
                        <Text style={styles.emptyIngredientsText}>
                          Nessun ingrediente ancora
                        </Text>

                        <Text style={styles.emptyIngredientsSub}>
                          Tocca il pulsante in basso a destra per aggiungerne
                          uno
                        </Text>
                        <Ionicons
                          name="nutrition-outline"
                          size={60}
                          color={COLORS.textLight}
                          style={{ marginTop: 10, opacity: 0.7 }}
                        />
                      </View>
                    )}

                    {/* ===========================
                        LISTA INGREDIENTI
                       ============================ */}
                    {visibleItems.map((item) => {
                      /* ===========================
                             GRUPPO
                        ============================ */
                      if (item.type === "group") {
                        const groupIngredients = ingredientsInGroup(item.id);

                        return (
                          <ImageBackground
                            source={require("../../assets/images/ring.png")}
                            resizeMode="cover"
                            style={styles.groupCard}
                          >
                            <View
                              key={item.id}
                              style={{ paddingLeft: 20, paddingRight: 10 }}
                            >
                              {/* HEADER GRUPPO */}
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 0,
                                }}
                              >
                                {/* ELLIPSIS */}
                                {!groupingMode && (
                                  <TouchableOpacity
                                    onPress={() =>
                                      setOpenActions(
                                        openActions === item.id
                                          ? null
                                          : item.id,
                                      )
                                    }
                                    style={[styles.rowEllipsisBtn]}
                                  >
                                    <Ionicons
                                      name="ellipsis-vertical"
                                      size={20}
                                      color={COLORS.secondary}
                                      style={{
                                        marginBottom: 0,
                                        marginLeft: 0,
                                      }}
                                    />
                                  </TouchableOpacity>
                                )}

                                {/* TITOLO GRUPPO */}
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "flex-start",
                                    justifyContent: "flex-start",
                                    gap: 2,
                                    flex: 1,
                                  }}
                                >
                                  <Input
                                    value={
                                      item.collapsed
                                        ? `${item.title} (${groupIngredients.length})`
                                        : item.title
                                    }
                                    onChangeText={(t) =>
                                      updateGroupTitle(item.id, t)
                                    }
                                    multiline
                                    style={{
                                      flex: 1,
                                      fontSize: 16,
                                      fontFamily: "Outfit-SemiBold",
                                      color: COLORS.secondary,
                                      backgroundColor: "transparent",
                                      textAlign: "center",
                                      borderColor: "white",
                                    }}
                                  />

                                  <TouchableOpacity
                                    onPress={() => toggleGroup(item.id)}
                                  >
                                    <Ionicons
                                      name={
                                        item.collapsed
                                          ? "caret-down-outline"
                                          : "caret-up-outline"
                                      }
                                      size={20}
                                      color={COLORS.secondary}
                                      style={{ marginTop: 20 }}
                                    />
                                  </TouchableOpacity>
                                </View>
                              </View>

                              {/* MENU GRUPPO */}
                              {openActions === item.id && (
                                <Animated.View
                                  entering={FadeInLeft.duration(180).damping(
                                    18,
                                  )}
                                  exiting={FadeOutRight.duration(150)}
                                  style={styles.groupActionsOverlay}
                                >
                                  {/* X CHIUSURA */}
                                  <TouchableOpacity
                                    onPress={() => setOpenActions(null)}
                                    style={styles.groupActionsCloseBtn}
                                  >
                                    <Ionicons
                                      name="close"
                                      size={22}
                                      color={COLORS.secondary}
                                    />
                                  </TouchableOpacity>

                                  {/* LOGICA: orizzontale se collassato o <=1 ingredienti */}
                                  {item.collapsed ||
                                  groupIngredients.length <= 1 ? (
                                    /* ⭐ LAYOUT ORIZZONTALE */
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        gap: 5,
                                        marginLeft: 40,
                                      }}
                                    >
                                      {/* SU */}
                                      <TouchableOpacity
                                        style={[
                                          styles.groupActionBtn,
                                          { width: 50 },
                                        ]}
                                        onPress={() => {
                                          moveGroup(item.id, "up");
                                          setOpenActions(null);
                                        }}
                                      >
                                        <Ionicons
                                          name="caret-up-outline"
                                          size={22}
                                          color={COLORS.secondary}
                                        />
                                        <Text
                                          style={styles.ingredientActionLabel}
                                        >
                                          Su
                                        </Text>
                                      </TouchableOpacity>

                                      <View
                                        style={styles.ingredientActionDivider}
                                      />

                                      {/* GIÙ */}
                                      <TouchableOpacity
                                        style={[
                                          styles.groupActionBtn,
                                          { width: 50 },
                                        ]}
                                        onPress={() => {
                                          moveGroup(item.id, "down");
                                          setOpenActions(null);
                                        }}
                                      >
                                        <Ionicons
                                          name="caret-down-outline"
                                          size={22}
                                          color={COLORS.secondary}
                                        />
                                        <Text
                                          style={styles.ingredientActionLabel}
                                        >
                                          Giù
                                        </Text>
                                      </TouchableOpacity>

                                      <View
                                        style={styles.ingredientActionDivider}
                                      />

                                      {/* ELIMINA */}
                                      <TouchableOpacity
                                        style={styles.groupActionBtn}
                                        onPress={() => {
                                          removeGroup(item.id);
                                          setOpenActions(null);
                                        }}
                                      >
                                        <Ionicons
                                          name="trash-outline"
                                          size={22}
                                          color="#cb0047"
                                        />
                                        <Text
                                          style={[
                                            styles.ingredientActionLabel,
                                            { color: "#cb0047" },
                                          ]}
                                        >
                                          Elimina
                                        </Text>
                                      </TouchableOpacity>
                                      <View
                                        style={styles.ingredientActionDivider}
                                      />

                                      {/* AGGIUNGI */}
                                      <TouchableOpacity
                                        style={styles.groupActionBtn}
                                        onPress={() => {
                                          addIngredientToGroup(item.id);
                                          setOpenActions(null);
                                        }}
                                      >
                                        <Ionicons
                                          name="add-circle-outline"
                                          size={22}
                                          color={COLORS.secondary}
                                        />
                                        <Text
                                          style={styles.ingredientActionLabel}
                                        >
                                          Ingrediente
                                        </Text>
                                      </TouchableOpacity>
                                    </View>
                                  ) : (
                                    /* ⭐ LAYOUT A DUE RIGHE */
                                    <>
                                      {/* RIGA 1 */}
                                      <View style={styles.groupActionsRow}>
                                        <TouchableOpacity
                                          style={styles.groupActionBtn}
                                          onPress={() => {
                                            moveGroup(item.id, "up");
                                            setOpenActions(null);
                                          }}
                                        >
                                          <Ionicons
                                            name="caret-up-outline"
                                            size={22}
                                            color={COLORS.secondary}
                                          />
                                          <Text
                                            style={styles.ingredientActionLabel}
                                          >
                                            Su
                                          </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                          style={styles.groupActionBtn}
                                          onPress={() => {
                                            moveGroup(item.id, "down");
                                            setOpenActions(null);
                                          }}
                                        >
                                          <Ionicons
                                            name="caret-down-outline"
                                            size={22}
                                            color={COLORS.secondary}
                                          />
                                          <Text
                                            style={styles.ingredientActionLabel}
                                          >
                                            Giù
                                          </Text>
                                        </TouchableOpacity>
                                      </View>

                                      {/* DIVISORE ORIZZONTALE */}
                                      <View
                                        style={styles.groupDividerHorizontal}
                                      />

                                      {/* RIGA 2 */}
                                      <View style={styles.groupActionsRow}>
                                        <TouchableOpacity
                                          style={styles.groupActionBtn}
                                          onPress={() => {
                                            removeGroup(item.id);
                                            setOpenActions(null);
                                          }}
                                        >
                                          <Ionicons
                                            name="trash-outline"
                                            size={22}
                                            color="#cb0047"
                                          />
                                          <Text
                                            style={[
                                              styles.ingredientActionLabel,
                                              { color: "#cb0047" },
                                            ]}
                                          >
                                            Elimina
                                          </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                          style={styles.groupActionBtn}
                                          onPress={() => {
                                            addIngredientToGroup(item.id);
                                            setOpenActions(null);
                                          }}
                                        >
                                          <Ionicons
                                            name="add-circle-outline"
                                            size={22}
                                            color={COLORS.secondary}
                                          />
                                          <Text
                                            style={styles.ingredientActionLabel}
                                          >
                                            Ingrediente
                                          </Text>
                                        </TouchableOpacity>
                                      </View>

                                      {/* DIVISORE VERTICALE */}
                                      <View
                                        style={styles.groupDividerVertical}
                                      />
                                    </>
                                  )}
                                </Animated.View>
                              )}

                              {/* INGREDIENTI DEL GRUPPO */}
                              {!item.collapsed &&
                                groupIngredients.map((ing) => {
                                  const linkedRecipe = ing.linkedRecipeId
                                    ? recipes.find(
                                        (r) => r.id === ing.linkedRecipeId,
                                      )
                                    : null;

                                  return (
                                    <View
                                      key={ing.id}
                                      style={{ marginBottom: 5 }}
                                    >
                                      <View
                                        style={[
                                          styles.ingredientRow,
                                          groupingMode &&
                                          selectedIngredients.includes(ing.id)
                                            ? styles.ingredientSelected
                                            : null,
                                        ]}
                                      >
                                        {/* CHECKBOX */}
                                        {groupingMode && (
                                          <TouchableOpacity
                                            onPress={() =>
                                              toggleIngredientSelection(ing.id)
                                            }
                                            style={styles.checkboxWrapper}
                                          >
                                            <Ionicons
                                              name={
                                                selectedIngredients.includes(
                                                  ing.id,
                                                )
                                                  ? "checkbox"
                                                  : "square-outline"
                                              }
                                              size={22}
                                              color={COLORS.secondary}
                                            />
                                          </TouchableOpacity>
                                        )}

                                        {/* INPUT NOME + SUGGERIMENTI */}
                                        <View style={{ flex: 1 }}>
                                          <Input
                                            value={ing.name}
                                            onChangeText={(t) => {
                                              setActiveSuggestionFor(ing.id);

                                              const updated = applyNutrition({
                                                ...ing,
                                                name: t,
                                              });

                                              updateIngredientObject(
                                                ing.id,
                                                updated,
                                              );

                                              if (t.length > 1) {
                                                const results = fuse
                                                  .search(t)
                                                  .map((r) => r.item);
                                                setSuggestions(
                                                  results.slice(0, 20),
                                                );
                                              } else {
                                                setSuggestions([]);
                                              }
                                            }}
                                            placeholder="Ingrediente"
                                            multiline
                                            style={{ borderColor: "white" }}
                                          />
                                        </View>

                                        {/* INPUT QUANTITÀ */}
                                        <Input
                                          value={String(ing.quantity ?? "")}
                                          onChangeText={(t) => {
                                            const value =
                                              t === "" ? "" : Number(t);

                                            if (ing.type !== "ingredient") {
                                              updateIngredient(
                                                item.id,
                                                "quantity",
                                                value,
                                              );
                                              return;
                                            }

                                            const key = ing.name
                                              .trim()
                                              .toLowerCase();
                                            const data = nutritionIndex[key];

                                            if (!data) {
                                              updateIngredient(
                                                ing.id,
                                                "quantity",
                                                value,
                                              );
                                              return;
                                            }

                                            updateIngredientObject(ing.id, {
                                              ...ing,
                                              quantity: value,
                                              kcal:
                                                (data.kcal * (value || 0)) /
                                                100,
                                              carbs:
                                                (data.carbs * (value || 0)) /
                                                100,
                                              protein:
                                                (data.protein * (value || 0)) /
                                                100,
                                              fat:
                                                (data.fat * (value || 0)) / 100,
                                            });
                                          }}
                                          placeholder="0"
                                          multiline
                                          style={{
                                            width: 80,
                                            textAlign: "center",
                                            borderColor: "white",
                                          }}
                                        />

                                        {/* INPUT UNITÀ */}
                                        <Input
                                          value={ing.unit}
                                          onChangeText={(t) =>
                                            updateIngredient(ing.id, "unit", t)
                                          }
                                          placeholder="g"
                                          multiline
                                          style={{
                                            width: 100,
                                            textAlign: "center",
                                            borderColor: "white",
                                          }}
                                        />

                                        {/* ELLIPSIS */}
                                        {!groupingMode && (
                                          <TouchableOpacity
                                            onPress={() =>
                                              setOpenActions(
                                                openActions === ing.id
                                                  ? null
                                                  : ing.id,
                                              )
                                            }
                                            style={styles.rowEllipsisBtn}
                                          >
                                            <Ionicons
                                              name={
                                                openActions === ing.id
                                                  ? "close"
                                                  : "ellipsis-vertical"
                                              }
                                              size={20}
                                              color={COLORS.secondary}
                                            />
                                          </TouchableOpacity>
                                        )}
                                      </View>

                                      <View
                                        style={{
                                          height: 1,
                                          backgroundColor: "#f1f1f1",
                                        }}
                                      ></View>

                                      {/* SUGGERIMENTI SOLO PER QUESTO INGREDIENTE */}
                                      {activeSuggestionFor === ing.id &&
                                        suggestions.length > 0 && (
                                          <View
                                            style={{
                                              backgroundColor: "#fff",
                                              borderRadius: 6,
                                              marginTop: -10,
                                              marginHorizontal: 10,
                                              paddingVertical: 4,
                                              elevation: 3,
                                            }}
                                          >
                                            {suggestions.map((s) => (
                                              <TouchableOpacity
                                                key={s.name}
                                                onPress={() => {
                                                  const data =
                                                    nutritionIndex[s.name];

                                                  if (ing.type !== "ingredient")
                                                    return;

                                                  const q =
                                                    Number(ing.quantity) || 0;

                                                  updateIngredientObject(
                                                    ing.id,
                                                    {
                                                      ...ing,
                                                      name: s.name,
                                                      kcal: (s.kcal * q) / 100,
                                                      carbs:
                                                        (s.carbs * q) / 100,
                                                      protein:
                                                        (s.protein * q) / 100,
                                                      fat: (s.fat * q) / 100,
                                                    },
                                                  );

                                                  setSuggestions([]);
                                                  setActiveSuggestionFor(null);
                                                }}
                                                style={{ padding: 8 }}
                                              >
                                                <Text>{s.name}</Text>
                                              </TouchableOpacity>
                                            ))}
                                          </View>
                                        )}

                                      {/* SPILLETTA */}
                                      {linkedRecipe && (
                                        <TouchableOpacity
                                          onPress={() =>
                                            router.push(
                                              `/recipe/${linkedRecipe.id}`,
                                            )
                                          }
                                          style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            alignSelf: "flex-start",
                                            backgroundColor: "#eef3ff",
                                            paddingHorizontal: 10,
                                            paddingVertical: 0,
                                            borderRadius: 12,
                                            marginTop: -20,
                                            marginLeft: 30,
                                            marginBottom: 10,
                                          }}
                                        >
                                          <Ionicons
                                            name="link-outline"
                                            size={16}
                                            color={COLORS.primary}
                                          />
                                          <Text
                                            style={{
                                              marginLeft: 6,
                                              color: COLORS.primary,
                                              fontSize: 11,
                                              fontWeight: "500",
                                            }}
                                          >
                                            {linkedRecipe.title}
                                          </Text>
                                        </TouchableOpacity>
                                      )}

                                      {/* MENU INGREDIENTE */}
                                      {openActions === ing.id && (
                                        <Animated.View
                                          entering={FadeInRight.duration(
                                            180,
                                          ).damping(18)}
                                          exiting={FadeOutLeft.duration(150)}
                                          style={[
                                            styles.ingredientActionsOverlay,
                                            {
                                              marginLeft: 20,
                                              marginBottom: 5,
                                            },
                                          ]}
                                        >
                                          {/* COLLEGA */}
                                          {!ing.linkedRecipeId ? (
                                            <TouchableOpacity
                                              style={styles.ingredientActionBtn}
                                              onPress={() => {
                                                const realIndex =
                                                  ingredients.findIndex(
                                                    (i) => i.id === ing.id,
                                                  );
                                                if (realIndex !== -1)
                                                  openRecipePicker(realIndex);
                                                setOpenActions(null);
                                              }}
                                            >
                                              <Ionicons
                                                name="link-outline"
                                                size={20}
                                                color={COLORS.secondary}
                                              />
                                              <Text
                                                style={
                                                  styles.ingredientActionLabel
                                                }
                                              >
                                                Collega
                                              </Text>
                                            </TouchableOpacity>
                                          ) : (
                                            <TouchableOpacity
                                              style={styles.ingredientActionBtn}
                                              onPress={() => {
                                                updateIngredientField(
                                                  ing.id,
                                                  "linkedRecipeId",
                                                  null,
                                                );
                                                setOpenActions(null);
                                              }}
                                            >
                                              <Ionicons
                                                name="unlink-outline"
                                                size={20}
                                                color="#cb0047"
                                              />
                                              <Text
                                                style={[
                                                  styles.ingredientActionLabel,
                                                  { color: "#cb0047" },
                                                ]}
                                              >
                                                Rimuovi link
                                              </Text>
                                            </TouchableOpacity>
                                          )}

                                          <View
                                            style={
                                              styles.ingredientActionDivider
                                            }
                                          />

                                          {/* ELIMINA */}
                                          <TouchableOpacity
                                            style={styles.ingredientActionBtn}
                                            onPress={() => {
                                              removeIngredient(ing.id);
                                              setOpenActions(null);
                                            }}
                                          >
                                            <Ionicons
                                              name="trash-outline"
                                              size={20}
                                              color="#cb0047"
                                            />
                                            <Text
                                              style={[
                                                styles.ingredientActionLabel,
                                                { color: "#cb0047" },
                                              ]}
                                            >
                                              Elimina
                                            </Text>
                                          </TouchableOpacity>

                                          <View
                                            style={
                                              styles.ingredientActionDivider
                                            }
                                          />

                                          {/* SU */}
                                          <TouchableOpacity
                                            style={styles.ingredientActionBtn}
                                            onPress={() => {
                                              moveIngredientUp(ing.id);
                                              setOpenActions(null);
                                            }}
                                          >
                                            <Ionicons
                                              name="caret-up-outline"
                                              size={20}
                                              color={COLORS.secondary}
                                            />
                                            <Text
                                              style={
                                                styles.ingredientActionLabel
                                              }
                                            >
                                              Su
                                            </Text>
                                          </TouchableOpacity>

                                          <View
                                            style={
                                              styles.ingredientActionDivider
                                            }
                                          />

                                          {/* GIÙ */}
                                          <TouchableOpacity
                                            style={styles.ingredientActionBtn}
                                            onPress={() => {
                                              moveIngredientDown(ing.id);
                                              setOpenActions(null);
                                            }}
                                          >
                                            <Ionicons
                                              name="caret-down-outline"
                                              size={20}
                                              color={COLORS.secondary}
                                            />
                                            <Text
                                              style={
                                                styles.ingredientActionLabel
                                              }
                                            >
                                              Giù
                                            </Text>
                                          </TouchableOpacity>
                                        </Animated.View>
                                      )}
                                    </View>
                                  );
                                })}
                            </View>
                          </ImageBackground>
                        );
                      }

                      /* ===========================
                       INGREDIENTE LIBERO
                      ============================ */
                      if (item.type === "ingredient") {
                        const linkedRecipe = item.linkedRecipeId
                          ? recipes.find((r) => r.id === item.linkedRecipeId)
                          : null;

                        return (
                          <View
                            key={item.id}
                            style={{
                              paddingTop: 10,
                              backgroundColor: "white",
                              justifyContent: "center",
                              marginLeft: 0,
                              marginRight: -10,
                            }}
                          >
                            <View
                              style={[
                                styles.ingredientRow,
                                groupingMode &&
                                selectedIngredients.includes(item.id)
                                  ? styles.ingredientSelected
                                  : null,
                              ]}
                            >
                              {/* CHECKBOX */}
                              {groupingMode && (
                                <TouchableOpacity
                                  onPress={() =>
                                    toggleIngredientSelection(item.id)
                                  }
                                  style={styles.checkboxWrapper}
                                >
                                  <Ionicons
                                    name={
                                      selectedIngredients.includes(item.id)
                                        ? "checkbox"
                                        : "square-outline"
                                    }
                                    size={22}
                                    color={COLORS.secondary}
                                  />
                                </TouchableOpacity>
                              )}

                              {/* INPUT NOME */}
                              <View style={{ flex: 1 }}>
                                <Input
                                  value={item.name}
                                  onChangeText={(t) => {
                                    setActiveSuggestionFor(item.id);

                                    const updated = applyNutrition({
                                      ...item,
                                      name: t,
                                    });

                                    updateIngredientObject(item.id, updated);

                                    if (t.length > 1) {
                                      const results = fuse
                                        .search(t)
                                        .map((r) => r.item);
                                      setSuggestions(results.slice(0, 20));
                                    } else {
                                      setSuggestions([]);
                                    }
                                  }}
                                  placeholder="Ingrediente"
                                  multiline
                                  style={{ borderColor: "white" }}
                                />
                              </View>

                              {/* INPUT QUANTITÀ */}
                              <Input
                                value={String(item.quantity ?? "")}
                                onChangeText={(t) => {
                                  const value = t === "" ? "" : Number(t);

                                  if (item.type !== "ingredient") {
                                    return;
                                  }

                                  // da qui in poi item è IngredientFlat
                                  const key = item.name.trim().toLowerCase();
                                  const data = nutritionIndex[key];

                                  if (!data) {
                                    updateIngredient(
                                      item.id,
                                      "quantity",
                                      value,
                                    );
                                    return;
                                  }

                                  updateIngredientObject(item.id, {
                                    ...item,
                                    quantity: value,
                                    kcal: (data.kcal * (value || 0)) / 100,
                                    carbs: (data.carbs * (value || 0)) / 100,
                                    protein:
                                      (data.protein * (value || 0)) / 100,
                                    fat: (data.fat * (value || 0)) / 100,
                                  });
                                }}
                                placeholder="0"
                                multiline
                                style={{
                                  width: 70,
                                  textAlign: "center",
                                  borderColor: "white",
                                }}
                              />

                              {/* INPUT UNITÀ */}
                              <Input
                                value={item.unit}
                                onChangeText={(t) =>
                                  updateIngredient(item.id, "unit", t)
                                }
                                placeholder="g"
                                multiline
                                style={{
                                  width: 100,
                                  textAlign: "center",
                                  borderColor: "white",
                                }}
                              />

                              {/* ELLIPSIS */}
                              {!groupingMode && (
                                <TouchableOpacity
                                  onPress={() =>
                                    setOpenActions(
                                      openActions === item.id ? null : item.id,
                                    )
                                  }
                                  style={styles.rowEllipsisBtn}
                                >
                                  <Ionicons
                                    name={
                                      openActions === item.id
                                        ? "close"
                                        : "ellipsis-vertical"
                                    }
                                    size={20}
                                    color={COLORS.secondary}
                                  />
                                </TouchableOpacity>
                              )}
                            </View>
                            <View
                              style={{
                                height: 1,
                                backgroundColor: "#f1f1f1",
                                alignItems: "center",
                              }}
                            ></View>

                            {/* ⭐ SUGGERIMENTI IDENTICI AD ADD */}
                            {activeSuggestionFor === item.id &&
                              suggestions.length > 0 && (
                                <View
                                  style={{
                                    backgroundColor: "#fff",
                                    borderRadius: 6,
                                    marginTop: -10,
                                    marginHorizontal: 10,
                                    paddingVertical: 4,
                                    elevation: 3,
                                  }}
                                >
                                  {suggestions.map((s) => (
                                    <TouchableOpacity
                                      key={s.name}
                                      onPress={() => {
                                        const data = nutritionIndex[s.name];

                                        if (item.type !== "ingredient") return;

                                        const q = Number(item.quantity) || 0;

                                        updateIngredientObject(item.id, {
                                          ...item,
                                          name: s.name,
                                          kcal: (s.kcal * q) / 100,
                                          carbs: (s.carbs * q) / 100,
                                          protein: (s.protein * q) / 100,
                                          fat: (s.fat * q) / 100,
                                        });

                                        setSuggestions([]);
                                        setActiveSuggestionFor(null);
                                      }}
                                      style={{ padding: 8 }}
                                    >
                                      <Text>{s.name}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              )}

                            {/* SPILLETTA */}
                            {linkedRecipe && (
                              <TouchableOpacity
                                onPress={() =>
                                  router.push(`/recipe/${linkedRecipe.id}`)
                                }
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  alignSelf: "flex-start",
                                  backgroundColor: "#eef3ff",
                                  paddingHorizontal: 10,
                                  paddingVertical: 0,
                                  borderRadius: 12,
                                  marginTop: -40,
                                  marginLeft: 15,
                                }}
                              >
                                <Ionicons
                                  name="link-outline"
                                  size={16}
                                  color={COLORS.primary}
                                />
                                <Text
                                  style={{
                                    marginLeft: 6,
                                    color: COLORS.primary,
                                    fontSize: 11,
                                    fontWeight: "500",
                                  }}
                                >
                                  {linkedRecipe.title}
                                </Text>
                              </TouchableOpacity>
                            )}

                            {/* MENU INGREDIENTE */}
                            {openActions === item.id && (
                              <Animated.View
                                entering={FadeInRight.duration(180).damping(18)}
                                exiting={FadeOutLeft.duration(150)}
                                style={[
                                  styles.ingredientActionsOverlay,
                                  {
                                    marginLeft: 20,
                                    marginBottom: 5,
                                  },
                                ]}
                              >
                                {/* COLLEGA */}
                                {!item.linkedRecipeId ? (
                                  <TouchableOpacity
                                    style={styles.ingredientActionBtn}
                                    onPress={() => {
                                      const realIndex = ingredients.findIndex(
                                        (i) => i.id === item.id,
                                      );
                                      if (realIndex !== -1)
                                        openRecipePicker(realIndex);
                                      setOpenActions(null);
                                    }}
                                  >
                                    <Ionicons
                                      name="link-outline"
                                      size={20}
                                      color={COLORS.secondary}
                                    />
                                    <Text style={styles.ingredientActionLabel}>
                                      Collega
                                    </Text>
                                  </TouchableOpacity>
                                ) : (
                                  <TouchableOpacity
                                    style={styles.ingredientActionBtn}
                                    onPress={() => {
                                      updateIngredientField(
                                        item.id,
                                        "linkedRecipeId",
                                        null,
                                      );
                                      setOpenActions(null);
                                    }}
                                  >
                                    <Ionicons
                                      name="unlink-outline"
                                      size={20}
                                      color="#cb0047"
                                    />
                                    <Text
                                      style={[
                                        styles.ingredientActionLabel,
                                        { color: "#cb0047" },
                                      ]}
                                    >
                                      Rimuovi link
                                    </Text>
                                  </TouchableOpacity>
                                )}

                                <View style={styles.ingredientActionDivider} />

                                {/* ELIMINA */}
                                <TouchableOpacity
                                  style={styles.ingredientActionBtn}
                                  onPress={() => {
                                    removeIngredient(item.id);
                                    setOpenActions(null);
                                  }}
                                >
                                  <Ionicons
                                    name="trash-outline"
                                    size={20}
                                    color="#cb0047"
                                  />
                                  <Text
                                    style={[
                                      styles.ingredientActionLabel,
                                      { color: "#cb0047" },
                                    ]}
                                  >
                                    Elimina
                                  </Text>
                                </TouchableOpacity>

                                <View style={styles.ingredientActionDivider} />

                                {/* SU */}
                                <TouchableOpacity
                                  style={styles.ingredientActionBtn}
                                  onPress={() => {
                                    moveIngredientUp(item.id);
                                    setOpenActions(null);
                                  }}
                                >
                                  <Ionicons
                                    name="caret-up-outline"
                                    size={20}
                                    color={COLORS.secondary}
                                  />
                                  <Text style={styles.ingredientActionLabel}>
                                    Su
                                  </Text>
                                </TouchableOpacity>

                                <View style={styles.ingredientActionDivider} />

                                {/* GIÙ */}
                                <TouchableOpacity
                                  style={styles.ingredientActionBtn}
                                  onPress={() => {
                                    moveIngredientDown(item.id);
                                    setOpenActions(null);
                                  }}
                                >
                                  <Ionicons
                                    name="caret-down-outline"
                                    size={20}
                                    color={COLORS.secondary}
                                  />
                                  <Text style={styles.ingredientActionLabel}>
                                    Giù
                                  </Text>
                                </TouchableOpacity>
                              </Animated.View>
                            )}
                          </View>
                        );
                      }
                    })}
                  </View>
                )}

                {/* ============================================================
             PROCEDIMENTO
          ============================================================ */}
                {activeTab === "procedimento" && (
                  <View style={styles.sectionWrapper}>
                    {steps.map((item, index) => (
                      <View key={index} style={{ position: "relative" }}>
                        {/* ⭐ CARD (COLLASSATA O ESPANSA) */}
                        <Animated.View
                          entering={FadeInDown.delay(50)}
                          exiting={FadeOutUp}
                        >
                          {item.collapsed ? (
                            /* ⭐ MINI‑CARD */
                            <Pressable
                              onPress={() =>
                                setSteps((prev) =>
                                  prev.map((s, i) =>
                                    i === index
                                      ? { ...s, collapsed: false }
                                      : s,
                                  ),
                                )
                              }
                              style={[
                                styles.stepCollapsedCard,
                                { position: "relative" },
                              ]}
                            >
                              {/* ⭐ OVERLAY ACTIONS */}
                              {openStepOverlay === index && (
                                <Animated.View
                                  entering={FadeInRight.duration(180).damping(
                                    18,
                                  )}
                                  exiting={FadeOutLeft.duration(150)}
                                  style={styles.stepOverlay}
                                >
                                  {/* ⭐ X CHIUSURA */}
                                  <TouchableOpacity
                                    onPress={() => setOpenStepOverlay(null)}
                                    style={[
                                      styles.stepOverlayCloseBtn,
                                      { right: 5 },
                                    ]}
                                  >
                                    <Ionicons
                                      name="close"
                                      size={22}
                                      color={COLORS.secondary}
                                    />
                                  </TouchableOpacity>

                                  {/* ⭐ COLLASSATA → 5 pulsanti in riga */}
                                  {item.collapsed ? (
                                    <View style={styles.rowCollapsed}>
                                      {renderStepActionsCollapsed(index)}
                                    </View>
                                  ) : (
                                    /* ⭐ ESPANSA → 3 righe, 2 pulsanti per riga, ultimo centrato */
                                    renderStepActionsExpanded(index)
                                  )}
                                </Animated.View>
                              )}
                              {/* IMMAGINE */}
                              <View style={styles.stepCollapsedImageWrapper}>
                                {item.imageUri ? (
                                  <Image
                                    source={{ uri: item.imageUri }}
                                    style={styles.stepCollapsedImage}
                                  />
                                ) : (
                                  <View style={styles.stepCollapsedPlaceholder}>
                                    <Ionicons
                                      name="camera-outline"
                                      size={22}
                                      color={COLORS.secondary}
                                    />
                                  </View>
                                )}

                                <View style={styles.stepCollapsedNumber}>
                                  <Text style={styles.stepCollapsedNumberText}>
                                    {index + 1}
                                  </Text>
                                </View>
                              </View>

                              {/* TESTO */}
                              <View style={styles.stepCollapsedTextWrapper}>
                                <Text
                                  numberOfLines={1}
                                  style={styles.stepCollapsedTitle}
                                >
                                  {item.title.trim() || "Passaggio"}
                                </Text>

                                <Text style={styles.stepCollapsedSubtitle}>
                                  Mostra dettagli
                                </Text>
                              </View>

                              {/* ⭐ ELLIPSIS DENTRO LA CARD */}
                              <Pressable
                                onPress={(e) => {
                                  e.stopPropagation();
                                  setOpenStepMenu(
                                    openStepMenu === index ? null : index,
                                  );
                                }}
                                hitSlop={10}
                                style={{
                                  position: "absolute",
                                  right: 15,
                                  top: 30,
                                  padding: 6,
                                  borderRadius: 8,
                                  zIndex: 20,
                                }}
                              >
                                <Ionicons
                                  name="ellipsis-vertical"
                                  size={20}
                                  color={COLORS.primary}
                                />
                              </Pressable>
                            </Pressable>
                          ) : (
                            /* ⭐ CARD ESPANSA (rimane invariata) */
                            <View style={styles.stepExpandedCard}>
                              {openStepOverlay === index && (
                                <Animated.View
                                  entering={FadeInRight.duration(180).damping(
                                    18,
                                  )}
                                  exiting={FadeOutLeft.duration(150)}
                                  style={styles.stepOverlay}
                                >
                                  {/* ⭐ X CHIUSURA */}
                                  <TouchableOpacity
                                    onPress={() => setOpenStepOverlay(null)}
                                    style={styles.stepOverlayCloseBtn}
                                  >
                                    <Ionicons
                                      name="close"
                                      size={22}
                                      color={COLORS.secondary}
                                    />
                                  </TouchableOpacity>

                                  {/* ⭐ COLLASSATA → 5 pulsanti in riga */}
                                  {item.collapsed ? (
                                    <View style={styles.rowCollapsed}>
                                      {renderStepActionsCollapsed(index)}
                                    </View>
                                  ) : (
                                    /* ⭐ ESPANSA → 3 righe, 2 pulsanti per riga, ultimo centrato */
                                    renderStepActionsExpanded(index)
                                  )}
                                </Animated.View>
                              )}
                              {/* HEADER */}
                              <View style={styles.stepHeaderExpanded}>
                                <View style={styles.stepNumberExpanded}>
                                  <Text style={styles.stepNumberExpandedText}>
                                    {index + 1}
                                  </Text>
                                </View>

                                <TouchableOpacity
                                  onPress={() =>
                                    setSteps((prev) =>
                                      prev.map((s, i) =>
                                        i === index
                                          ? { ...s, collapsed: true }
                                          : s,
                                      ),
                                    )
                                  }
                                  style={styles.stepTitleWrapperExpanded}
                                >
                                  <Input
                                    value={item.title}
                                    onChangeText={(t) =>
                                      updateStepTitle(index, t)
                                    }
                                    placeholder="Titolo passaggio"
                                    style={styles.stepTitleInputExpanded}
                                  />

                                  <Text
                                    style={styles.stepCollapseLabelExpanded}
                                  >
                                    Riduci
                                  </Text>
                                </TouchableOpacity>

                                {/* ⭐ ELLIPSIS → X */}
                                <Pressable
                                  onPress={() =>
                                    setOpenStepOverlay(
                                      openStepOverlay === index ? null : index,
                                    )
                                  }
                                  style={{ padding: 6 }}
                                >
                                  <Ionicons
                                    name="ellipsis-vertical"
                                    size={22}
                                    color={COLORS.primary}
                                  />
                                </Pressable>
                              </View>

                              {/* IMMAGINE PRINCIPALE */}
                              <StepImage
                                uri={item.imageUri}
                                onPress={() => chooseStepImage(index)}
                              />

                              {/* ⭐ OCR PREVIEW + DELETE */}
                              {item.textImageUri && (
                                <View style={{ position: "relative" }}>
                                  <StepOcrPreview uri={item.textImageUri} />

                                  <TouchableOpacity
                                    onPress={() =>
                                      setSteps((prev) =>
                                        prev.map((s, i) =>
                                          i === index
                                            ? { ...s, textImageUri: null }
                                            : s,
                                        ),
                                      )
                                    }
                                    style={{
                                      position: "absolute",
                                      top: 8,
                                      right: 0,
                                      backgroundColor: "white",
                                      borderRadius: 20,
                                      padding: 2,
                                      shadowColor: "#000",
                                      shadowOpacity: 0.15,
                                      shadowRadius: 4,
                                      elevation: 3,
                                      zIndex: 20,
                                    }}
                                  >
                                    <Ionicons
                                      name="close"
                                      size={20}
                                      color="#cb0047"
                                    />
                                  </TouchableOpacity>
                                </View>
                              )}

                              {/* DESCRIZIONE */}
                              <View style={{ position: "relative" }}>
                                {item.description.trim().length > 0 && (
                                  <TouchableOpacity
                                    onPress={() =>
                                      setSteps((prev) =>
                                        prev.map((s, i) =>
                                          i === index
                                            ? { ...s, description: "" }
                                            : s,
                                        ),
                                      )
                                    }
                                    style={styles.deleteSmallButton}
                                  >
                                    <Ionicons
                                      name="close"
                                      size={20}
                                      color="#cb0047"
                                    />
                                  </TouchableOpacity>
                                )}

                                <Input
                                  style={styles.stepDescriptionInputExpanded}
                                  value={item.description}
                                  onChangeText={(t) =>
                                    updateStepDescription(index, t)
                                  }
                                  placeholder="Scrivi qui la descrizione"
                                  multiline
                                />
                              </View>
                            </View>
                          )}
                        </Animated.View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </Animated.View>

            {/* ============================================================
             FLOATING BUTTONS
          ============================================================ */}

            <Modal
              visible={isPickerOpen}
              animationType="slide"
              transparent={false}
            >
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
                      onPress={() => {
                        if (selectedIngredientIndex !== null) {
                          const ing = ingredients[selectedIngredientIndex];
                          updateIngredientField(ing.id, "linkedRecipeId", r.id);
                        }
                        setIsPickerOpen(false);
                      }}
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
                  onPress={() => setIsPickerOpen(false)}
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

            <Modal
              visible={showNewGroupModal}
              transparent
              animationType="fade"
              onRequestClose={() => setShowNewGroupModal(false)}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: "rgba(0,0,0,0.4)",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: 20,
                }}
              >
                <View
                  style={{
                    width: "100%",
                    backgroundColor: "white",
                    borderRadius: 16,
                    padding: 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "600",
                      textAlign: "center",
                      marginBottom: 10,
                    }}
                  >
                    Crea o scegli un gruppo
                  </Text>

                  {/* INPUT NUOVO GRUPPO */}
                  <Input
                    placeholder="Nome nuovo gruppo"
                    value={newGroupTitle}
                    onChangeText={setNewGroupTitle}
                    style={{ marginBottom: 15, textAlign: "center" }}
                  />

                  <TouchableOpacity
                    style={{
                      backgroundColor: COLORS.secondary,
                      paddingVertical: 12,
                      borderRadius: 10,
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                    onPress={() => {
                      if (!newGroupTitle.trim()) return;
                      createNewGroup(newGroupTitle.trim());
                      setNewGroupTitle("");
                      setGroupingMode(false);
                      setSelectedIngredients([]);
                      setShowNewGroupModal(false);
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "600" }}>
                      Crea gruppo
                    </Text>
                  </TouchableOpacity>

                  {/* GRUPPI ESISTENTI */}
                  {groups.length > 0 && (
                    <>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          marginBottom: 10,
                          textAlign: "center",
                        }}
                      >
                        Oppure aggiungi a un gruppo esistente:
                      </Text>

                      {groups.map((g) => (
                        <TouchableOpacity
                          key={g.id}
                          style={{
                            paddingVertical: 10,
                            borderBottomWidth: 1,
                            borderColor: "#eee",
                          }}
                          onPress={() => {
                            addIngredientsToGroup(g.id, selectedIngredients);
                            setGroupingMode(false);
                            setSelectedIngredients([]);
                            setShowNewGroupModal(false);
                          }}
                        >
                          <Text
                            bold
                            style={{
                              fontSize: 16,
                              textAlign: "center",
                              color: COLORS.secondary,
                            }}
                          >
                            {g.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}

                  {/* ANNULLA */}
                  <TouchableOpacity
                    onPress={() => setShowNewGroupModal(false)}
                    style={{
                      marginTop: 20,
                      paddingVertical: 12,
                      backgroundColor: "#ddd",
                      borderRadius: 10,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontWeight: "600" }}>Annulla</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <Modal
              visible={saveModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setSaveModalVisible(false)}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "rgba(0,0,0,0.4)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                activeOpacity={1}
                onPress={() => setSaveModalVisible(false)}
              />

              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: "white",
                  paddingVertical: 20,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                }}
              >
                <TouchableOpacity
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  onPress={() => {
                    setSaveModalVisible(false);
                    handleOverwrite();
                  }}
                >
                  <Ionicons name="create-outline" size={22} color="#333" />
                  <Text style={{ marginLeft: 12, fontSize: 16 }}>
                    Sovrascrivi ricetta
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  onPress={() => {
                    setSaveModalVisible(false);
                    handleSaveAsNew();
                  }}
                >
                  <Ionicons name="duplicate-outline" size={22} color="#333" />
                  <Text style={{ marginLeft: 12, fontSize: 16 }}>
                    Salva come nuova
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  onPress={() => setSaveModalVisible(false)}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={22}
                    color="#333"
                  />
                  <Text style={{ marginLeft: 12, fontSize: 16 }}>Annulla</Text>
                </TouchableOpacity>
              </View>
            </Modal>
          </KeyboardAwareScrollView>

          {/* FAB SALVA */}
          <TouchableOpacity
            style={styles.fabSave}
            onPress={() => setSaveModalVisible(true)}
          >
            <Text bold style={styles.fabSaveLabel}>
              Salva
            </Text>
          </TouchableOpacity>

          {/* ⭐ BARRA FISSA INGREDIENTI */}
          {activeTab === "ingredienti" && (
            <View style={styles.fixedIngredientsBar}>
              {/* SVUOTA */}
              <TouchableOpacity
                onPress={() => setIngredients([])}
                style={{
                  paddingHorizontal: 10,
                  alignItems: "center",
                  paddingVertical: 12,
                }}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={COLORS.textLight}
                />
                <Text style={{ color: COLORS.textLight, fontSize: 10 }}>
                  Svuota
                </Text>
              </TouchableOpacity>

              {/* RAGGRUPPA */}
              <TouchableOpacity
                onPress={() => {
                  if (!groupingMode) {
                    // entra in modalità raggruppamento
                    setGroupingMode(true);
                    setSelectedIngredients([]);
                  } else {
                    // esce dalla modalità e apre il modal
                    setGroupingMode(false);
                    setShowNewGroupModal(true);
                  }
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  alignItems: "center",
                  backgroundColor: groupingMode ? COLORS.secondary : "white",
                }}
              >
                <Ionicons
                  name={groupingMode ? "checkmark" : "albums-outline"}
                  size={18}
                  color={groupingMode ? "white" : COLORS.textLight}
                />
                <Text
                  style={{
                    color: groupingMode ? "white" : COLORS.textLight,
                    fontSize: 10,
                  }}
                >
                  {groupingMode ? "Fatto" : "Raggruppa"}
                </Text>
              </TouchableOpacity>

              {/* OCR */}
              <TouchableOpacity
                onPress={handleOCRIngredients}
                style={{
                  paddingHorizontal: 10,
                  alignItems: "center",
                  paddingVertical: 12,
                }}
              >
                <Ionicons
                  name="text-outline"
                  size={18}
                  color={COLORS.textLight}
                />
                <Text style={{ color: COLORS.textLight, fontSize: 10 }}>
                  OCR
                </Text>
              </TouchableOpacity>

              {/* NUOVO GRUPPO */}
              <TouchableOpacity
                onPress={() => setShowNewGroupModal(true)}
                style={{
                  paddingHorizontal: 10,
                  alignItems: "center",
                  paddingVertical: 12,
                }}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={COLORS.textLight}
                />
                <Text style={{ color: COLORS.textLight, fontSize: 10 }}>
                  Gruppo
                </Text>
              </TouchableOpacity>

              {/* NUOVO INGREDIENTE */}
              <TouchableOpacity
                onPress={() =>
                  setIngredients((prev) => [
                    ...prev,
                    {
                      id: uid(),
                      type: "ingredient",
                      name: "",
                      quantity: "",
                      unit: "",
                      groupId: null,
                      linkedRecipeId: null,
                    },
                  ])
                }
                style={{
                  paddingHorizontal: 10,
                  alignItems: "center",
                  paddingVertical: 12,
                }}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={COLORS.textLight}
                />
                <Text style={{ color: COLORS.textLight, fontSize: 10 }}>
                  Ingrediente
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* BARRA FISSA PROCEDIMENTO */}
          {activeTab === "procedimento" && (
            <View style={styles.fixedStepsBar}>
              <TouchableOpacity
                style={{ marginRight: 10, alignItems: "center" }}
                onPress={() =>
                  setSteps((prev) => [
                    ...prev,
                    {
                      title: "",
                      description: "",
                      imageUri: null,
                      textImageUri: null,
                      collapsed: false,
                      actionsOpen: false,
                    },
                  ])
                }
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={COLORS.textLight}
                />
                <Text style={{ color: COLORS.textLight, fontSize: 10 }}>
                  Aggiungi passaggio
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    lineHeight: 30,
  },

  bg: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#ffffff",
  },

  header: {
    alignItems: "center",
  },

  title: {
    fontSize: 30,
    paddingHorizontal: 15,
    paddingVertical: 10,
    textAlign: "center",
    color: "black",
    marginBottom: 20,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 18,
    gap: 10,
  },

  half: { flex: 1 },

  inputLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 10,
    textAlign: "center",
  },

  tagsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  tag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },

  tagText: {
    fontSize: 13,
    color: COLORS.background,
  },

  titleInput: {
    fontSize: 22,
    marginBottom: 10,
    marginHorizontal: 20,
    textAlign: "center",
    fontFamily: "Outfit-SemiBold",
  },

  infoInputSmall: {
    width: 90,
    marginLeft: 3,
    paddingVertical: 4,
    textAlign: "center",
    marginTop: 6,
  },

  tagInput: {
    paddingVertical: 6,
    textAlignVertical: "center",
  },

  tagsList: {
    paddingVertical: 6,

    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  notesInline: {
    marginTop: 20,
    paddingVertical: 10,
  },

  notesInput: {
    marginHorizontal: 10,
    padding: 20,
    minHeight: 80,
    fontSize: 15,
    lineHeight: 30,
    textAlignVertical: "top",
    color: "#333",
  },

  /* ============================================================
     HERO
  ============================================================ */
  heroContainer: {
    width: "100%",
    height: 300,
    position: "relative",
    backgroundColor: "#000",
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  heroPlaceholder: {
    marginTop: 20,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "#f0f0f0",
  },

  heroPlaceholderText: {
    color: "#676767",
    fontSize: 12,
  },

  deleteMainSmallButton: {
    position: "absolute",
    top: 5,
    right: 5,
    zIndex: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  /* ============================================================
     CARD ESPANDIBILE
  ============================================================ */
  cardExpanded: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 220,
    marginTop: -40,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },

  sectionTitle: {
    fontSize: 20,
    marginBottom: 25,
    textAlign: "center",
  },

  deleteNotesSmallButton: {
    position: "absolute",
    top: 0,
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

  /* ============================================================
     TABS
  ============================================================ */
  tabsContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 20,
  },

  tab: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
  },

  tabActive: {
    borderColor: COLORS.primary,
  },

  tabLabel: {
    fontSize: 18,
    color: "#8c8c8c",
  },

  tabLabelActive: {
    color: COLORS.primary,
  },

  /* ============================================================
     SEZIONI
  ============================================================ */
  sectionWrapper: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 120,
  },

  /* ============================================================
     OCR BUTTON
  ============================================================ */
  ocrButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 20,
  },

  ocrLabel: {
    color: "white",
    marginLeft: 8,
    fontSize: 14,
  },

  /* ============================================================
     IMMAGINI (ingredienti / step)
  ============================================================ */
  imageWrapper: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
    marginTop: 10,
  },

  dynamicImage: {
    width: "100%",
    alignSelf: "center",
  },

  imagePlaceholder: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  imagePlaceholderText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  deleteSmallButton: {
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

  /* ============================================================
     CARD ESPANSA PREMIUM (STEP)
  ============================================================ */
  stepCollapsedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },

  stepCollapsedImageWrapper: {
    width: 70,
    height: 70,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f0f0f0",
    marginRight: 12,
  },

  stepCollapsedImage: {
    width: "100%",
    height: "100%",
  },

  stepCollapsedPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  stepCollapsedNumber: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  stepCollapsedNumberText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },

  stepCollapsedTextWrapper: {
    flex: 1,
  },

  stepCollapsedTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },

  stepCollapsedSubtitle: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
  },

  stepCollapsedArrows: {
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingLeft: 8,
  },

  /* CARD ESPANSA */
  stepExpandedCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },

  stepHeaderExpanded: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  stepNumberExpanded: {
    position: "absolute",
    top: 15,
    left: 5,
    width: 32,
    height: 32,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  stepNumberExpandedText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },

  stepTitleWrapperExpanded: {
    flex: 1,
    alignItems: "center",
    marginLeft: 40,
  },

  stepTitleInputExpanded: {
    fontSize: 18,
    fontWeight: "600",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderColor: "white",
    backgroundColor: "#ffffff",
    textAlign: "center",
    marginBottom: -15,
  },

  stepCollapseLabelExpanded: {
    fontSize: 12,
    color: COLORS.secondary,
  },

  stepImageButtonExpanded: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    marginBottom: 20,
  },

  stepImageContainer: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
  },

  stepImageExpanded: {
    width: "100%",
    height: 240,
  },

  stepImagePlaceholderExpanded: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },

  stepImagePlaceholderTextExpanded: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 6,
  },

  stepDescriptionInputExpanded: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 160,
    textAlignVertical: "top",
    fontSize: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },

  /* ELLIPSIS BUTTON */
  stepEllipsisButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginLeft: 8,
  },

  /* POPOVER STEP */
  stepPopoverWrapper: {
    position: "absolute",
    right: 35,
    top: 60,
    zIndex: 999,
    alignItems: "flex-end",
  },

  stepPopover: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  stepPopoverItem: {
    paddingVertical: 8,
  },

  stepPopoverText: {
    fontSize: 14,
    color: COLORS.text,
  },

  stepPopoverArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "white",
    marginTop: -1,
  },

  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 0,
    borderRadius: 12,
    marginBottom: -5,
    // marginHorizontal: 10,
    // marginLeft: 10,
    // marginRight: -20,
    // paddingHorizontal: 10,
  },

  ingredientSelected: {
    backgroundColor: "white",
    borderColor: COLORS.secondary,
  },

  rowEllipsisBtn: {
    padding: 6,
    borderRadius: 20,
    zIndex: 20,
    marginBottom: 10,
  },

  ingredientActionsOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 40,
    left: -20,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "white",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 0,
    zIndex: 10,
  },

  ingredientActionBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  ingredientActionLabel: {
    fontSize: 11,
    marginTop: 2,
    color: COLORS.text,
    textAlign: "center",
  },

  ingredientActionDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#eee",
  },

  groupCard: {
    borderWidth: 1,
    borderColor: "#eee",
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "white",
    justifyContent: "center",
    marginLeft: -20,
    marginRight: -20,
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    elevation: 2,
  },

  checkboxWrapper: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginBottom: 15,
    marginLeft: 10,
    backgroundColor: "white",
  },

  checkboxSelected: {
    backgroundColor: "white",
    borderColor: COLORS.primary,
  },

  checkboxUnselected: {
    backgroundColor: "white",
    borderColor: "#ccc",
  },

  categoriesWrapper: {
    paddingVertical: 5,
  },

  fabSave: {
    position: "absolute",
    top: 10,
    left: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 999,
  },

  fabSaveLabel: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "600",
    marginTop: 2,
  },

  fixedIngredientsBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: "#ddd",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 9999,
  },

  fixedStepsBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: "#ddd",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 9999,
  },

  groupActionsOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 10,
    right: 0,
    backgroundColor: "white",
    borderRadius: 12,

    paddingVertical: 20,
    paddingHorizontal: 20,
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
  },

  groupActionsCloseBtn: {
    position: "absolute",
    top: 10,
    left: 10,
    padding: 6,
    zIndex: 30,
  },

  groupActionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 40,
    marginVertical: 10,
  },

  groupActionBtn: {
    justifyContent: "center",
    alignItems: "center",
    width: 70,
  },

  groupDividerHorizontal: {
    width: "60%",
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },

  groupDividerVertical: {
    position: "absolute",
    top: "20%",
    bottom: "20%",
    left: "55%",
    width: 1,
    backgroundColor: "#ddd",
  },
  stepActionBtnCollapsed: {
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 6,
  },

  stepActionLabelCollapsed: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 2,
  },

  stepDividerVertical: {
    width: 1,
    height: "60%",
    backgroundColor: "#ddd",
  },

  /* ⭐ COLLASSATA */
  rowCollapsed: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    marginBottom: 25,
    marginRight: 14,
  },

  /* ⭐ ESPANSA */
  expandedGrid: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  expandedRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#eee",
    borderBottomWidth: 1,
  },

  actionExpanded: {
    width: 110,
    backgroundColor: "#fff",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#eee",
  },

  actionExpandedDanger: {
    justifyContent: "center",
    alignItems: "center",
  },

  actionExpandedText: {
    fontSize: 10,
    color: COLORS.textLight,
  },

  stepOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 14,
    paddingTop: 40,
    paddingHorizontal: 20,
    zIndex: 50,

    // ⭐ Per centrare verticalmente il contenuto
    justifyContent: "center",
    alignItems: "center",
  },
  stepDividerVerticalTop: {
    width: 1,
    height: 60,
    backgroundColor: "#eee",
  },
  stepOverlayCloseBtn: {
    position: "absolute",
    top: 30,
    right: 10,
    padding: 6,
    zIndex: 60,
  },

  emptyIngredientsWrapper: {
    width: "90%",
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
  },

  emptyIngredientsText: {
    fontSize: 18,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.textLight,
    marginBottom: 6,
    textAlign: "center",
  },

  emptyIngredientsSub: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
    color: COLORS.textLight,
    marginBottom: 20,
    textAlign: "center",
  },

  infoColumn: {
    alignItems: "center",
    marginBottom: 20,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  label: {
    fontSize: 16,
    marginRight: 2,
    color: COLORS.text,
    marginBottom: 17,
  },

  infoInput: {
    minWidth: 100,
    textAlign: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderRadius: 30,
    fontSize: 16,
    textAlignVertical: "center",
  },
});
