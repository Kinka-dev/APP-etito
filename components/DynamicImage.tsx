import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { useDynamicImageSize } from "../hooks/useDynamicImageSize";

type Props = {
  uri: string | null | undefined;
  onDelete?: () => void;
  onOpenFull?: () => void;
  style?: any;
};

export const DynamicImage: React.FC<Props> = ({
  uri,
  onDelete,
  onOpenFull,
  style,
}) => {
  const imgStyle = useDynamicImageSize(uri ?? null);

  if (!uri) return null;

  return (
    <View style={{ width: "100%", marginBottom: 20 }}>
      {/* Pulsante elimina (opzionale) */}
      {onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          style={{
            position: "absolute",
            top: -10,
            right: -10,
            zIndex: 20,
            borderRadius: 20,
            backgroundColor: "white",
            padding: 4,
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Ionicons name="close" size={20} color="#cb0047" />
        </TouchableOpacity>
      )}

      {/* Contenitore immagine */}
      <View
        style={{
          width: "100%",
          overflow: "hidden",
          backgroundColor: "#f5f5f5",
          marginTop: 10,
          borderRadius: 12,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onOpenFull} // ⭐ ora funziona
        >
          <Image
            source={{ uri }}
            style={[imgStyle, { width: "100%", alignSelf: "center" }, style]}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
