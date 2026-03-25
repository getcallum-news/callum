import React, { useCallback, useEffect, useState } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { useFonts, CormorantGaramond_400Regular, CormorantGaramond_600SemiBold, CormorantGaramond_700Bold } from "@expo-google-fonts/cormorant-garamond";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { ThemeContext } from "../hooks/useTheme";
// useNotifications disabled — not supported in Expo Go SDK 53+
// import { useNotifications } from "../hooks/useNotifications";
import { Colors } from "../constants/theme";
import { getTheme, setTheme as persistTheme } from "../lib/storage";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isDark, setIsDark] = useState(true);
  const [ready, setReady] = useState(false);

  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    getTheme().then((t) => {
      setIsDark(t === "dark");
      setReady(true);
    });
  }, []);

  const onLayoutReady = useCallback(async () => {
    if (fontsLoaded && ready) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, ready]);

  useEffect(() => {
    onLayoutReady();
  }, [onLayoutReady]);

  // Push notifications disabled for Expo Go
  // useNotifications();

  if (!fontsLoaded || !ready) return null;

  const colors = isDark ? Colors.dark : Colors.light;

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    persistTheme(next ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: "slide_from_right",
          }}
        />
      </GestureHandlerRootView>
    </ThemeContext.Provider>
  );
}
