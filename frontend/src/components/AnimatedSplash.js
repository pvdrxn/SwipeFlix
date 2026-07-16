import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, StyleSheet, View } from "react-native";
import { useTheme } from "../theme";

export function AnimatedSplash({ onFinish }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(onFinish);
      }, 600);
    });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <Animated.View style={{ opacity, transform: [{ scale: 1.8 }] }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
