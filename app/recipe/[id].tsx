// app/recipe/[id].tsx
import SuccessToast from "@/components/SuccessToast";
import Text from "@/components/Text";
import { CATEGORY_IMAGES } from "@/constants/categories";
import { COLORS } from "@/constants/colors";
import { useRecipeContext } from "@/context/RecipeContext";
import { Category, Recipe, Step } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type IngredientItem = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  linkedRecipeId?: string | null;
};

type IngredientGroup = {
  id: string;
  title: string;
  items: IngredientItem[];
};

export default function RecipeDetailScreen() {
  // ⭐ UNA SOLA CHIAMATA
  const params = useLocalSearchParams<{
    id: string;
    updated?: string;
    share?: string;
  }>();

  const id = params.id;
  const updatedRecipe: Recipe | null = params.updated
    ? JSON.parse(params.updated)
    : null;

  const { recipes, deleteRecipe, addToShoppingList } = useRecipeContext();
  const recipe = updatedRecipe ?? recipes.find((r) => r.id === id);

  console.log(
    "DEFAULT RECIPE INGREDIENTS:",
    JSON.stringify(recipe?.ingredients, null, 2),
  );

  const [checkedIngredients, setCheckedIngredients] = useState<
    Record<string, boolean>
  >({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [toastVisible, setToastVisible] = useState(false);

  const share = params.share;

  const showAddedToast = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1500);
  };

  useEffect(() => {
    if (share === "1" && recipe) {
      shareRecipePDF(recipe);
    }
  }, [share, recipe]);

  if (!recipe) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Caricamento...</Text>
      </View>
    );
  }

  const ingredientGroups: IngredientGroup[] = Array.isArray(recipe.ingredients)
    ? (recipe.ingredients as any[]).map((g) => ({
        id: g.id,
        title: g.title,
        items: g.items || [],
      }))
    : [];

  const ungroupedIngredients =
    ingredientGroups.find(
      (g) => g.title === "" || g.title === null || g.title === undefined,
    )?.items || [];

  const toggleIngredientCheck = (key: string) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const addSingleIngredient = (ing: any) => {
    addToShoppingList([ing]);
    Alert.alert(
      "Aggiunto",
      `${ing.quantity || ""} ${ing.unit || ""} ${ing.name}`,
    );
  };

  const handleDelete = () => {
    Alert.alert("Elimina ricetta", "Sei sicuro?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: () => {
          deleteRecipe(recipe.id);
          router.back();
        },
      },
    ]);
  };

  async function uriToBase64(uri: string | null | undefined) {
    if (!uri) return null;
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch (e) {
      console.log("Errore conversione base64:", e);
      return "";
    }
  }

  async function loadIconBase64(icon: number): Promise<string> {
    const asset = Asset.fromModule(icon);
    await asset.downloadAsync();

    const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return `data:image/png;base64,${base64}`;
  }

  async function loadFontBase64() {
    const asset = Asset.fromModule(
      require("../../assets/fonts/Outfit-Regular.ttf"),
    );
    await asset.downloadAsync();

    const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
      encoding: "base64",
    });

    return `data:font/ttf;base64,${base64}`;
  }

  type FlatEntry =
    | { type: "group"; title: string }
    | { type: "item"; item: IngredientItem };

  function splitIngredientsForPdf(groups: IngredientGroup[]) {
    const flat: FlatEntry[] = [];

    groups.forEach((group) => {
      if (group.title) {
        flat.push({ type: "group", title: group.title });
      }
      group.items.forEach((item) => {
        flat.push({ type: "item", item });
      });
    });

    const MAX_FIRST_COLUMN = 8;

    if (flat.length <= MAX_FIRST_COLUMN) {
      return { col1: flat, col2: [] };
    }

    return {
      col1: flat.slice(0, MAX_FIRST_COLUMN),
      col2: flat.slice(MAX_FIRST_COLUMN),
    };
  }

  async function loadLogoBase64() {
    const asset = Asset.fromModule(require("../../assets/images/logo.png"));
    await asset.downloadAsync();

    const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
      encoding: "base64",
    });

    return `data:image/png;base64,${base64}`;
  }

  async function generateRecipePDF(recipe: Recipe) {
    const fontBase64 = await loadFontBase64();
    const logoBase64 = await loadLogoBase64();

    const iconCategory = await loadIconBase64(CATEGORY_IMAGES[recipe.category]);
    const iconTime = await loadIconBase64(
      require("../../assets/images/orologio.png"),
    );
    const iconServings = await loadIconBase64(
      require("../../assets/images/porzioni.png"),
    );

    const mainImage = await uriToBase64(recipe.imageUri ?? null);
    const defaultImageBase64 = await loadIconBase64(
      require("../../assets/images/senza-immagine.jpg"),
    );

    const ingredientsPhoto = await uriToBase64(recipe.ingredientsPhoto ?? null);
    const ingredientsOcrImage = await uriToBase64(
      recipe.ingredientsOcrImage ?? null,
    );

    const notesImage = await uriToBase64(recipe.notes?.image ?? null);
    const notesOcrImage = await uriToBase64(recipe.notes?.ocrImage ?? null);

    const stepsWithImages = await Promise.all(
      recipe.steps.map(async (s) => ({
        ...s,
        imageBase64: await uriToBase64(s.imageUri ?? null),
        ocrBase64: await uriToBase64(s.textImageUri ?? null),
      })),
    );
    const { col1, col2 } = splitIngredientsForPdf(recipe.ingredients);

    const html = `
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @font-face {
        font-family: 'Outfit';
        src: url(${fontBase64});
      }
        /* QUADRANTI PRIMA PAGINA */
.first-page-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 20px;
  width: 100%;
  height: 100%;
  margin-bottom: 40px;
}

/* FOTO RICETTA */
.recipe-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 14px;
}

/* TITOLO */
.title-box {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.title-box h1 {
  font-size: 42px;
  color: #cb0047;
  text-align: center;
  line-height: 1.2;
}

/* INFO (categoria, tempo, porzioni) */
.info-column {
  display: flex;
  flex-direction: column;
  gap: 18px;
  justify-content: center;
  padding-left: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-item img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.info-label {
  font-size: 18px;
  font-weight: 600;
}

.info-value {
  font-size: 18px;
}

/* INGREDIENTI */
.ingredients-box {
  padding: 10px;
  overflow: hidden;
}

.ingredients-list {
  font-size: 17px;
  line-height: 1.4;
}

.ingredients-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 14px;
}


      body {
        font-family: 'Outfit';
        padding: 28px;
        color: #333;
        line-height: 1.5;
      }

      /* LOGO + DIVIDER */
      .logo-divider {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
        margin-top: 10px;
      }

      .logo-divider-line {
        flex: 1;
        height: 2px;
        background-color: #9e588f;
      }

      .logo-divider img {
        width: 90px;
        height: 90px;
        border-radius: 50%;
        object-fit: cover;
        margin: 0 12px;
      }

      /* TITOLI */
      h1, h2 {
        text-align: center;
        color: #000000;
      }

      h1 {
        font-size: 40px;
        margin-bottom: 10px;
      }

      /* INFO + TAGS */
      .info-row {
        display: flex;
        justify-content: center;
        gap: 24px;
        font-size: 16px;
        margin-top: 20px;
        margin-bottom: 20px;
      }

      .tags-row {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-bottom: 30px;
        flex-wrap: wrap;
      }

      .tag {
        background: #eee;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 14px;
        
      }

      /* FOTO PRINCIPALE */
      .main-image {
        width: 60%;
        height: 300px;
        object-fit: cover;
        border-radius: 14px;
        display: block;
        margin: 0 auto 24px auto;
      }

      /* FOTO INGREDIENTI FISSA */
      .ingredients-fixed-image {
        width: 60%;
        height: 260px;
        object-fit: cover;
        border-radius: 14px;
        display: block;
        margin: 0 auto 24px auto;
      }

      /* SEZIONI */
      .section-divider {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 30px 0 20px 0;
      }

      .section-line {
        flex: 1;
        height: 2px;
        background-color: #9e588f;
      }

      .section-title {
        font-size: 35px;
        font-weight: 600;
        color: #625e59;
        margin: 0 20px;
        white-space: nowrap;
        text-decoration: underline;
        text-align: center;
        align-items: center;
        margin-top: 50px;
        margin-bottom: 30px;
      }

      /* INGREDIENTI — colonne solo se necessario */
      .ingredients-container {
        column-count: 1;
        column-gap: 40px;
      }

      .ingredients-container.two-columns {
        column-count: 2;
      }

      .ingredient {
        font-size: 17px;
        margin-bottom: 6px;
        break-inside: avoid;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .checkbox {
        width: 14px;
        height: 14px;
        border: 2px solid #8b8b8bad;
        border-radius: 3px;
        display: inline-block;
      }

      /* PAGE BREAK */
      .page-break {
        page-break-after: always;
      }

      /* LAYOUT 1 SOLO STEP */
      .step-horizontal {
        display: flex;
        flex-direction: row;
        gap: 20px;
        align-items: flex-start;
      }

      .step-horizontal img {
        width: 320px;
        height: 260px;
        object-fit: cover;
        border-radius: 12px;
      }

      .step-text {
        flex: 1;
        font-size: 17px;
      }

      /* LAYOUT 2 PER RIGA */
      .steps-grid {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 16px;
        box-sizing: border-box;
        padding: 16px;
      }

      .step-card {
        background: #ffffff;
        padding: 20px;
        border-radius: 12px;
        border: 1px solid #eee;
        width: calc(50% - 12px);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
      }

      .step-card img {
        width: 100%;
        height: 220px;
        object-fit: cover;
        border-radius: 10px;
        margin-bottom: 8px;
      }

      /* HEADER DELLA CARD */
      .step-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }

      .step-number {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background-color: #625e59;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
      }

      .step-title {
        font-size: 17px;
        font-weight: 600;
      }

      /* DIVISORE + CHECKBOX */
      .step-check-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
      }

      .step-inner-divider {
        flex: 1;
        height: 2px;
        background-color: #625e59;
        border-radius: 2px;
      }

      .step-checkbox {
        width: 18px;
        height: 18px;
        border: 2px solid #8b8b8bad;
        border-radius: 3px;
      }

      /* NOTE */
      .notes {
        font-size: 17px;
        margin-top: 10px;
        white-space: pre-wrap;
      }

      /* FOOTER */
      .footer {
        text-align: center;
        font-size: 14px;
        color: #999;
        margin-top: 40px;
        padding-top: 12px;
        border-top: 1px solid #eee;
      }
        .side-by-side {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.side-by-side img {
  width: 260px;
  height: 220px;
  object-fit: cover;
}

.side-by-side .text-block {
  flex: 1;
}
/* CONTENITORE PRINCIPALE */
.first-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

/* RIGA SUPERIORE: due quadranti */
.row-top {
  display: flex;
  flex: 1;
  margin: 0;
  padding: 0;
}

/* QUADRANTI SUPERIORI */
.q1, .q2 {
  flex: 1;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* FOTO */
.recipe-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0
}

/* TITOLO + INFO */
.q2 {
  background: #fff9f1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px;
  gap: 40px;
}

.q2 h1 {
  font-size: 50px;
  color: #625e59;
  text-align: center;
  margin: 0;
  padding: 0;
}

/* INFO IN RIGA */
.info-row {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-item img {
  width: 34px;
  height: 34px;
}

.info-label {
  font-size: 18px;
  font-weight: 600;
  color: #625e59;
}

.info-value {
  font-size: 18px;
  color: #625e59;
}

/* DIVISORE */
.quadrant-divider {
  height: 25px;
  background-color: #625e59;
  flex: 0 0 25px;
  margin: 0;
  padding: 0;
}

/* RIGA INFERIORE: INGREDIENTI */
.row-bottom {
  flex: 1.2;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

/* CONTENITORE INGREDIENTI */
.ingredients-wrapper {
  width: 90%;
}

/* TITOLO INGREDIENTI */
.ingredients-title {
  font-size: 35px;
  font-weight: 700;
  color: #625e59;
  text-align: center;
  margin-bottom: 30px;
  text-decoration: underline;

}

/* LISTA INGREDIENTI A 1 O 2 COLONNE */
.ingredients-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  column-gap: 40px;
  row-gap: 20px;
}

/* RIGA INGREDIENTE */
.ingredient-row {
  display: flex;
  align-items: center;
  gap: 20px;
}

.checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid #625e59;
}
  .ingredients-columns {
  display: flex;
  gap: 40px;
}

.column {
  flex: 1;
}

.group-title {
  font-weight: 700;
  margin-top: 12px;
  margin-bottom: 6px;
  color: #625e59;
}

    </style>
  </head>

  <body>

<div class="first-page">

  <!-- RIGA SUPERIORE -->
  <div class="row-top">

    <!-- QUADRANTE 1: FOTO -->
    <div class="q1">
      <img 
        class="recipe-photo" 
        src="${mainImage || defaultImageBase64}" 
      />
    </div>

    <!-- QUADRANTE 2: TITOLO + INFO -->
    <div class="q2">
      <h1>${recipe.title}</h1>

      <div class="info-row">

        <div class="info-item">
          <img src="${iconCategory}" />
          <div>
            <div class="info-label">Categoria</div>
            <div class="info-value">${recipe.category}</div>
          </div>
        </div>

        <div class="info-item">
          <img src="${iconTime}" />
          <div>
            <div class="info-label">Tempo</div>
            <div class="info-value">${recipe.prepTime}</div>
          </div>
        </div>

        <div class="info-item">
          <img src="${iconServings}" />
          <div>
            <div class="info-label">Porzioni</div>
            <div class="info-value">${recipe.servings}</div>
          </div>
        </div>

      </div>
    </div>

  </div>

  <!-- DIVISORE -->
  <div class="quadrant-divider"></div>

  <!-- RIGA INFERIORE: INGREDIENTI -->
  <div class="row-bottom">

    <div class="ingredients-wrapper">
      <div class="ingredients-title">Ingredienti</div>

<div class="ingredients-columns">

  <div class="column">
    ${col1
      .map((entry) => {
        if (entry.type === "group") {
          return `<div class="group-title">${entry.title}</div>`;
        }
        const i = entry.item;
        return `
          <div class="ingredient-row">
            <div class="checkbox"></div>
            <div>${i.quantity} ${i.unit} ${i.name}</div>
          </div>
        `;
      })
      .join("")}
  </div>

  ${
    col2.length > 0
      ? `
        <div class="column">
          ${col2
            .map((entry) => {
              if (entry.type === "group") {
                return `<div class="group-title">${entry.title}</div>`;
              }
              const i = entry.item;
              return `
                <div class="ingredient-row">
                  <div class="checkbox"></div>
                  <div>${i.quantity} ${i.unit} ${i.name}</div>
                </div>
              `;
            })
            .join("")}
        </div>
      `
      : ""
  }

</div>

    </div>

  </div>

</div>

    <!-- PAGE BREAK -->
    <div class="page-break"></div>

    <!-- PROCEDIMENTO -->
      <div class="section-title">Procedimento</div>
    </div>

    ${
      stepsWithImages.length === 1
        ? `
      <div class="step-horizontal">
        

        ${
          stepsWithImages[0].imageBase64
            ? `<img src="${stepsWithImages[0].imageBase64}" />`
            : ""
        }
        ${
          stepsWithImages[0].ocrBase64
            ? `<img src="${stepsWithImages[0].ocrBase64}" />`
            : ""
        }
        <div class="step-text">
          <div class="step-title">${stepsWithImages[0].title || ""}</div>
          <div>${stepsWithImages[0].description}</div>
        </div>
      </div>
    `
        : `
      <div class="steps-grid">
        ${stepsWithImages
          .map(
            (step, index) => `
          <div class="step-card">
            <div class="step-header">
              <div class="step-number">${index + 1}</div>
              <div class="step-title">${step.title || ""}</div>
            </div>

            ${step.imageBase64 ? `<img src="${step.imageBase64}" />` : ""}
            ${step.ocrBase64 ? `<img src="${step.ocrBase64}" />` : ""}

            <div>${step.description}</div>

            <div class="step-check-row">
              <div class="step-checkbox"></div>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    `
    }

${
  recipe.notes
    ? `
        <div class="section-title">Note</div>
      </div>

      ${
        notesImage || notesOcrImage
          ? `
            <div class="side-by-side">
              ${
                notesImage
                  ? `<img src="${notesImage}" />`
                  : notesOcrImage
                    ? `<img src="${notesOcrImage}" />`
                    : ""
              }

              <div class="text-block">
                <div class="notes">${recipe.notes.text ?? ""}</div>
              </div>
            </div>
          `
          : `
            <div class="notes">${recipe.notes.text ?? ""}</div>
          `
      }
    `
    : ""
}


    <div class="footer">Creato con APPetito</div>

  </body>
</html>
`;

    const { uri } = await Print.printToFileAsync({ html });
    return uri;
  }

  async function shareRecipePDF(recipe: Recipe) {
    try {
      const uri = await generateRecipePDF(recipe);
      await Sharing.shareAsync(uri);
    } catch (err) {
      console.log("ERRORE PDF:", err);
      Alert.alert("Errore", "Impossibile generare il PDF");
    }
  }

  const HIDDEN_TITLE = "Ingredienti";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Icona Categoria + Titolo centrato */}
        <View style={styles.titleContainer}>
          <Image
            source={CATEGORY_IMAGES[recipe.category as Category]}
            style={styles.icon}
          />
          <Text variant="title" style={styles.title}>
            {recipe.title}
          </Text>
        </View>

        {/* Info centrata */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <Text variant="small" style={styles.infoText}>
              {recipe.prepTime} min
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={20} color={COLORS.primary} />
            <Text variant="small" style={styles.infoText}>
              {recipe.servings} porz.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons
              name="pricetag-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text variant="small" style={styles.infoText}>
              {recipe.category}
            </Text>
          </View>
        </View>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {recipe.tags.map((tag: string, i: number) => (
              <View key={i} style={styles.tag}>
                <Text variant="small" style={styles.tagText}>
                  #{tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Foto principale */}
        <View style={styles.photoContainer}>
          <Image
            source={
              recipe.imageUri
                ? { uri: recipe.imageUri }
                : require("../../assets/images/default.jpg")
            }
            style={styles.mainImage}
          />
        </View>

        {(recipe.ingredientsPhoto ||
          recipe.ingredientsOcrImage ||
          ingredientGroups.some((g) => g.items.length > 0)) && (
          <View style={styles.section}>
            <Text variant="heading" style={styles.sectionTitle}>
              Ingredienti
            </Text>

            <View style={styles.separator} />

            {/* ⭐ 1. FOTO INGREDIENTI — mostrata se presente */}
            {recipe.ingredientsPhoto && (
              <Image
                source={{ uri: recipe.ingredientsPhoto }}
                style={styles.stepImage}
              />
            )}

            {/* ⭐ 2. OCR INGREDIENTI — mostrato se presente */}
            {recipe.ingredientsOcrImage && (
              <Image
                source={{ uri: recipe.ingredientsOcrImage }}
                style={styles.stepImage}
              />
            )}

            {/* ⭐ 3. LISTA INGREDIENTI — SEMPRE visibile */}
            {(ungroupedIngredients.length > 0 ||
              ingredientGroups.some((g) => g.items.length > 0)) && (
              <>
                {/* Ingredienti senza gruppo */}
                {ungroupedIngredients.length > 0 &&
                  ungroupedIngredients.map(
                    (ing: IngredientItem, index: number) => {
                      const key = `free-${index}`;
                      const isChecked = checkedIngredients[key] || false;

                      return (
                        <View key={ing.id} style={styles.ingredientRow}>
                          <TouchableOpacity
                            style={styles.checkbox}
                            onPress={() => toggleIngredientCheck(key)}
                          >
                            <Ionicons
                              name={isChecked ? "checkbox" : "square-outline"}
                              size={26}
                              color={isChecked ? "#3a8654" : "#666"}
                            />
                          </TouchableOpacity>

                          <View style={styles.verticalDivider} />

                          <View style={styles.ingredientMain}>
                            <Text
                              style={[
                                styles.ingredientName,
                                isChecked && styles.checkedText,
                              ]}
                            >
                              {ing.name}
                            </Text>

                            {ing.linkedRecipeId &&
                              (() => {
                                const linkedRecipe = recipes.find(
                                  (r) => r.id === ing.linkedRecipeId,
                                );
                                if (!linkedRecipe) return null;

                                return (
                                  <TouchableOpacity
                                    onPress={() =>
                                      router.push(`/recipe/${linkedRecipe.id}`)
                                    }
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                      marginTop: 4,
                                    }}
                                  >
                                    <Ionicons
                                      name="link-outline"
                                      size={18}
                                      color={COLORS.primary}
                                    />
                                    <Text
                                      style={{
                                        marginLeft: 6,
                                        color: COLORS.primary,
                                        fontSize: 14,
                                      }}
                                    >
                                      Vai alla ricetta
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })()}
                          </View>

                          <Text style={styles.quantityText}>
                            {ing.quantity} {ing.unit}
                          </Text>

                          <TouchableOpacity
                            style={styles.addSingleBtn}
                            onPress={() => addSingleIngredient(ing)}
                          >
                            <Ionicons
                              name="add-circle-outline"
                              size={24}
                              color={COLORS.primary}
                            />
                          </TouchableOpacity>
                        </View>
                      );
                    },
                  )}

                {/* Gruppi */}
                {ingredientGroups
                  .filter((g) => g.id !== "ungrouped" && g.items.length > 0)
                  .map((group: IngredientGroup, groupIndex: number) => (
                    <View key={group.id} style={{ marginBottom: 20 }}>
                      {!HIDDEN_TITLE.includes(group.title.trim()) && (
                        <Text variant="title" style={styles.ingredientGroup}>
                          {group.title}
                        </Text>
                      )}

                      {group.items.map((ing: IngredientItem, index: number) => {
                        const key = `${groupIndex}-${index}`;
                        const isChecked = checkedIngredients[key] || false;

                        return (
                          <View key={ing.id} style={styles.ingredientRow}>
                            <TouchableOpacity
                              style={styles.checkbox}
                              onPress={() => toggleIngredientCheck(key)}
                            >
                              <Ionicons
                                name={isChecked ? "checkbox" : "square-outline"}
                                size={26}
                                color={isChecked ? "#3a8654" : "#666"}
                              />
                            </TouchableOpacity>

                            <View style={styles.ingredientMain}>
                              <Text
                                style={[
                                  styles.ingredientName,
                                  isChecked && styles.checkedText,
                                ]}
                              >
                                {ing.name}
                              </Text>

                              {ing.linkedRecipeId &&
                                (() => {
                                  const linkedRecipe = recipes.find(
                                    (r) => r.id === ing.linkedRecipeId,
                                  );
                                  if (!linkedRecipe) return null;

                                  return (
                                    <TouchableOpacity
                                      onPress={() =>
                                        router.push(
                                          `/recipe/${linkedRecipe.id}`,
                                        )
                                      }
                                      style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        marginTop: 4,
                                      }}
                                    >
                                      <Ionicons
                                        name="link-outline"
                                        size={18}
                                        color="#4A90E2"
                                      />
                                      <Text
                                        style={{
                                          marginLeft: 6,
                                          color: "#4A90E2",
                                          fontSize: 14,
                                        }}
                                      >
                                        {linkedRecipe.title}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })()}
                            </View>

                            <Text style={styles.quantityText}>
                              {ing.quantity} {ing.unit}
                            </Text>

                            <TouchableOpacity
                              style={styles.addSingleBtn}
                              onPress={() => addSingleIngredient(ing)}
                            >
                              <Ionicons
                                name="add-circle-outline"
                                size={24}
                                color={COLORS.primary}
                              />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  ))}
              </>
            )}
          </View>
        )}

        {/* PROCEDIMENTO */}
        {recipe.steps && recipe.steps.length > 0 && (
          <View style={styles.section}>
            <Text variant="heading" style={styles.sectionTitle}>
              Procedimento
            </Text>

            <View style={styles.separator} />

            {recipe.steps.map((step: Step, index: number) => {
              const isChecked = checkedSteps[index] || false;
              const isEven = index % 2 === 0;

              return (
                <View key={index} style={styles.stepItem}>
                  {/* Header step */}
                  <View style={styles.stepHeader}>
                    {/* Numero step (solo se più di uno) */}
                    {recipe.steps.length > 1 && (
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </View>
                    )}

                    {/* Titolo step */}
                    <Text variant="title" style={styles.stepTitle}>
                      {step.title && step.title.trim().length > 0
                        ? step.title
                        : recipe.steps.length === 1
                          ? "Passaggio"
                          : `Passaggio ${index + 1}`}
                    </Text>
                  </View>

                  {/* Contenuto step */}
                  <View style={isEven ? styles.stepEven : styles.stepOdd}>
                    {step.imageUri && (
                      <Image
                        source={{ uri: step.imageUri }}
                        style={styles.stepImage}
                      />
                    )}

                    {step.textImageUri && (
                      <Image
                        source={{ uri: step.textImageUri }}
                        style={[styles.stepImage, { marginTop: 12 }]}
                      />
                    )}

                    <Text
                      style={[styles.stepText, isChecked && styles.checkedText]}
                    >
                      {step.description || ""}
                    </Text>
                  </View>

                  {/* Timer */}
                  <View style={styles.stepFooter}>
                    <TouchableOpacity
                      style={styles.timerButton}
                      onPress={() =>
                        router.push({
                          pathname: "/timer",
                          params: { title: step.title || `Step ${index + 1}` },
                        })
                      }
                    >
                      <Ionicons
                        name="time-outline"
                        size={26}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.stepDivider} />
                </View>
              );
            })}
          </View>
        )}

        {/* NOTE E CURIOSITÀ */}
        {(() => {
          const notes =
            typeof recipe.notes === "string"
              ? { text: recipe.notes, image: null, mode: "text" }
              : recipe.notes;

          const images = notes?.image;
          const text = notes?.text;

          if (!text && (!images || images.length === 0)) return null;

          return (
            <View style={styles.section}>
              <Text variant="heading" style={styles.sectionTitle}>
                Note e curiosità
              </Text>

              <View style={styles.separator} />

              {/* Foto note */}
              {images && images.length > 0 && (
                <View style={{ gap: 12, marginBottom: 16 }}>
                  {notes.image && (
                    <Image
                      source={{ uri: notes.image }}
                      style={{
                        width: "100%",
                        height: 500,
                        borderRadius: 12,
                        backgroundColor: "#eee",
                        marginBottom: 10,
                      }}
                    />
                  )}
                </View>
              )}

              {/* Testo note */}
              {text && <Text style={styles.notesText}>{text}</Text>}
            </View>
          );
        })()}

        {/* CARD DEI PULSANTI */}
        <View style={styles.actionsGrid}>
          {/* Modifica */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/edit/${recipe.id}` as any)}
          >
            <Ionicons
              name="create-outline"
              size={22}
              style={styles.actionIcon}
            />
            <Text variant="title" style={styles.actionText}>
              Modifica
            </Text>
          </TouchableOpacity>

          {/* Elimina */}
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Ionicons
              name="trash-outline"
              size={22}
              style={styles.actionIcon}
            />
            <Text variant="title" style={styles.actionText}>
              Elimina
            </Text>
          </TouchableOpacity>

          {/* Condividi */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => shareRecipePDF(recipe)}
          >
            <Ionicons
              name="share-outline"
              size={22}
              style={styles.actionIcon}
            />
            <Text variant="title" style={styles.actionText}>
              Condividi
            </Text>
          </TouchableOpacity>

          {/* Ricalcola */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/scale/${recipe.id}` as any)}
          >
            <Ionicons
              name="calculator-outline"
              size={22}
              style={styles.actionIcon}
            />
            <Text variant="title" style={styles.actionText}>
              Ricalcola
            </Text>
          </TouchableOpacity>

          {/* Aggiungi alla spesa */}
          <TouchableOpacity
            style={[styles.actionButton, styles.fullWidthButton]}
            onPress={() => {
              addToShoppingList(
                recipe.ingredients.flatMap((group) =>
                  group.items.map((ing) => ({
                    ...ing,
                    checked: false,
                    linkedRecipeId: ing.linkedRecipeId ?? undefined, // ⭐ FIX
                  })),
                ),
              );

              showAddedToast();
            }}
          >
            <Ionicons name="cart-outline" size={22} style={styles.actionIcon} />
            <Text variant="title" style={styles.actionText}>
              Aggiungi alla spesa
            </Text>
          </TouchableOpacity>
        </View>

        <SuccessToast
          visible={toastVisible}
          message="Ingredienti aggiunti alla spesa"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: "#fffaf0",
  },
  scrollContent: { paddingBottom: 40 },
  titleContainer: {
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    textAlign: "center",
    marginTop: 8,
    color: COLORS.text,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginBottom: 20,
  },
  infoItem: { alignItems: "center" },
  infoText: { marginTop: 4, fontSize: 15, color: COLORS.text },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  tag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: { fontSize: 14, color: COLORS.text },
  photoContainer: { width: "100%", marginBottom: 24 },
  mainImage: { width: "100%", height: 200 },
  section: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 25,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    fontSize: 21,
    marginBottom: 16,
    color: COLORS.text,
    textAlign: "center",
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  checkbox: {
    marginRight: 10,
  },
  ingredientMain: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    color: COLORS.text,
  },
  checkedText: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  quantityText: {
    fontSize: 16,
    color: COLORS.text,
    marginRight: 8,
  },
  addSingleBtn: {
    paddingLeft: 4,
  },
  ingredientGroup: {
    fontSize: 18,
    marginBottom: 8,
    color: COLORS.text,
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginBottom: 12,
  },
  icon: {
    height: 60,
    width: 60,
    marginBottom: 10,
    alignSelf: "center",
  },
  stepItem: { marginBottom: 20 },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    textAlign: "center",
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  stepNumberText: { color: "white", fontWeight: "bold" },
  stepTitle: { fontSize: 18, color: COLORS.text, textAlign: "center" },
  stepEven: { marginTop: 10 },
  stepOdd: { marginTop: 10 },
  stepImage: {
    width: "100%",
    height: 500,
    borderRadius: 12,
    marginBottom: 12,
  },
  stepText: { fontSize: 16, color: COLORS.text, padding: 10 },
  stepFooter: { marginTop: 10, alignItems: "flex-end" },
  timerButton: { padding: 6 },
  stepDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginTop: 20,
  },

  notesText: {
    fontSize: 16,
    color: COLORS.text,
    paddingHorizontal: 10,
    paddingTop: -30,
  },

  actionsGrid: {
    marginHorizontal: 16,
    marginBottom: 40,
    padding: 18,

    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  actionButton: {
    width: "48%",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidthButton: { width: "100%" },
  actionIcon: { color: "white", marginBottom: 6 },
  actionText: { color: "white", fontSize: 16, textAlign: "center" },
  verticalDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "#e0e0e0",
    marginHorizontal: 8,
  },
});
