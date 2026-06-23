// chooseImageSource.ts
import { normalizeImage } from "@/app/utils/normalizeImage";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { ActionSheetIOS, Alert, Platform } from "react-native";

// DICHIARAZIONE GLOBALE (fix TypeScript)
declare global {
  var _onCrop: undefined | ((base64: string) => void);
}

// Inizializziamo la variabile globale
globalThis._onCrop = undefined;

export function useChooseImageSource(onPick: (uri: string) => void) {
  const openCropper = async (uri: string) => {
    // ⭐ 1) Normalizza PRIMA di tutto
    const normalized = await normalizeImage(uri);

    // ⭐ 2) Salviamo la callback globale
    globalThis._onCrop = onPick;

    // ⭐ 3) Convertiamo in base64 SOLO l'immagine normalizzata
    router.push({
      pathname: "/CropScreen",
      params: { uri: normalized, height: 300 },
    });
  };

  const chooseImageSource = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Annulla", "Scatta foto", "Scegli dalla galleria"],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            const result = await ImagePicker.launchCameraAsync({
              quality: 0.9,
            });
            if (!result.canceled) openCropper(result.assets[0].uri);
          }

          if (buttonIndex === 2) {
            const result = await ImagePicker.launchImageLibraryAsync({
              quality: 0.9,
            });
            if (!result.canceled) openCropper(result.assets[0].uri);
          }
        },
      );
    } else {
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
              if (!result.canceled) openCropper(result.assets[0].uri);
            },
          },
          {
            text: "Scegli dalla galleria",
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                quality: 0.9,
              });
              if (!result.canceled) openCropper(result.assets[0].uri);
            },
          },
          { text: "Annulla", style: "cancel" },
        ],
        { cancelable: true },
      );
    }
  };

  return chooseImageSource;
}
