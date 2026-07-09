import React, { useContext, useEffect, useRef, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AuthContext } from "../auth/AuthContext";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { PickScreen } from "../screens/PickScreen";
import { LibraryScreen } from "../screens/LibraryScreen";
import { MovieDetailsScreen } from "../screens/MovieDetailsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { colors } from "../theme";
import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, View, Animated, Pressable, Dimensions } from "react-native";
import { withFadeTransition } from "../components/AnimatedScreen";

const AuthStack = createNativeStackNavigator();
const AppNav = createStackNavigator();
const Tab = createBottomTabNavigator();

function Splash() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg.primary }}>
      <ActivityIndicator />
    </View>
  );
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
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1.2 : 1,
      useNativeDriver: true,
      damping: 14,
      stiffness: 150,
    }).start();
    Animated.spring(translateY, {
      toValue: isFocused ? -6 : 0,
      useNativeDriver: true,
      damping: 14,
      stiffness: 150,
    }).start();
  }, [isFocused]);

  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 4 }}
    >
      <Animated.View style={{ transform: [{ translateY }, { scale: scaleAnim }] }}>
        <Feather name={TAB_ICONS[route.name]} size={24} color={color} />
      </Animated.View>
    </Pressable>
  );
}

function CustomTabBar({ state, descriptors, navigation }) {
  const indicatorPos = useRef(new Animated.Value(0)).current;
  const indicatorScale = useRef(new Animated.Value(1)).current;
  const prevIndex = useRef(0);
  const [barWidth, setBarWidth] = useState(0);

  const selectedIndex = state.index;
  const tabCount = state.routes.length;

  useEffect(() => {
    if (barWidth === 0) return;
    const tabWidth = barWidth / tabCount;
    const center = tabWidth * selectedIndex + tabWidth / 2;

    Animated.parallel([
      Animated.sequence([
        Animated.timing(indicatorScale, {
          toValue: 2.5,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.spring(indicatorScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 18,
          stiffness: 120,
        }),
      ]),
      Animated.spring(indicatorPos, {
        toValue: center - 4,
        useNativeDriver: true,
        damping: 20,
        stiffness: 150,
      }),
    ]).start();

    prevIndex.current = selectedIndex;
  }, [selectedIndex, tabCount, barWidth]);

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
          style={{
            position: "absolute",
            bottom: 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.accent,
            transform: [
              { translateX: indicatorPos },
              { scaleX: indicatorScale },
            ],
          }}
        />
      </View>
    </View>
  );
}

const tabBarContainerStyle = {
  position: "absolute",
  bottom: 20,
  left: 20,
  right: 20,
  alignItems: "center",
};

const tabBarStyle = {
  backgroundColor: "#242424",
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

  if (isBootstrapping) return <Splash />;

  return (
    <NavigationContainer>
      {isSignedIn ? (
        <AppStack />
      ) : (
        <AuthStack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerStyle: { backgroundColor: colors.bg.primary }, headerTintColor: colors.text.primary }}
        >
          <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: "Log in" }} />
          <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: "Register" }} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
