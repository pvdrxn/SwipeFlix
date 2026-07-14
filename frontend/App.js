import { StatusBar } from "expo-status-bar";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./src/auth/AuthContext";
import { LanguageProvider } from "./src/context/LanguageContext";
import { ThemeProvider, useTheme } from "./src/theme";
import { RootNavigator } from "./src/navigation/RootNavigator";

function AppContent() {
  const { themeMode } = useTheme();
  return (
    <>
      <RootNavigator />
      <StatusBar style={themeMode === "dark" ? "light" : "dark"} />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
            <AppContent />
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}