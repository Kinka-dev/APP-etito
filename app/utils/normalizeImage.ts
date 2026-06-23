import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "react-native";

export const normalizeImage = async (uri: string) => {
  const { width, height } = await new Promise<{
    width: number;
    height: number;
  }>((resolve) => {
    Image.getSize(uri, (w, h) => resolve({ width: w, height: h }));
  });

  const MAX = 2000;
  let newW = width;
  let newH = height;

  if (width > MAX || height > MAX) {
    const scale = Math.min(MAX / width, MAX / height);
    newW = Math.round(width * scale);
    newH = Math.round(height * scale);
  }

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ rotate: 0 }, { resize: { width: newW, height: newH } }],
    {
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return result.uri;
};
