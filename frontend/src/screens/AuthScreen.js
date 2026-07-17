import React, { useContext, useState, useMemo, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { AuthContext } from "../auth/AuthContext";
import { verifyEmail, resendCode } from "../api/authApi";
import { LanguageContext } from "../context/LanguageContext";
import { useTheme } from "../theme";

export function AuthScreen() {
  const { signIn, signUp, setAuthTokens } = useContext(AuthContext);
  const { language, setLanguage, t } = useContext(LanguageContext);
  const { colors } = useTheme();

  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const transitioning = useRef(false);

  function toggleMode() {
    if (transitioning.current) return;
    transitioning.current = true;
    const toValue = mode === "login" ? 1 : 0;
    Animated.timing(fadeAnim, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setMode(mode === "login" ? "register" : "login");
      setError(null);
      transitioning.current = false;
    });
  }

  const screenHeight = Dimensions.get("window").height;
  const scrollAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(scrollAnim, {
        toValue: -screenHeight,
        duration: 40000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [scrollAnim, screenHeight]);

  async function handleLogin() {
    setError(null);
    setUnverifiedEmail(null);
    setSubmitting(true);
    try {
      await signIn({ username: username.trim(), password });
    } catch (e) {
      if (e.response?.data?.detail === "Email not verified.") {
        setUnverifiedEmail(e.response.data.email);
      } else {
        setError("Invalid username or password.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister() {
    setError(null);
    setSubmitting(true);
    try {
      await signUp({ username: username.trim(), email: email.trim(), password });
      setModalVisible(true);
    } catch (e) {
      if (e.response?.data?.email) {
        setError(e.response.data.email[0]);
      } else if (e.response?.data?.detail) {
        setError(e.response.data.detail);
      } else {
        setError("Could not create account. Try a different username/email.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify() {
    setVerifyError("");
    setVerifying(true);
    try {
      const emailToUse = mode === "login" ? unverifiedEmail : email;
      const result = await verifyEmail({ email: emailToUse, code: code.trim() });
      setVerified(true);
      await new Promise((r) => setTimeout(r, 1500));
      if (mode === "login") {
        setModalVisible(false);
        setVerified(false);
        await signIn({ username: username.trim(), password });
      } else {
        await setAuthTokens({ accessToken: result.access, refreshToken: result.refresh });
      }
    } catch (e) {
      if (e.response?.status === 400) {
        setVerifyError(e.response.data.detail || "Invalid or expired code.");
      } else {
        setVerifyError("Something went wrong. Try again.");
      }
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      const emailToUse = mode === "login" ? unverifiedEmail : email;
      await resendCode({ email: emailToUse });
    } catch (e) {
      setVerifyError("Could not resend code. Try again.");
    } finally {
      setResending(false);
    }
  }

  function handleCloseModal() {
    setModalVisible(false);
    setCode("");
    setVerifyError("");
  }

  const canSubmitLogin = username.trim().length > 0 && password.length > 0 && !submitting;
  const canSubmitRegister = username.trim().length >= 3 && email.trim().length > 0 && password.length >= 8 && !submitting;

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
    unverifiedContainer: {
      backgroundColor: colors.bg.card,
      borderRadius: 10,
      padding: 12,
      marginTop: 10,
    },
    unverifiedText: {
      color: "#fff",
      fontSize: 13,
      lineHeight: 18,
    },
    verifyLink: {
      color: colors.accent,
      fontWeight: "700",
      textDecorationLine: "underline",
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
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.bg.overlay,
    },
    modalContent: {
      width: "85%",
      backgroundColor: "#1a1a2e",
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
    },
    closeButton: {
      position: "absolute",
      top: 12,
      right: 16,
      zIndex: 1,
      padding: 4,
    },
    closeButtonText: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "600",
    },
    modalTitle: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 8,
    },
    modalSubtitle: {
      color: "#fff",
      fontSize: 14,
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 20,
    },
    codeInput: {
      width: "100%",
      backgroundColor: colors.bg.elevated,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: "#fff",
      fontSize: 24,
      fontWeight: "700",
      textAlign: "center",
      letterSpacing: 8,
      marginBottom: 12,
    },
    errorText: {
      color: colors.accent,
      fontSize: 13,
      textAlign: "center",
      marginBottom: 12,
    },
    verifyButton: {
      width: "100%",
      paddingVertical: 14,
      borderRadius: 10,
      backgroundColor: colors.accent,
      alignItems: "center",
      marginBottom: 12,
    },
    verifyButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
    resendButton: {
      alignItems: "center",
      paddingVertical: 8,
    },
    resendText: {
      color: "#fff",
      fontSize: 14,
      textDecorationLine: "underline",
    },
    successIcon: {
      color: colors.success,
      fontSize: 48,
      fontWeight: "700",
      marginBottom: 12,
    },
    successText: {
      color: colors.success,
      fontSize: 18,
      fontWeight: "700",
      textAlign: "center",
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
        style={[StyleSheet.absoluteFill, { transform: [{ translateY: scrollAnim }] }]}
        resizeMode="cover"
        blurRadius={3}
      />
      <Animated.Image
        source={require("../../assets/loginbg.jpg")}
        style={[StyleSheet.absoluteFill, { transform: [{ translateY: Animated.add(scrollAnim, screenHeight) }] }]}
        resizeMode="cover"
        blurRadius={3}
      />
      <View style={styles.overlay}>
        <Pressable style={styles.langButton} onPress={() => setLangModalVisible(true)}>
          <Feather name="globe" size={16} color="#fff" />
          <Text style={styles.langButtonText}>{language}</Text>
        </Pressable>


        <Animated.View
          style={{ opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}
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
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder={t("auth.passwordPlaceholder")}
              placeholderTextColor="#ddd"
              style={styles.input}
            />
            {error && isLogin ? <Text style={styles.error}>{error}</Text> : null}
            {unverifiedEmail && isLogin ? (
              <View style={styles.unverifiedContainer}>
                <Text style={styles.unverifiedText}>
                  {t("auth.verifyEmailNotice")}{" "}
                  <Text style={styles.verifyLink} onPress={() => setModalVisible(true)}>
                    {t("auth.verifyEmailLink")}
                  </Text>
                </Text>
              </View>
            ) : null}
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
          style={[StyleSheet.absoluteFill, { opacity: fadeAnim, padding: 20, justifyContent: "center" }]}
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
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder={t("auth.emailPlaceholder")}
              placeholderTextColor="#ddd"
              style={styles.input}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder={t("auth.passwordPlaceholder")}
              placeholderTextColor="#ddd"
              style={styles.input}
            />
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
        visible={modalVisible}
        transparent
        statusBarTranslucent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <Pressable style={styles.closeButton} onPress={handleCloseModal}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
            {verified ? (
              <>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successText}>{t("auth.accountVerified")}</Text>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>{t("auth.verifyEmailTitle")}</Text>
                <Text style={styles.modalSubtitle}>
                  {t("auth.weSentCode")}{"\n"}{isLogin ? unverifiedEmail : email}
                </Text>
                <TextInput
                  style={styles.codeInput}
                  placeholder={t("auth.enterCodePlaceholder")}
                  placeholderTextColor={"#fff"}
                  value={code}
                  onChangeText={(text) => {
                    setCode(text);
                    if (verifyError) setVerifyError("");
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                {verifyError ? <Text style={styles.errorText}>{verifyError}</Text> : null}
                <Pressable
                  style={[styles.verifyButton, verifying && styles.buttonDisabled]}
                  onPress={handleVerify}
                  disabled={verifying || code.trim().length < 6}
                >
                  {verifying ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.verifyButtonText}>{t("auth.verify")}</Text>
                  )}
                </Pressable>
                <Pressable
                  style={styles.resendButton}
                  onPress={handleResend}
                  disabled={resending}
                >
                  {resending ? (
                    <ActivityIndicator color={"#fff"} size="small" />
                  ) : (
                    <Text style={styles.resendText}>{t("auth.resendCode")}</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
