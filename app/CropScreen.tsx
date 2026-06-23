import * as ImageManipulator from "expo-image-manipulator";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function CropScreen() {
  const { uri, cropHeight, cropWidth } = useLocalSearchParams();
  const imageUri = Array.isArray(uri) ? uri[0] : uri;

  const CROP_HEIGHT = Number(cropHeight) || 300;
  const CROP_WIDTH = Number(cropWidth) || SCREEN_WIDTH;

  // Gesture values
  const userScale = useSharedValue(1);
  const savedUserScale = useSharedValue(1);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const rotation = useSharedValue(0); // 0, 90, 180, 270

  // PINCH
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      userScale.value = savedUserScale.value * e.scale;
    })
    .onEnd(() => {
      savedUserScale.value = userScale.value;
    });

  // PAN
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: userScale.value },
    ],
  }));

  // ⭐ CROP LOGIC
  const cropImage = async () => {
    // 1. Otteniamo dimensioni reali dell’immagine
    const { width: originalWidth, height: originalHeight } = await new Promise<{
      width: number;
      height: number;
    }>((resolve) => {
      Image.getSize(imageUri, (w, h) => resolve({ width: w, height: h }));
    });

    // 2. Scale iniziale per adattare l’immagine allo schermo
    // DOPO
    const initialScale = CROP_WIDTH / originalWidth;

    // 3. Scale finale applicato dall’utente
    const finalScale = initialScale * savedUserScale.value;

    // 4. Dimensioni visualizzate dell’immagine
    const displayedWidth = originalWidth * finalScale;
    const displayedHeight = originalHeight * finalScale;

    // 5. Offset per centrare l’immagine
    const imageTop = (SCREEN_HEIGHT * 0.7 - displayedHeight) / 2;
    const imageLeft = (SCREEN_WIDTH - displayedWidth) / 2;

    // 6. Riquadro di crop
    const cropTop = (SCREEN_HEIGHT * 0.7 - CROP_HEIGHT) / 2;
    const cropLeft = (SCREEN_WIDTH - CROP_WIDTH) / 2;

    // 7. Calcolo della parte dell’immagine originale che corrisponde al riquadro
    let originX = (cropLeft - imageLeft - savedX.value) / finalScale;
    let originY = (cropTop - imageTop - savedY.value) / finalScale;

    let cropW = CROP_WIDTH / finalScale;
    let cropH = CROP_HEIGHT / finalScale;

    // 8. CLAMP
    originX = Math.max(0, originX);
    originY = Math.max(0, originY);

    if (originX + cropW > originalWidth) {
      cropW = originalWidth - originX;
    }

    if (originY + cropH > originalHeight) {
      cropH = originalHeight - originY;
    }

    // 9. Ritaglio nativo
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          crop: {
            originX,
            originY,
            width: cropW,
            height: cropH,
          },
        },
      ],
      {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG ?? "jpeg",
        base64: false,
      },
    );

    if (globalThis._onCrop) {
      globalThis._onCrop(result.uri);
      globalThis._onCrop = undefined;
    }

    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.cropArea}>
        <GestureDetector gesture={composed}>
          <Animated.Image
            source={{ uri: imageUri }}
            style={[
              {
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT * 0.7,
                alignSelf: "center",
              },
              animatedStyle,
            ]}
            resizeMode="contain"
          />
        </GestureDetector>

        {/* ⭐ Riquadro 100% × 300px */}
        <View
          style={[
            styles.cropFrameBase,
            {
              width: CROP_WIDTH,
              height: CROP_HEIGHT,
              top: (SCREEN_HEIGHT * 0.7 - CROP_HEIGHT) / 2,
              left: (SCREEN_WIDTH - CROP_WIDTH) / 2,
            },
          ]}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={cropImage}>
        <Text style={styles.buttonText}>Conferma</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center" },
  cropArea: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  cropFrameBase: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "rgba(0,0,0,0.15)",
  },

  button: {
    backgroundColor: "#00c853",
    padding: 15,
    marginTop: 20,
    alignSelf: "center",
    borderRadius: 10,
  },
  buttonText: { color: "#fff", fontSize: 18 },
});
