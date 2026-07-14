import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "@swipeflix_theme";

const darkColors = {
  bg: {
    primary: "#000000",
    card: "rgba(255,255,255,0.06)",
    elevated: "rgba(255,255,255,0.10)",
    overlay: "rgba(0,0,0,0.75)",
    tab: "#242424",
    section: "#1a1a1a",
    modal: "#1a1a2e",
  },
  text: {
    primary: "#FFFFFF",
    secondary: "rgba(255,255,255,0.72)",
    tertiary: "rgba(255,255,255,0.50)",
    muted: "rgba(255,255,255,0.30)",
  },
  border: "#444444",
  accent: "#E50914",
  accentSecondary: "#FF6B6B",
  success: "#16a34a",
  rating: "#FBBF24",
  favorite: "#FBBF24",
  swipe: {
    pass: "#E50914",
    save: "#16a34a",
    saved: "#4488ff",
  },
  genre: {
    Action: "#ff4444",
    Adventure: "#ff8c00",
    Animation: "#ffd700",
    Comedy: "#e6b800",
    Crime: "#9b59b6",
    Documentary: "#1abc9c",
    Drama: "#4488ff",
    Family: "#ff69b4",
    Fantasy: "#bb6bd9",
    History: "#cd853f",
    Horror: "#c0392b",
    Music: "#00d4ff",
    Mystery: "#7b68ee",
    Romance: "#ff1493",
    "Science Fiction": "#00d4ff",
    "TV Movie": "#888888",
    Thriller: "#8e44ad",
    War: "#556b2f",
    Western: "#d2b48c",
  },
  genreById: {
    28: "#ff4444",
    12: "#ff8c00",
    16: "#ffd700",
    35: "#e6b800",
    80: "#9b59b6",
    99: "#1abc9c",
    18: "#4488ff",
    10751: "#ff69b4",
    14: "#bb6bd9",
    36: "#cd853f",
    27: "#c0392b",
    10402: "#00d4ff",
    9648: "#7b68ee",
    10749: "#ff1493",
    878: "#00d4ff",
    10770: "#888888",
    53: "#8e44ad",
    10752: "#556b2f",
    37: "#d2b48c",
  },
};

const lightColors = {
  bg: {
    primary: "#FFFFFF",
    card: "rgba(0,0,0,0.04)",
    elevated: "rgba(0,0,0,0.06)",
    overlay: "rgba(0,0,0,0.40)",
    tab: "#F0F0F0",
    section: "#F5F5F5",
    modal: "#FFFFFF",
  },
  text: {
    primary: "#000000",
    secondary: "rgba(0,0,0,0.70)",
    tertiary: "rgba(0,0,0,0.50)",
    muted: "rgba(0,0,0,0.30)",
  },
  border: "#E0E0E0",
  accent: "#E50914",
  accentSecondary: "#FF6B6B",
  success: "#16a34a",
  rating: "#FBBF24",
  favorite: "#FBBF24",
  swipe: {
    pass: "#E50914",
    save: "#16a34a",
    saved: "#4488ff",
  },
  genre: {
    Action: "#ff4444",
    Adventure: "#ff8c00",
    Animation: "#ffd700",
    Comedy: "#e6b800",
    Crime: "#9b59b6",
    Documentary: "#1abc9c",
    Drama: "#4488ff",
    Family: "#ff69b4",
    Fantasy: "#bb6bd9",
    History: "#cd853f",
    Horror: "#c0392b",
    Music: "#00d4ff",
    Mystery: "#7b68ee",
    Romance: "#ff1493",
    "Science Fiction": "#00d4ff",
    "TV Movie": "#888888",
    Thriller: "#8e44ad",
    War: "#556b2f",
    Western: "#d2b48c",
  },
  genreById: {
    28: "#ff4444",
    12: "#ff8c00",
    16: "#ffd700",
    35: "#e6b800",
    80: "#9b59b6",
    99: "#1abc9c",
    18: "#4488ff",
    10751: "#ff69b4",
    14: "#bb6bd9",
    36: "#cd853f",
    27: "#c0392b",
    10402: "#00d4ff",
    9648: "#7b68ee",
    10749: "#ff1493",
    878: "#00d4ff",
    10770: "#888888",
    53: "#8e44ad",
    10752: "#556b2f",
    37: "#d2b48c",
  },
};

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState("dark");

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === "light" || stored === "dark") {
        setThemeMode(stored);
      }
    }).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const colors = useMemo(() => themeMode === "dark" ? darkColors : lightColors, [themeMode]);

  const value = useMemo(() => ({
    colors,
    themeMode,
    toggleTheme,
    setThemeMode,
  }), [colors, themeMode, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
