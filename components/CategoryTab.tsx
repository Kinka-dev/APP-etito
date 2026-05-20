// CategoryTab.tsx
import React, { forwardRef } from "react";
import {
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import Text from "./Text";

type Props = {
  label: string;
  icon?: any;
  selected: boolean;
  onPress: () => void;
  onLayout?: (e: LayoutChangeEvent) => void;
  labelStyle?: any;
};

const AnimatedView = Animated.createAnimatedComponent(View);

const CategoryTab = forwardRef<View, Props>(
  ({ icon, label, selected, onPress, onLayout, labelStyle }, ref) => {
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        {
          scale: withSpring(selected ? 1.05 : 1, {
            damping: 6,
            stiffness: 30,
          }),
        },
      ],
    }));

    return (
      <AnimatedView
        ref={ref}
        style={[
          styles.wrapper,
          animatedStyle,
          // ⭐ glow quando selezionata
        ]}
        onLayout={onLayout}
      >
        <Pressable onPress={onPress} style={styles.row}>
          {/* Testo a sinistra */}
          <View style={styles.textContainer}>
            <Text bold style={[styles.label, labelStyle]}>
              {label}
            </Text>
          </View>

          {/* Immagine a destra */}
          {icon && (
            <Image source={icon} style={styles.icon} resizeMode="cover" />
          )}
        </Pressable>
      </AnimatedView>
    );
  },
);

export default CategoryTab;

const styles = StyleSheet.create({
  wrapper: {
    width: 360, // ⭐ larghezza fissa
    height: 170, // ⭐ altezza fissa per allineamento perfetto
  },

  row: {
    flexDirection: "row", // ⭐ testo sinistra, immagine destra
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
  },

  textContainer: {
    minWidth: 100,
    maxWidth: 180,
    marginRight: -30,
    marginLeft: 30,
    textAlign: "center",
  },

  label: {
    fontSize: 16,
    color: "black",
    flexWrap: "wrap",
    paddingVertical: 15,
    paddingHorizontal: 25,
    backgroundColor: "white",
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    textAlign: "center",
  },

  icon: {
    width: 170, // ⭐ immagine a destra
    height: "100%",
  },
});
