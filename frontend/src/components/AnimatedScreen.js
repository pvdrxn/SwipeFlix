import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from "react-native-reanimated";
import { useIsFocused } from "@react-navigation/native";
import { useTheme } from "../theme";

export function withFadeTransition(WrappedComponent) {
  return function AnimatedScreen(props) {
    const { colors } = useTheme();
    const isFocused = useIsFocused();
    const opacity = useSharedValue(1);

    useEffect(() => {
      opacity.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
    }, [isFocused, opacity]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.primary }}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <WrappedComponent {...props} />
        </Animated.View>
      </View>
    );
  };
}
