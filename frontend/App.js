import { StatusBar } from "expo-status-bar";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./src/auth/AuthContext";
import { LanguageProvider } from "./src/context/LanguageContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <LanguageProvider>
          <RootNavigator />
          <StatusBar style="light" />
        </LanguageProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}