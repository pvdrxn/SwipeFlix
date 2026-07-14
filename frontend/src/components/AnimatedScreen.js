import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useTheme } from "../theme";

export function withFadeTransition(WrappedComponent) {
  return function AnimatedScreen(props) {
    const { colors } = useTheme();
    const isFocused = useIsFocused();
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.timing(opacity, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, [isFocused]);

    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.primary }}>
        <Animated.View style={[{ flex: 1 }, { opacity }]}>
          <WrappedComponent {...props} />
        </Animated.View>
      </View>
    );
  };
}
