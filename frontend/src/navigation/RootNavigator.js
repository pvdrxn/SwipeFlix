import React, { useContext, useEffect, useRef, useState } from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AuthContext } from "../auth/AuthContext";
import { AuthScreen } from "../screens/AuthScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { PickScreen } from "../screens/PickScreen";
import { LibraryScreen } from "../screens/LibraryScreen";
import { MovieDetailsScreen } from "../screens/MovieDetailsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { useTheme } from "../theme";
import { Feather } from "@expo/vector-icons";
import Animated, { useSharedValue, withSpring, withTiming, withSequence, useAnimatedStyle } from "react-native-reanimated";
import { ActivityIndicator, View, Pressable, Dimensions } from "react-native";
import { withFadeTransition } from "../components/AnimatedScreen";
import { AnimatedSplash } from "../components/AnimatedSplash";

const AppNav = createStackNavigator();
const Tab = createBottomTabNavigator();

function Splash() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg.primary }}>
      <ActivityIndicator />
    </View>
  );
}

function AuthScreens() {
  return <AuthScreen />;
}

const AnimatedHomeScreen = withFadeTransition(HomeScreen);
const AnimatedLibraryScreen = withFadeTransition(LibraryScreen);
const AnimatedPickScreen = withFadeTransition(PickScreen);
const AnimatedSettingsScreen = withFadeTransition(SettingsScreen);
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const TAB_ICONS = {
  Browse: "home",
  Library: "book",
  Pick: "film",
  Settings: "settings",
};

function TabItem({ route, isFocused, color, onPress }) {
  const scaleAnim = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    scaleAnim.value = withSpring(isFocused ? 1.2 : 1, { damping: 45, stiffness: 250 });
    translateY.value = withSpring(isFocused ? -6 : 0, { damping: 45, stiffness: 250 });
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scaleAnim.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 4 }}
    >
      <Animated.View style={animatedStyle}>
        <Feather name={TAB_ICONS[route.name]} size={24} color={color} />
      </Animated.View>
    </Pressable>
  );
}

function CustomTabBar({ state, descriptors, navigation }) {
  const { colors } = useTheme();
  const indicatorPos = useSharedValue(0);
  const indicatorScale = useSharedValue(1);
  const prevIndex = useRef(0);
  const [barWidth, setBarWidth] = useState(0);

  const selectedIndex = state.index;
  const tabCount = state.routes.length;

  const tabBarContainerStyle = {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: "center",
  };

  const tabBarStyle = {
    backgroundColor: colors.bg.tab,
    borderRadius: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    height: 56,
    justifyContent: "center",
    width: "100%",
  };

  useEffect(() => {
    if (barWidth === 0) return;
    const tabWidth = barWidth / tabCount;
    const center = tabWidth * selectedIndex + tabWidth / 2;

    indicatorScale.value = withSequence(
      withTiming(2.5, { duration: 60 }),
      withSpring(1, { damping: 22, stiffness: 200 })
    );
    indicatorPos.value = withSpring(center - 4, { damping: 45, stiffness: 250 });

    prevIndex.current = selectedIndex;
  }, [selectedIndex, tabCount, barWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    position: "absolute",
    bottom: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    transform: [
      { translateX: indicatorPos.value },
      { scaleX: indicatorScale.value },
    ],
  }));

  return (
    <View
      style={tabBarContainerStyle}
      onLayout={(e) => {
        setBarWidth(e.nativeEvent.layout.width);
      }}
    >
      <View style={tabBarStyle}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          {state.routes.map((route, index) => {
            const isFocused = selectedIndex === index;
            const color = isFocused ? colors.accent : colors.text.tertiary;

            const onPress = () => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TabItem key={route.key} route={route} isFocused={isFocused} color={color} onPress={onPress} />
            );
          })}
        </View>
        <Animated.View
          style={indicatorStyle}
        />
      </View>
    </View>
  );
}

function MoviesTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Browse" component={AnimatedHomeScreen} />
      <Tab.Screen name="Library" component={AnimatedLibraryScreen} />
      <Tab.Screen name="Pick" component={AnimatedPickScreen} />
      <Tab.Screen name="Settings" component={AnimatedSettingsScreen} />
    </Tab.Navigator>
  );
}

function AppStack() {
  const { colors } = useTheme();
  return (
    <AppNav.Navigator
      screenOptions={{
        headerShown: false,
        gestureDirection: "vertical",
        cardStyle: { backgroundColor: colors.bg.primary },
      }}
    >
      <AppNav.Screen name="MoviesTabs" component={MoviesTabs} />
      <AppNav.Screen
        name="MovieDetails"
        component={MovieDetailsScreen}
        options={{
          cardStyle: { backgroundColor: colors.bg.primary },
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [SCREEN_HEIGHT, 0],
                  }),
                },
              ],
            },
            overlayStyle: {
              opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          }),
          transitionSpec: {
            open: { animation: "spring", config: { damping: 20, stiffness: 120, mass: 1 } },
            close: { animation: "timing", config: { duration: 400 } },
          },
        }}
      />
    </AppNav.Navigator>
  );
}

export function RootNavigator() {
  const { isBootstrapping, isSignedIn } = useContext(AuthContext);
  const { colors } = useTheme();
  const [splashDone, setSplashDone] = useState(false);

  if (isBootstrapping) return <Splash />;
  if (!splashDone) return <AnimatedSplash onFinish={() => setSplashDone(true)} />;

  const navTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: "#000",
      card: "#000",
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      {isSignedIn ? (
        <AppStack />
      ) : (
        <AuthScreens />
      )}
    </NavigationContainer>
  );
}
