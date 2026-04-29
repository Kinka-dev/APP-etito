import { COLORS } from "@/constants/colors";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

interface RecipeOverlayCardProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddToShopping: () => void;
  onRecalculate: () => void;
  onShare: () => void;
}

const menuItems = [
  {
    icon: require("../assets/images/edit.png"),
    label: "Modifica",
    action: "onEdit" as const,
  },
  {
    icon: require("../assets/images/delete.png"),
    label: "Elimina",
    action: "onDelete" as const,
  },
  {
    icon: require("../assets/images/spesa.png"),
    label: "Aggiungi alla Spesa",
    action: "onAddToShopping" as const,
  },
  {
    icon: require("../assets/images/convertitore.png"),
    label: "Ricalcola gli Ingredienti",
    action: "onRecalculate" as const,
  },
  {
    icon: require("../assets/images/share.png"),
    label: "Condividi la ricetta",
    action: "onShare" as const,
  },
] as const;

export default function RecipeOverlayCard({
  visible,
  onClose,
  onEdit,
  onDelete,
  onAddToShopping,
  onRecalculate,
  onShare,
}: RecipeOverlayCardProps) {
  if (!visible) return null;

  const actions = {
    onEdit,
    onDelete,
    onAddToShopping,
    onRecalculate,
    onShare,
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(150)}
          style={styles.overlayCard}
        >
          {menuItems.map((item, index) => (
            <View key={item.action}>
              {index > 0 && <View style={styles.separator} />}

              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  actions[item.action]();
                  onClose();
                }}
              >
                <Image source={item.icon} style={styles.pngIcon} />

                <Text style={styles.rowText}>{item.label}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayCard: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingVertical: 6,
    width: 300,
    elevation: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  icon: {
    marginRight: 10,
  },
  rowText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: "center",
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginHorizontal: 20,
  },
  pngIcon: {
    width: 26,
    height: 26,
    marginRight: 12,
    resizeMode: "contain",
  },
});
