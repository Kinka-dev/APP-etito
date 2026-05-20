import { useEffect, useState } from "react";
import { Dimensions, Image } from "react-native";

export function useDynamicImageSize(uri?: string | null) {
  const [ratio, setRatio] = useState<number | null>(null);

  useEffect(() => {
    if (!uri) return;

    Image.getSize(
      uri,
      (width, height) => {
        setRatio(width / height); // ⭐ mantiene proporzioni reali
      },
      () => {
        setRatio(1); // fallback quadrato
      },
    );
  }, [uri]);

  const containerWidth = Dimensions.get("window").width - 40;

  return {
    width: containerWidth,
    aspectRatio: ratio ?? 1, // ⭐ nessuna distorsione
  };
}
