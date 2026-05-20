import * as ImageManipulator from "expo-image-manipulator";
import React from "react";
import {
  Dimensions,
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

const { width, height } = Dimensions.get("window");

// ⭐ Rettangolo OCR (rettangolare)
const FRAME_WIDTH = width * 0.9;
const FRAME_HEIGHT = height * 0.45;

type Props = {
  uri: string;
  onDone: (uri: string) => void;
  onCancel: () => void;
};

export default function ImageCropperOCR({ uri, onDone, onCancel }: Props) {
  // Trasformazioni immagine
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  // Pinch
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  // Pan
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // ⭐ Crop finale
  const handleCrop = async () => {
    const originX = (width - FRAME_WIDTH) / 2;
    const originY = (height - FRAME_HEIGHT) / 2;

    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          crop: {
            originX,
            originY,
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
          },
        },
      ],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
    );

    onDone(result.uri);
  };

  return (
    <View style={styles.container}>
      {/* Immagine con pinch + pan */}
      <GestureDetector gesture={composedGesture}>
        <Animated.Image source={{ uri }} style={[styles.image, imageStyle]} />
      </GestureDetector>

      {/* ⭐ Rettangolo fisso OCR */}
      <View
        style={[
          styles.frame,
          {
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
            left: (width - FRAME_WIDTH) / 2,
            top: (height - FRAME_HEIGHT) / 2,
          },
        ]}
      />

      {/* Pulsanti */}
      <View style={styles.buttons}>
        <TouchableOpacity onPress={onCancel} style={styles.btnCancel}>
          <Text style={styles.btnText}>Annulla</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleCrop} style={styles.btnConfirm}>
          <Text style={styles.btnText}>Ritaglia</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  image: {
    width,
    height,
    position: "absolute",
  },
  frame: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 10,
  },
  buttons: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  btnCancel: {
    padding: 12,
    backgroundColor: "#444",
    borderRadius: 8,
  },
  btnConfirm: {
    padding: 12,
    backgroundColor: "#1e90ff",
    borderRadius: 8,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
  },
});
