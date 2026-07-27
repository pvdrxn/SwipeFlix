import React, { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Animated, { useSharedValue, withTiming, useAnimatedStyle, runOnJS } from "react-native-reanimated";
import { useTheme } from "../theme";

export function AnimatedSplash({ onFinish }) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 }, () => {
      runOnJS(() => {
        setTimeout(() => {
          opacity.value = withTiming(0, { duration: 300 }, () => {
            runOnJS(onFinishRef.current)();
          });
        }, 600);
      })();
    });
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <Animated.View style={[animatedStyle, { transform: [{ scale: 1.8 }] }]}>
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
