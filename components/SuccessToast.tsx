import { Modal, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

interface SuccessToastProps {
  visible: boolean;
  message: string;
}

export default function SuccessToast({ visible, message }: SuccessToastProps) {
  if (!visible) return null;

  return (
    <Modal transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.toast}
        >
          <Text style={styles.icon}>✓</Text>
          <Text style={styles.text}>{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  toast: {
    backgroundColor: "white",
    paddingVertical: 18,
    paddingHorizontal: 26,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#0000007a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    fontSize: 22,
    color: "#2ecc71",
    fontFamily: "Outfit-Bold",
  },
  text: {
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    color: "#333",
  },
});
