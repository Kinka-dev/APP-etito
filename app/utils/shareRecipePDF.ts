import { Recipe } from "@/src/types";
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
    const iconPeople = await loadIconBase64(
      require("../../assets/icons/people-outline.png"),
    );

    const iconTime = await loadIconBase64(
      require("../../assets/icons/time-outline.png"),
    );

    const iconFlame = await loadIconBase64(
      require("../../assets/icons/flame-outline.png"),
    );

    const iconCategory = await loadIconBase64(
      require("../../assets/icons/pricetag-outline.png"),
    );

    // IMMAGINE PRINCIPALE
    const mainImage = await uriToBase64(recipe.imageUri ?? null);

    // IMMAGINE DI DEFAULT
    const defaultImageBase64 = await loadIconBase64(
      require("../../assets/images/senza-immagine.jpg"),
    );

    // STEP (immagini + OCR)
    const stepsWithImages = await Promise.all(
      recipe.steps.map(async (s) => ({
        ...s,
        imageBase64: await uriToBase64(s.imageUri ?? null),
        ocrBase64: await uriToBase64(s.textImageUri ?? null),
      })),
    );

    // ⭐ FUNZIONE COLONNE DINAMICHE
    function splitIngredientsIntoTwoColumns(groups: any[]) {
      const rows: any[] = [];

      groups.forEach((g: any) => {
        if (!g.items || g.items.length === 0) return;

        rows.push({ type: "title", title: g.title });

        g.items.forEach((i: any) => {
          rows.push({ type: "item", item: i });
        });
      });

      const half = Math.ceil(rows.length / 2);

      return [rows.slice(0, half), rows.slice(half)];
    }

    const [col1, col2] = splitIngredientsIntoTwoColumns(recipe.ingredients);

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
    margin: 0;
    padding: 0;
    color: #000;
    line-height: 1.8; /* ⭐ arioso */
  }

  .page {
    page-break-after: always;
    padding: 40px;
    padding-bottom: 60px
  }

  .page::after {
  content: "";
  display: block;
  height: 20px; 
}

  /* --- CATEGORIA --- */

  .category {
    text-align: center;
    color: #777; /* ⭐ grigio */
    font-size: 16px;
    margin-bottom: 10px;
  }

  /* --- TITOLO --- */

  .title {
    text-align: center;
    font-size: 45px;
    font-weight: 700;
    margin: 0 0 10px 0;
    
  }

  /* --- INFO BASE --- */

  .info-base {
    text-align: center;
    font-size: 16px;
    margin-bottom: 30px;
    color: #444;
  }

  /* --- BLOCCO FOTO + NOTE --- */

  .photo-notes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    height: 300px;
    gap: 40px;
    margin-bottom: 40px;
    border-top: 1px solid "#eee";
  }

  .photo-notes img {
    width: 100%;
    height: 250px;
    object-fit: cover;
    border-radius: 20px;
    padding: 10px;
  }

  .notes-right {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    text-align: left; /* ⭐ allineato a destra */
    padding: 0 10px;
  }

  .section-title {
    font-weight: 700;
    font-size: 18px;
    color: #000;
    height: 40px;
    line-height: 40px;
    text-align: center;
  }

  .notes-text {
    font-size: 16px;
    margin-top: 10px;
  }

  /* --- INGREDIENTI --- */

  .ingredients-block {
  margin-top: 20px;
  min-height: 400px; /* ⭐ garantisce che si estenda */
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}


  .ingredients-block {
    margin-top: 40px;
    text-align: center;
  }

  .ingredients-columns {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 30px;
}

.col {
  width: 45%; /* ⭐ larghezza fissa */
}

.ingredient-title {
  font-weight: 700;
  margin-bottom: 6px;
}

.ingredient-row {
  border-bottom: 1px solid #ddd;
  padding: 10px 0;
  font-size: 16px;
  display: flex;
  justify-content: space-between;
}


  .checkbox {
    width: 14px;
    height: 14px;
    border: 1px solid #000;
    margin-left: 10px;
    margin-top: 10px;
  }


  /* --- PROCEDIMENTI --- */

.procedures-page {
  padding-top: 40px;
  padding-bottom: 40px;
}

.procedures-page::after {
  content: "";
  display: block;
  height: 20px;
}

/* Contenitore dello step */
.step {
  page-break-inside: avoid;
  border-bottom: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 15px; 
    padding: 20px 0 20px 0;

}

.step-title {
  text-align: center;
  font-weight: 700;
  font-size: 18px;
  text-decoration: underline;
  margin-bottom: 5px;
}

/* Riga contenuto a 3 colonne */
.step-row {
  display: grid;
  grid-template-columns: 20px 100px 1fr 20px;
  gap: 20px;
  align-items: start; 
  position: relative;
  

}

.step-row > * {
  position: relative;
  

  
}

.step-row > *:not(:last-child)::after {
  content: "";
  position: absolute;
  right: -10px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #eee;
}

/* Numero */
.step-number {
  width: 20px;
  height: 20px;
  font-size: 25px;
  font-weight: 700;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Colonna destra */
.step-right {
  display: flex;
  flex-direction: column;
  gap: 20px; 
  padding-left: 20px;
  border-left: 1px solid #eee;
  padding-right: 20px;
}

/* Contenitore immagine + testo */
.step-content-row {
  display: flex;
  gap: 20px;
  align-items: flex-start; 
}

/* Immagine */
.step-image {
  width: 100px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
}

/* Testo dello step */
.step-text {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* Checkbox */
.step-checkbox {
  width: 14px;
  height: 14px;
  border: 1px solid #000;
  margin-top: 0;
  align-self: center;
}

.step-text p {
  margin: 0; /* ⭐ evita che il testo parta più in basso */
  padding: 0;
}

.step-row.no-image {
  grid-template-columns: 20px 1fr 20px;
}

.step-right.only-text {
  justify-content: center; 
}

.step-right.only-text .step-text {
  justify-content: center; 
  margin-top: 10px;
}

.title-separator {
  width: 100%;
  height: 1px;
  background: #ccc;
  margin: 10px 0 10px 0;
}


</style>
  </head>

  <body>

    <!-- ⭐ PAGINA 1 -->
    <div class="page">

   <!-- CATEGORIA -->
  <div class="category">• • • ${recipe.category} • • •</div>

  <!-- TITOLO -->
  <div class="title">${recipe.title}</div>
  <div class="title-separator"></div>

  <!-- INFO BASE -->
  <div class="info-base">
  ${recipe.servings} porzioni &nbsp; | &nbsp; ${recipe.prepTime} min prep &nbsp; | &nbsp; ${recipe.cookTime ?? "-"} min cottura
</div>


  <!-- FOTO + NOTE -->
  <div class="photo-notes">

    <img src="${mainImage || defaultImageBase64}" />

    <div class="notes-right">
      <div class="section-title">Note</div>
        <div class="title-separator"></div>

      <div class="notes-text">
        ${recipe.notes?.text ?? ""}
      </div>
    </div>

  </div>

  <!-- INGREDIENTI -->
  <div class="ingredients-block">

  <div class="section-title">Ingredienti</div>
    <div class="title-separator"></div>


  <div class="ingredients-columns">

    <!-- COLONNA 1 -->
    <div class="col">
    ${col1
      .map((row: any) => {
        if (row.type === "title") {
          const t = row.title?.trim().toLowerCase();
          if (!t || t === "ingredienti") {
            return ""; // ⭐ non mostrare il titolo
          }
          return `<div class="ingredient-title">${row.title}</div>`;
        }

        const i = row.item;
        return `
      <div class="ingredient-row">
        <span>${i.name} — ${i.quantity} ${i.unit}</span>
        <span class="checkbox"></span>
      </div>
    `;
      })
      .join("")}
    </div>

    <!-- COLONNA 2 -->
    <div class="col">
      ${col2
        .map((row: any) => {
          if (row.type === "title") {
            const t = row.title?.trim().toLowerCase();
            if (!t || t === "ingredienti") {
              return "";
            }
            return `<div class="ingredient-title">${row.title}</div>`;
          }

          const i = row.item;
          return `
      <div class="ingredient-row">
        <span>${i.name} — ${i.quantity} ${i.unit}</span>
        <span class="checkbox"></span>
      </div>
    `;
        })
        .join("")}
    </div>

  </div>

</div>



<div class="procedures-page">
<div class="page">

  <div class="section-title">Procedimenti</div>
    <div class="title-separator"></div>


<div style="margin-top:40px"></div>

${stepsWithImages
  .map((s: any, i: number) => {
    const hasImage = !!s.imageBase64;
    const isSingle = stepsWithImages.length === 1;

    return `
      <div class="step">

        <!-- TITOLO STEP -->
        ${s.title ? `<div class="step-title">${s.title}</div>` : ""}

        <!-- RIGA A 3 COLONNE -->
        <div class="step-row ${hasImage ? "" : "no-image"}">

          <!-- COLONNA 1: NUMERO -->
          ${
            isSingle ? `<div></div>` : `<div class="step-number">${i + 1}</div>`
          }

          <!-- COLONNA 2: IMMAGINE (se presente) -->
          ${hasImage ? `<img class="step-image" src="${s.imageBase64}" />` : ""}

          <!-- COLONNA 3: TESTO -->
          <div class="step-text">
            <p>${s.description || ""}</p>
          </div>

          <div class="step-checkbox"></div>

        </div>

      </div>
    `;
  })
  .join("")}



</div>
</div>


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
