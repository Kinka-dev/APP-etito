import Text from "@/components/Text";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, View } from "react-native";

export default function GlassBarChart({
  carbs,
  protein,
  fat,
  totalWeight,
}: {
  carbs: number;
  protein: number;
  fat: number;
  totalWeight: number;
}) {
  const BASE_WIDTH = 250;
  const BASE_HEIGHT = 500;

  const SCALE = 0.25;
  const WIDTH = BASE_WIDTH * SCALE;
  const HEIGHT = BASE_HEIGHT * SCALE;

  // ⭐ Fallback anti-NaN
  const safeTotal = totalWeight > 0 ? totalWeight : 1;

  // ⭐ Calcolo acqua
  const water = Math.max(totalWeight - (carbs + protein + fat), 0);

  // ⭐ Percentuali sicure
  const carbsPct = totalWeight > 0 ? carbs / safeTotal : 0;
  const proteinPct = totalWeight > 0 ? protein / safeTotal : 0;
  const fatPct = totalWeight > 0 ? fat / safeTotal : 0;
  const waterPct = totalWeight > 0 ? water / safeTotal : 0;

  // ⭐ Animated.Value creati UNA SOLA VOLTA
  const animCarbs = useRef(new Animated.Value(0)).current;
  const animProtein = useRef(new Animated.Value(0)).current;
  const animFat = useRef(new Animated.Value(0)).current;
  const animWater = useRef(new Animated.Value(0)).current;

  // ⭐ Animazione
  useEffect(() => {
    if (totalWeight === 0) {
      Animated.parallel([
        Animated.timing(animCarbs, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(animProtein, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(animFat, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(animWater, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
      return;
    }

    const animations = [
      Animated.timing(animCarbs, {
        toValue: carbsPct,
        duration: 900,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(animProtein, {
        toValue: proteinPct,
        duration: 900,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(animFat, {
        toValue: fatPct,
        duration: 900,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(animWater, {
        toValue: waterPct,
        duration: 900,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ];

    Animated.stagger(120, animations).start();
  }, [carbsPct, proteinPct, fatPct, waterPct, totalWeight]);

  // ⭐ Barattolo
  const Bar = ({
    image,
    progress,
    grams,
  }: {
    image: any;
    progress: Animated.Value;
    grams: number;
  }) => {
    const animatedHeight = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [7, HEIGHT],
    });

    return (
      <View
        style={{
          width: WIDTH,
          height: HEIGHT,
          position: "relative",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        {/* Etichetta centrale */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: 10,
              elevation: 3,
            }}
          >
            <Text bold style={{ fontSize: 14 }}>
              {Math.round(grams)}g
            </Text>
          </View>
        </View>

        {/* Cilindro vuoto */}
        <Image
          source={require("../assets/images/cylinder_empty.png")}
          style={{
            width: WIDTH,
            height: HEIGHT,
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />

        {/* Contenuto */}
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            width: WIDTH,
            height: animatedHeight,
            overflow: "hidden",
          }}
        >
          <Image
            source={image}
            style={{
              width: WIDTH,
              height: HEIGHT,
              position: "absolute",
              bottom: 0,
            }}
          />
        </Animated.View>
      </View>
    );
  };

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: 20,
      }}
    >
      {/* CARBS */}
      <View style={{ width: WIDTH, alignItems: "center" }}>
        <Bar
          image={require("../assets/images/rice.png")}
          progress={animCarbs}
          grams={carbs}
        />
        <Text bold style={{ fontSize: 18, marginTop: 10 }}>
          {Math.round(carbsPct * 100)}%
        </Text>
        <Text style={{ fontSize: 14 }}>Carbs</Text>
      </View>

      {/* PROTEIN */}

      <View style={{ width: WIDTH, alignItems: "center" }}>
        <Bar
          image={require("../assets/images/beans.png")}
          progress={animProtein}
          grams={protein}
        />
        <Text bold style={{ fontSize: 18, marginTop: 10 }}>
          {Math.round(proteinPct * 100)}%
        </Text>
        <Text style={{ fontSize: 14 }}>Proteine</Text>
      </View>

      {/* FAT */}
      <View style={{ width: WIDTH, alignItems: "center" }}>
        <Bar
          image={require("../assets/images/oil.png")}
          progress={animFat}
          grams={fat}
        />
        <Text bold style={{ fontSize: 18, marginTop: 10 }}>
          {Math.round(fatPct * 100)}%
        </Text>
        <Text style={{ fontSize: 14 }}>Grassi</Text>
      </View>

      {/* WATER */}
      <View style={{ width: WIDTH, alignItems: "center" }}>
        <Bar
          image={require("../assets/images/water.png")}
          progress={animWater}
          grams={water}
        />
        <Text bold style={{ fontSize: 18, marginTop: 10 }}>
          {Math.round(waterPct * 100)}%
        </Text>
        <Text style={{ fontSize: 14 }}>Acqua & Micros</Text>
      </View>
    </View>
  );
}
