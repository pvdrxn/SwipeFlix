import React, { useContext, useState, useMemo, useRef, useEffect } from "react";
import Animated, { useSharedValue, withTiming, useAnimatedStyle, runOnJS, interpolate } from "react-native-reanimated";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { AuthContext } from "../auth/AuthContext";
import { LanguageContext } from "../context/LanguageContext";
import { useTheme } from "../theme";

export function AuthScreen() {
  const { signIn, signUp } = useContext(AuthContext);
  const { language, setLanguage, t } = useContext(LanguageContext);
  const { colors } = useTheme();

  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);

  const fadeAnim = useSharedValue(0);
  const transitioning = useRef(false);

  function toggleMode() {
    if (transitioning.current) return;
    transitioning.current = true;
    const nextMode = mode === "login" ? "register" : "login";
    fadeAnim.value = withTiming(mode === "login" ? 1 : 0, { duration: 200 }, () => {
      runOnJS(setMode)(nextMode);
      runOnJS(setError)(null);
      transitioning.current = false;
    });
  }

  const screenHeight = Dimensions.get("window").height;
  const scrollAnim = useSharedValue(0);

  useEffect(() => {
    let running = true;
    const startTime = Date.now();
    const duration = 40000;
    const distance = screenHeight;

    function frame() {
      if (!running) return;
      const elapsed = Date.now() - startTime;
      const progress = (elapsed % duration) / duration;
      scrollAnim.value = -progress * distance;
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
    return () => { running = false; };
  }, [screenHeight, scrollAnim]);

  const bgImageStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollAnim.value }],
  }));

  const bgImageStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollAnim.value + screenHeight }],
  }));

  const loginStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fadeAnim.value, [0, 1], [1, 0]),
  }));

  const registerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  async function handleLogin() {
    setError(null);
    setSubmitting(true);
    try {
      await signIn({ username: username.trim(), password });
    } catch (e) {
      setError("Invalid username or password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister() {
    setError(null);
    setSubmitting(true);
    try {
      await signUp({ username: username.trim(), password });
    } catch (e) {
      if (e.response?.data?.detail) {
        setError(e.response.data.detail);
      } else {
        setError("Could not create account. Try a different username.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmitLogin = username.trim().length > 0 && password.length > 0 && !submitting;
  const canSubmitRegister = username.trim().length >= 3 && password.length >= 8 && !submitting;

  const isLogin = mode === "login";

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
    },
    overlay: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    title: {
      color: "#fff",
      fontSize: 32,
      fontWeight: "700",
      marginBottom: 6,
      textAlign: "center",
    },
    subtitle: {
      color: "#fff",
      fontSize: 16,
      marginBottom: 24,
      textAlign: "center",
    },
    card: {
      padding: 16,
      gap: 12,
    },
    input: {
      backgroundColor: "transparent",
      borderBottomWidth: 1,
      borderBottomColor: colors.accent,
      borderRadius: 0,
      paddingHorizontal: 2,
      paddingTop: 20,
      paddingBottom: 0,
      minHeight: 44,
      color: "#fff",
      fontSize: 16,
    },
    error: {
      color: colors.accentSecondary,
      marginTop: 10,
    },
    button: {
      marginTop: 50,
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: 13,
      alignItems: "center",
    },
    buttonPressed: {
      opacity: 0.9,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
    },
    linkButton: {
      marginTop: 14,
      alignItems: "center",
    },
    linkText: {
      color: "#fff",
      fontSize: 14,
    },
    langButton: {
      position: "absolute",
      top: 50,
      right: 16,
      zIndex: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(0,0,0,0.4)",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
    },
    langButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    langModalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.6)",
    },
    langModalContent: {
      width: "75%",
      backgroundColor: "#1a1a2e",
      borderRadius: 16,
      padding: 20,
      gap: 8,
    },
    langOption: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    langOptionActive: {
      backgroundColor: colors.accent,
    },
    langOptionText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("../../assets/loginbg.jpg")}
        style={[StyleSheet.absoluteFill, bgImageStyle]}
        resizeMode="cover"
        blurRadius={3}
      />
      <Animated.Image
        source={require("../../assets/loginbg.jpg")}
        style={[StyleSheet.absoluteFill, bgImageStyle2]}
        resizeMode="cover"
        blurRadius={3}
      />
      <View style={styles.overlay}>
        <Pressable style={styles.langButton} onPress={() => setLangModalVisible(true)}>
          <Feather name="globe" size={16} color="#fff" />
          <Text style={styles.langButtonText}>{language}</Text>
        </Pressable>


        <Animated.View
          style={loginStyle}
          pointerEvents={isLogin ? "auto" : "none"}
        >
          <Text style={styles.title}>{t("auth.welcomeBack")}</Text>
          <Text style={styles.subtitle}>{t("auth.signInSubtitle")}</Text>
          <View style={styles.card}>
            <TextInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t("auth.usernamePlaceholder")}
              placeholderTextColor="#ddd"
              style={styles.input}
            />
            <View style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.accent }}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder={t("auth.passwordPlaceholder")}
                placeholderTextColor="#ddd"
                style={[styles.input, { flex: 1, borderBottomWidth: 0 }]}
              />
              <Pressable
                onPressIn={() => setShowPassword(true)}
                onPressOut={() => setShowPassword(false)}
              >
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#fff" />
              </Pressable>
            </View>
            {error && isLogin ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              onPress={handleLogin}
              disabled={!canSubmitLogin}
              style={({ pressed }) => [
                styles.button,
                !canSubmitLogin && styles.buttonDisabled,
                pressed && canSubmitLogin && styles.buttonPressed,
              ]}
            >
              {submitting && isLogin ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t("auth.logIn")}</Text>}
            </Pressable>
            <Pressable onPress={toggleMode} style={styles.linkButton}>
              <Text style={styles.linkText}>{t("auth.newHere")} <Text style={{ color: "#fff", fontSize: 14, textDecorationLine: "underline" }}>{t("auth.createAccount")}</Text></Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View
          style={[StyleSheet.absoluteFill, registerStyle, { padding: 20, justifyContent: "center" }]}
          pointerEvents={isLogin ? "none" : "auto"}
        >
          <Text style={styles.title}>{t("auth.createAccountTitle")}</Text>
          <Text style={styles.subtitle}>{t("auth.registerSubtitle")}</Text>
          <View style={styles.card}>
            <TextInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t("auth.usernamePlaceholder")}
              placeholderTextColor="#ddd"
              style={styles.input}
            />
            <View style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.accent }}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder={t("auth.passwordPlaceholder")}
                placeholderTextColor="#ddd"
                style={[styles.input, { flex: 1, borderBottomWidth: 0 }]}
              />
              <Pressable
                onPressIn={() => setShowPassword(true)}
                onPressOut={() => setShowPassword(false)}
              >
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#fff" />
              </Pressable>
            </View>
            {error && !isLogin ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              onPress={handleRegister}
              disabled={!canSubmitRegister}
              style={({ pressed }) => [
                styles.button,
                !canSubmitRegister && styles.buttonDisabled,
                pressed && canSubmitRegister && styles.buttonPressed,
              ]}
            >
              {submitting && !isLogin ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t("auth.register")}</Text>}
            </Pressable>
            <Pressable onPress={toggleMode} style={styles.linkButton}>
              <Text style={styles.linkText}>{t("auth.alreadyHaveAccount")} <Text style={{ color: "#fff", fontSize: 14, textDecorationLine: "underline" }}>{t("auth.logInLink")}</Text></Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>

      <Modal
        visible={langModalVisible}
        transparent
        statusBarTranslucent={true}
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <Pressable style={styles.langModalOverlay} onPress={() => setLangModalVisible(false)}>
          <Pressable style={styles.langModalContent} onPress={() => {}}>
            {["en", "es", "ru"].map((lang) => (
              <Pressable
                key={lang}
                style={[styles.langOption, language === lang && styles.langOptionActive]}
                onPress={() => {
                  setLanguage(lang);
                  setLangModalVisible(false);
                }}
              >
                <Text style={styles.langOptionText}>
                  {lang === "en" ? "English" : lang === "es" ? "Español" : "Русский"}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
