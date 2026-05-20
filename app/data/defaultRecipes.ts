import { Recipe } from "@/src/types";
import uuid from "react-native-uuid";

function uid() {
  return uuid.v4() as string;
}

export const DEFAULT_RECIPES: Recipe[] = [
  /* ---------------------------------------------------------
     1) SPAGHETTO AL POMODORO
  --------------------------------------------------------- */
  {
    id: "default-spaghetto-pomodoro",
    title: "Spaghetto al Pomodoro",
    category: "primi",
    prepTime: 20,
    servings: 2,
    imageUri: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    ingredients: [
      {
        id: uid(),
        title: "Ingredienti",
        items: [
          {
            id: uid(),
            name: "Spaghetti",
            quantity: "200",
            unit: "g",
          },
          {
            id: uid(),
            name: "Pomodori pelati",
            quantity: "300",
            unit: "g",
          },
          {
            id: uid(),
            name: "Olio extravergine",
            quantity: "2",
            unit: "cucchiai",
          },
          {
            id: uid(),
            name: "Aglio",
            quantity: "1",
            unit: "spicchio",
          },
          {
            id: uid(),
            name: "Sale",
            quantity: "q.b.",
            unit: "",
          },
          {
            id: uid(),
            name: "Basilico",
            quantity: "q.b.",
            unit: "",
          },
        ],
      },
    ],

    steps: [
      {
        id: uid(),
        title: "",
        description: "Soffriggi l'aglio nell'olio.",
        checked: false,
        imageUri: null,
        textImageUri: null,
      },
      {
        id: uid(),
        title: "",
        description: "Aggiungi i pomodori e cuoci 10 minuti.",
        checked: false,
        imageUri: null,
        textImageUri: null,
      },
      {
        id: uid(),
        title: "",
        description: "Cuoci gli spaghetti in acqua salata.",
        checked: false,
        imageUri: null,
        textImageUri: null,
      },
      {
        id: uid(),
        title: "",
        description: "Scola e manteca con il sugo e basilico.",
        checked: false,
        imageUri: null,
        textImageUri: null,
      },
    ],

    notes: {
      text: "",
      image: null,
      ocrImage: null,
      mode: "text",
    },
  },

  /* ---------------------------------------------------------
     2) PAN BRIOCHE
  --------------------------------------------------------- */
  {
    id: "default-pan-brioche",
    title: "Pan Brioche",
    category: "impasti",
    prepTime: 180,
    servings: 8,
    imageUri: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    ingredients: [
      {
        id: uid(),
        title: "Ingredienti",
        items: [
          {
            id: uid(),
            name: "Farina 00",
            quantity: "500",
            unit: "g",
          },
          {
            id: uid(),
            name: "Latte",
            quantity: "250",
            unit: "ml",
          },
          {
            id: uid(),
            name: "Burro",
            quantity: "80",
            unit: "g",
          },
          {
            id: uid(),
            name: "Zucchero",
            quantity: "80",
            unit: "g",
          },
          {
            id: uid(),
            name: "Lievito di birra",
            quantity: "10",
            unit: "g",
          },
          {
            id: uid(),
            name: "Uova",
            quantity: "2",
            unit: "",
          },
          {
            id: uid(),
            name: "Sale",
            quantity: "8",
            unit: "g",
          },
        ],
      },
    ],

    steps: [
      {
        id: uid(),
        title: "",
        description: "Sciogli il lievito nel latte tiepido.",
        checked: false,
        imageUri: null,
        textImageUri: null,
      },
      {
        id: uid(),
        title: "",
        description: "Impasta farina, zucchero, uova e latte.",
        checked: false,
        imageUri: null,
        textImageUri: null,
      },
      {
        id: uid(),
        title: "",
        description: "Aggiungi il burro morbido e il sale.",
        checked: false,
        imageUri: null,
        textImageUri: null,
      },
      {
        id: uid(),
        title: "",
        description: "Fai lievitare 2 ore.",
        checked: false,
        imageUri: null,
        textImageUri: null,
      },
      {
        id: uid(),
        title: "",
        description: "Forma il pan brioche e fai lievitare 1 ora.",
        checked: false,
        imageUri: null,
        textImageUri: null,
      },
      {
        id: uid(),
        title: "",
        description: "Cuoci a 170°C per 30–35 minuti.",
        checked: false,
        imageUri: null,
        textImageUri: null,
      },
    ],

    notes: {
      text: "",
      image: null,
      ocrImage: null,
      mode: "text",
    },
  },

  /* ---------------------------------------------------------
     3) PASTA FRESCA FATTA IN CASA
  --------------------------------------------------------- */
  {
    id: "default-pasta-fresca",
    title: "Pasta Fresca Fatta in Casa",
    category: "impasti",
    prepTime: 60,
    servings: 4,
    imageUri: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    ingredients: [
      {
        id: uid(),
        title: "Ingredienti",
        items: [
          {
            id: uid(),
            name: "Farina 00",
            quantity: "300",
            unit: "g",
          },
          {
            id: uid(),
            name: "Uova",
            quantity: "3",
            unit: "",
          },
          {
            id: uid(),
            name: "Sale",
            quantity: "1",
            unit: "pizzico",
          },
        ],
      },
    ],

    steps: [
      {
        id: uid(),
        title: "",
        description: "Disponi la farina a fontana e aggiungi le uova.",
        checked: false,
        imageUri: null,
        textImageUri: null,
      },
      {
        id: uid(),
        title: "",
        description: "Impasta fino a ottenere un panetto liscio.",
        checked: false,
        imageUri: null,
        textImageUri: null,
      },
      {
        id: uid(),
        title: "",
        description: "Riposa 30 minuti al coperto.",
        checked: false,
        imageUri: null,
        textImageUri: null,
      },
      {
        id: uid(),
        title: "",
        description: "Stendi la pasta e taglia nel formato desiderato.",
        checked: false,
        imageUri: null,
        textImageUri: null,
      },
    ],

    notes: {
      text: "",
      image: null,
      ocrImage: null,
      mode: "text",
    },
  },
];
