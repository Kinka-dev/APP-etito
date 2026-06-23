import { Image as ExpoImage } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  Image as RNImage,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type Box = {
  x: number;
  y: number;
  w: number;
  h: number;
};

const SENSITIVITY = 0.05;

export default function StepOcrCropScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const imageUri = Array.isArray(uri) ? uri[0] : uri;

  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);

  const [box, setBox] = useState<Box>({
    x: SCREEN_WIDTH / 2 - 130,
    y: SCREEN_HEIGHT * 0.35,
    w: 260,
    h: 200,
  });

  // ⭐ Otteniamo dimensioni reali della bitmap
  useEffect(() => {
    RNImage.getSize(
      imageUri,
      (w: number, h: number) => setImgSize({ w, h }),
      (err) => console.log("Image size error:", err),
    );
  }, [imageUri]);

  if (!imgSize) {
    return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  }

  // ⭐ Calcolo proporzioni reali (contain)
  const displayH = SCREEN_HEIGHT * 0.7;
  const scale = Math.min(SCREEN_WIDTH / imgSize.w, displayH / imgSize.h);

  const displayedWidth = imgSize.w * scale;
  const displayedHeight = imgSize.h * scale;

  const offsetX = (SCREEN_WIDTH - displayedWidth) / 2;
  const offsetY = (displayH - displayedHeight) / 2;

  // ⭐ Helper PanResponder
  const createResponder = (onMove: (dx: number, dy: number) => void) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (
        _: GestureResponderEvent,
        g: PanResponderGestureState,
      ) => {
        onMove(g.dx * SENSITIVITY, g.dy * SENSITIVITY);
      },
    });

  // ⭐ MOVE
  const moveResponder = createResponder((dx, dy) => {
    setBox((b) => ({
      ...b,
      x: Math.max(0, Math.min(SCREEN_WIDTH - b.w, b.x + dx)),
      y: Math.max(0, Math.min(displayH - b.h, b.y + dy)),
    }));
  });

  // ⭐ LEFT
  const leftResizeResponder = createResponder((dx) => {
    setBox((b) => {
      const newX = b.x + dx;
      const newW = b.w - dx;
      if (newW < 60 || newX < 0) return b;
      return { ...b, x: newX, w: newW };
    });
  });

  // ⭐ RIGHT
  const rightResizeResponder = createResponder((dx) => {
    setBox((b) => {
      const newW = b.w + dx;
      if (newW < 60 || b.x + newW > SCREEN_WIDTH) return b;
      return { ...b, w: newW };
    });
  });

  // ⭐ TOP
  const topResizeResponder = createResponder((dx, dy) => {
    setBox((b) => {
      const newY = b.y + dy;
      const newH = b.h - dy;
      if (newH < 60 || newY < 0) return b;
      return { ...b, y: newY, h: newH };
    });
  });

  // ⭐ BOTTOM
  const bottomResizeResponder = createResponder((dx, dy) => {
    setBox((b) => {
      const newH = b.h + dy;
      if (newH < 60 || b.y + newH > displayH) return b;
      return { ...b, h: newH };
    });
  });

  // ⭐ CROP PRECISO
  const cropImage = async () => {
    let originX = (box.x - offsetX) / scale;
    let originY = (box.y - offsetY) / scale;
    let cropW = box.w / scale;
    let cropH = box.h / scale;

    // ⭐ Clamp per evitare errori
    originX = Math.max(0, originX);
    originY = Math.max(0, originY);

    if (originX + cropW > imgSize.w) cropW = imgSize.w - originX;
    if (originY + cropH > imgSize.h) cropH = imgSize.h - originY;

    // ⭐ Arrotondamento (ImageManipulator odia i decimali)
    originX = Math.round(originX);
    originY = Math.round(originY);
    cropW = Math.round(cropW);
    cropH = Math.round(cropH);

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
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
    );

    if (globalThis._onCropStepOcr) {
      globalThis._onCropStepOcr(result.uri);
      globalThis._onCropStepOcr = undefined;
    }

    router.back();
  };

  return (
    <View style={styles.container}>
      <ExpoImage
        source={{ uri: imageUri }}
        style={{
          width: SCREEN_WIDTH,
          height: displayH,
        }}
        contentFit="contain"
      />
      {/* ⭐ OVERLAY SCURO FUORI DAL CROP */}
      <View style={[styles.overlay, { top: 0, height: box.y }]} />
      <View
        style={[
          styles.overlay,
          { top: box.y, height: box.h, left: 0, width: box.x },
        ]}
      />
      <View
        style={[
          styles.overlay,
          { top: box.y, height: box.h, left: box.x + box.w, right: 0 },
        ]}
      />
      <View style={[styles.overlay, { top: box.y + box.h, bottom: 0 }]} />

      {/* ⭐ Riquadro */}
      <View
        style={[
          styles.cropBox,
          { left: box.x, top: box.y, width: box.w, height: box.h },
        ]}
        {...moveResponder.panHandlers}
      >
        {/* ⭐ Maniglia sinistra */}
        <View
          style={styles.handleVertical}
          hitSlop={{ left: 20, right: 20, top: 40, bottom: 40 }}
          {...leftResizeResponder.panHandlers}
        />

        {/* ⭐ Maniglia destra */}
        <View
          style={[styles.handleVertical, { right: -8, left: undefined }]}
          hitSlop={{ left: 20, right: 20, top: 40, bottom: 40 }}
          {...rightResizeResponder.panHandlers}
        />

        {/* ⭐ Maniglia superiore */}
        <View
          style={styles.handleHorizontal}
          hitSlop={{ left: 40, right: 40, top: 20, bottom: 20 }}
          {...topResizeResponder.panHandlers}
        />

        {/* ⭐ Maniglia inferiore */}
        <View
          style={[styles.handleHorizontal, { bottom: -8, top: undefined }]}
          hitSlop={{ left: 40, right: 40, top: 20, bottom: 20 }}
          {...bottomResizeResponder.panHandlers}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={cropImage}>
        <Text style={styles.buttonText}>Conferma</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  cropBox: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#fff",
  },

  leftHandle: {
    position: "absolute",
    left: -10,
    top: 0,
    width: 20,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  rightHandle: {
    position: "absolute",
    right: -10,
    top: 0,
    width: 20,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  topHandle: {
    position: "absolute",
    top: -10,
    left: 0,
    width: "100%",
    height: 20,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  bottomHandle: {
    position: "absolute",
    bottom: -10,
    left: 0,
    width: "100%",
    height: 20,
    backgroundColor: "rgba(255,255,255,0.4)",
  },

  button: {
    backgroundColor: "#00c853",
    padding: 15,
    marginTop: 20,
    alignSelf: "center",
    borderRadius: 10,
  },
  buttonText: { color: "#fff", fontSize: 18 },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  handleVertical: {
    position: "absolute",
    left: -8,
    top: 0,
    width: 16,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 8,
  },

  handleHorizontal: {
    position: "absolute",
    top: -8,
    left: 0,
    width: "100%",
    height: 16,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 8,
  },
});
