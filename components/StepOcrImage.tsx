// StepOcrImage.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { useDynamicImageSize } from "../hooks/useDynamicImageSize";

type Props = {
  uri?: string | null;
  onDelete: () => void;
};

export const StepOcrImage: React.FC<Props> = ({ uri, onDelete }) => {
  const ocrImageStyle = useDynamicImageSize(uri);

  if (!uri) return null;

  return (
    <View style={{ width: "100%", marginBottom: 10 }}>
      <TouchableOpacity
        onPress={onDelete}
        style={{
          position: "absolute",
          top: 5,
          right: -5,
          zIndex: 20,
          backgroundColor: "white",
          borderRadius: 20,
          padding: 4,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <Ionicons name="close" size={20} color="#cb0047" />
      </TouchableOpacity>

      <View
        style={{
          width: "100%",
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "#f5f5f5",
          marginTop: 10,
        }}
      >
        <TouchableOpacity>
          <Image
            source={{ uri }}
            style={[ocrImageStyle, { width: "100%", alignSelf: "center" }]}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
