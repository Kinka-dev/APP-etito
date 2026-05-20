import { CATEGORY_IMAGES } from "@/constants/categories";
import { Category, Recipe } from "@/src/types";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

export async function shareRecipePDF(recipe: Recipe) {
  try {
    const uri = await generateRecipePDF(recipe);
    await Sharing.shareAsync(uri);
  } catch (err) {
    console.log("ERRORE PDF:", err);
    Alert.alert("Errore", "Impossibile generare il PDF");
  }
}

// ⭐ FUNZIONI PDF (rimangono identiche)
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

async function loadLogoBase64() {
  const asset = Asset.fromModule(require("../../assets/images/logo.png"));
  await asset.downloadAsync();

  const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
    encoding: "base64",
  });

  return `data:image/png;base64,${base64}`;
}

async function generateRecipePDF(recipe: Recipe) {
  try {
    // FONT
    const fontBase64 = await loadFontBase64();

    // LOGO
    const logoBase64 = await loadLogoBase64();

    // ICONA CATEGORIA
    const iconCategory = await loadIconBase64(
      CATEGORY_IMAGES[recipe.category as Category],
    );

    // ICONA TEMPO
    const iconTime = await loadIconBase64(
      require("../../assets/images/orologio.png"),
    );

    // ICONA PORZIONI
    const iconServings = await loadIconBase64(
      require("../../assets/images/porzioni.png"),
    );

    // IMMAGINE PRINCIPALE
    const mainImage = await uriToBase64(recipe.imageUri ?? null);

    // IMMAGINE DI DEFAULT
    const defaultImageBase64 = await loadIconBase64(
      require("../../assets/images/senza-immagine.jpg"),
    );

    // FOTO OCR INGREDIENTI
    const ingredientsOcrImage = await uriToBase64(
      recipe.ingredientsPhoto ?? null,
    );

    // NOTE
    const notesImage = await uriToBase64(recipe.notes?.image ?? null);
    const notesOcrImage = await uriToBase64(recipe.notes?.ocrImage ?? null);

    // STEP (immagini + OCR)
    const stepsWithImages = await Promise.all(
      recipe.steps.map(async (s) => ({
        ...s,
        imageBase64: await uriToBase64(s.imageUri ?? null),
        ocrBase64: await uriToBase64(s.textImageUri ?? null),
      })),
    );
    function splitIngredientsForPdf(ingredients: any[]) {
      const groups = ingredients || [];

      const col1: any[] = [];
      const col2: any[] = [];

      let toggle = true;

      groups.forEach((group) => {
        if (!group.items || group.items.length === 0) return;

        if (toggle) col1.push(group);
        else col2.push(group);

        toggle = !toggle;
      });

      return { col1, col2 };
    }

    // INGREDIENTI — DIVISI IN DUE COLONNE
    const { col1, col2 } = splitIngredientsForPdf(recipe.ingredients);

    // HTML PDF
    const html = `
<html>
  <head>
    <style>
      @font-face {
        font-family: 'Outfit';
        src: url(${fontBase64});
      }

      body {
        font-family: 'Outfit';
        padding: 28px;
        color: #333;
        line-height: 1.45;
      }

      h1 {
        text-align: center;
        font-size: 28px;
        margin-bottom: 6px;
      }

      .logo {
        width: 90px;
        margin: 0 auto 20px auto;
        display: block;
      }

      .info-row {
        display: flex;
        justify-content: center;
        gap: 40px;
        margin: 20px 0;
      }

      .info-item {
        text-align: center;
        font-size: 14px;
      }

      .info-item img {
        width: 30px;
        margin-bottom: 4px;
      }

      .main-image {
        width: 100%;
        border-radius: 14px;
        margin: 20px 0;
      }

      h2 {
        font-size: 22px;
        margin-top: 40px;
        margin-bottom: 12px;
        border-bottom: 2px solid #eee;
        padding-bottom: 6px;
      }

      h3 {
        font-size: 17px;
        margin-top: 18px;
        margin-bottom: 6px;
      }

      ul {
        padding-left: 18px;
        margin-top: 4px;
      }

      li {
        margin-bottom: 4px;
      }

      .ingredients {
        display: flex;
        gap: 30px;
      }

      .col {
        width: 50%;
      }

      .step {
        margin-bottom: 28px;
        padding-bottom: 18px;
        border-bottom: 1px solid #ddd;
      }

      .step img {
        width: 100%;
        border-radius: 10px;
        margin-top: 10px;
      }
    </style>
  </head>

  <body>

    <!-- LOGO -->
    <img src="${logoBase64}" class="logo" />

    <h1>${recipe.title}</h1>

    <div class="info-row">
      <div class="info-item">
        <img src="${iconTime}" />
        <div>${recipe.prepTime} min</div>
      </div>

      <div class="info-item">
        <img src="${iconServings}" />
        <div>${recipe.servings} porzioni</div>
      </div>

      <div class="info-item">
        <img src="${iconCategory}" />
        <div>${recipe.category}</div>
      </div>
    </div>

    <img 
      src="${mainImage || defaultImageBase64}" 
      class="main-image"
    />

    <h2>Ingredienti</h2>

    ${
      ingredientsOcrImage
        ? `<img src="${ingredientsOcrImage}" style="width:100%; margin-bottom:20px;" />`
        : ""
    }

    <div class="ingredients">
      <div class="col">
        ${col1
          .map(
            (g: any) => `
      <h3>${g.title}</h3>
      <ul>
        ${g.items
          .map((i: any) => `<li>${i.quantity} ${i.unit} — ${i.name}</li>`)
          .join("")}
      </ul>
    `,
          )
          .join("")}

      </div>

      <div class="col">
        ${col2
          .map(
            (g: any) => `
      <h3>${g.title}</h3>
      <ul>
        ${g.items
          .map((i: any) => `<li>${i.quantity} ${i.unit} — ${i.name}</li>`)
          .join("")}
      </ul>
    `,
          )
          .join("")}

      </div>
    </div>

    <h2>Procedimento</h2>

    ${stepsWithImages
      .map(
        (s, i) => `
      <div class="step">
        <h3>Step ${i + 1} — ${s.title || ""}</h3>
        <p>${s.description || ""}</p>

        ${s.imageBase64 ? `<img src="${s.imageBase64}" />` : ""}

        ${s.ocrBase64 ? `<img src="${s.ocrBase64}" />` : ""}
      </div>
    `,
      )
      .join("")}

    ${recipe.notes?.text || notesImage || notesOcrImage ? `<h2>Note</h2>` : ""}

    ${
      notesImage
        ? `<img src="${notesImage}" style="width:100%; margin-bottom:20px;" />`
        : ""
    }

    ${
      notesOcrImage
        ? `<img src="${notesOcrImage}" style="width:100%; margin-bottom:20px;" />`
        : ""
    }

    ${recipe.notes?.text ? `<p>${recipe.notes.text}</p>` : ""}

  </body>
</html>
`;

    // ⭐ GENERA PDF
    const { uri } = await Print.printToFileAsync({ html });

    // ⭐ OBBLIGATORIO → restituisce la stringa
    return uri;
  } catch (err) {
    console.log("ERRORE PDF:", err);
    throw err;
  }
}
