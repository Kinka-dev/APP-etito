// Mappa per convertire frazioni Unicode in numeri
const FRACTIONS_MAP: Record<string, number> = {
  "¼": 0.25,
  "½": 0.5,
  "¾": 0.75,
  "⅐": 1 / 7,
  "⅑": 1 / 9,
  "⅒": 0.1,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅕": 0.2,
  "⅖": 0.4,
  "⅗": 0.6,
  "⅘": 0.8,
  "⅙": 1 / 6,
  "⅚": 5 / 6,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

// Quantità scritte in lettere
const NUMBER_WORDS: Record<string, number> = {
  uno: 1,
  una: 1,
  un: 1,
  due: 2,
  tre: 3,
  quattro: 4,
  cinque: 5,
  sei: 6,
  sette: 7,
  otto: 8,
  nove: 9,
  dieci: 10,
  mezzo: 0.5,
  mezza: 0.5,
};

// Unità di misura normalizzate
const UNITS = [
  "g",
  "gr",
  "grammi",
  "kg",
  "ml",
  "l",
  "cl",
  "dl",
  "spicchio",
  "spicchi",
  "cucchiaio",
  "cucchiai",
  "cucchiaino",
  "cucchiaini",
  "bustina",
  "bustine",
  "tazza",
  "tazze",
  "q.b.",
  "qb",
  "q b",
  "q.b",
];

export function parseIngredientLine(line: string) {
  if (!line.trim()) {
    return { quantity: null, unit: null, name: "" };
  }

  // 0️⃣ Normalizzazione OCR
  let text = line
    .toLowerCase()
    .replace(/•|-|\*/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Correzioni OCR comuni
  const OCR_FIXES: Record<string, string> = {
    aglo: "aglio",
    splcchi: "spicchi",
    splccho: "spicchio",
    melanzzne: "melanzane",
  };
  for (const wrong in OCR_FIXES) {
    text = text.replace(new RegExp(wrong, "gi"), OCR_FIXES[wrong]);
  }

  let quantity: string | null = null;
  let unit: string | null = null;

  // 1️⃣ Riconoscimento Q.B. in tutte le varianti
  const qbRegex = /q\s*\.?\s*b\.?/gi;
  if (qbRegex.test(text)) {
    unit = "Q.B.";
    text = text.replace(qbRegex, "").trim();
  }

  // 2️⃣ Intervalli (200–250 g)
  const rangeRegex = /(\d+)\s*[-–]\s*(\d+)/;
  const rangeMatch = text.match(rangeRegex);
  if (rangeMatch) {
    quantity = `${rangeMatch[1]}-${rangeMatch[2]}`;
    text = text.replace(rangeMatch[0], "").trim();
  }

  // 3️⃣ Quantità attaccate all’unità (500g, 200ml)
  const attachedQtyRegex = /(\d+(?:[.,]\d+)?)(g|gr|kg|ml|l|cl|dl)/;
  const attachedMatch = text.match(attachedQtyRegex);
  if (attachedMatch) {
    quantity = attachedMatch[1].replace(",", ".");
    unit = attachedMatch[2];

    if (unit === "gr") unit = "g";

    text = text.replace(attachedMatch[0], "").trim();
  }

  // 4️⃣ Quantità ovunque nella riga
  if (!quantity) {
    const qtyRegex = /(\d+(?:[.,]\d+)?)/;
    const qtyMatch = text.match(qtyRegex);
    if (qtyMatch) {
      quantity = qtyMatch[1].replace(",", ".");
      text = text.replace(qtyMatch[0], "").trim();
    }
  }

  // 5️⃣ Quantità in lettere
  const NUMBER_WORDS: Record<string, number> = {
    uno: 1,
    una: 1,
    un: 1,
    due: 2,
    tre: 3,
    quattro: 4,
    cinque: 5,
    sei: 6,
    sette: 7,
    otto: 8,
    nove: 9,
    dieci: 10,
    mezzo: 0.5,
    mezza: 0.5,
  };

  if (!quantity) {
    const firstWord = text.split(" ")[0];
    if (NUMBER_WORDS[firstWord] !== undefined) {
      quantity = String(NUMBER_WORDS[firstWord]);
      text = text.replace(firstWord, "").trim();
    }
  }

  // 6️⃣ Riconoscimento unità SOLO se valide
  const VALID_UNITS = [
    "g",
    "gr",
    "kg",
    "ml",
    "l",
    "cl",
    "dl",
    "spicchio",
    "spicchi",
    "cucchiaio",
    "cucchiai",
    "cucchiaino",
    "cucchiaini",
    "bustina",
    "bustine",
    "tazza",
    "tazze",
    "q.b.",
  ];

  if (!unit) {
    const unitRegex = /^([a-zàèéìòù]+)\b/;
    const unitMatch = text.match(unitRegex);

    if (unitMatch) {
      let candidate: string | null = unitMatch[1];

      // normalizzazione
      if (candidate === "gr") candidate = "g";

      // ⭐ REGOLA: "g" è SEMPRE un'unità
      if (candidate === "g") {
        unit = "g";
        text = text.replace(unitMatch[0], "").trim();
      } else {
        // altre unità valide
        const VALID_UNITS = [
          "kg",
          "ml",
          "l",
          "cl",
          "dl",
          "spicchio",
          "spicchi",
          "cucchiaio",
          "cucchiai",
          "cucchiaino",
          "cucchiaini",
          "bustina",
          "bustine",
          "tazza",
          "tazze",
          "q.b.",
        ];

        if (VALID_UNITS.includes(candidate)) {
          unit = candidate;
          text = text.replace(unitMatch[0], "").trim();
        }
      }
    }
  }
  // ⭐ Se il testo rimanente finisce con "g" isolata → è unità
  // ⭐ Se il testo rimanente finisce con un'unità isolata → è unità
  if (!unit) {
    const trailingUnitRegex = /\b(g|kg|ml|l|cl|dl)\b$/;
    const match = text.match(trailingUnitRegex);

    if (match) {
      unit = match[1];
      text = text.replace(trailingUnitRegex, "").trim();
    }
  }

  // 7️⃣ Nome = tutto ciò che resta
  const name = text.trim();

  return {
    quantity,
    unit,
    name,
  };
}
