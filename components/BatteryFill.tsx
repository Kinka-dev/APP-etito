import React from "react";
import { Animated, Image, View } from "react-native";

const MAX_KCAL = 1;

export default function BatteryFill({
  animValue,
  width = 120,
  height = 50,
}: {
  animValue: Animated.Value;
  width?: number;
  height?: number;
}) {
  // larghezza animata del fluido rosso
  const fillWidth = animValue.interpolate({
    inputRange: [0, MAX_KCAL],
    outputRange: [0, width],
    extrapolate: "clamp",
  });

  return (
    <View
      style={{
        width,
        height,
        position: "relative",
        marginLeft: 10,
      }}
    >
      {/* CONTENITORE (SOTTO) */}
      <Image
        source={require("../assets/images/pila.png")}
        style={{
          width,
          height,
          position: "absolute",
          top: 0,
          left: 0,
          resizeMode: "stretch",
        }}
      />

      {/* FLUIDO ROSSO (SOPRA) */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: fillWidth,
          height,
          overflow: "hidden",
          zIndex: 10,
        }}
      >
        <Image
          source={require("../assets/images/rosso.png")}
          style={{
            width,
            height,
            resizeMode: "stretch",
          }}
        />
      </Animated.View>
    </View>
  );
}
