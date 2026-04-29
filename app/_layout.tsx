// app/_layout.tsx
import { RecipeProvider } from "@/context/RecipeContext";
import { TimerProvider } from "@/context/TimerContext";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Outfit-Regular": require("../assets/fonts/Outfit-Regular.ttf"),
    "Outfit-Medium": require("../assets/fonts/Outfit-Medium.ttf"),
    "Outfit-SemiBold": require("../assets/fonts/Outfit-SemiBold.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TimerProvider>
        <RecipeProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            {/* <Stack.Screen
              name="recipe/[id]"
              options={{ presentation: "card" }}
            /> */}
            <Stack.Screen name="add" options={{ presentation: "modal" }} />
          </Stack>
        </RecipeProvider>
      </TimerProvider>
    </GestureHandlerRootView>
  );
}
