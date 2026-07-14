import React, { useContext, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { AuthContext } from "../auth/AuthContext";
import { verifyEmail, resendCode } from "../api/authApi";
import { useTheme } from "../theme";

export function LoginScreen({ navigation }) {
  const { signIn } = useContext(AuthContext);
  const { colors } = useTheme();
  const [username, setUsername] = useState("");
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

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      justifyContent: "center",
      backgroundColor: colors.bg.primary,
    },
    title: {
      color: colors.text.primary,
      fontSize: 32,
      fontWeight: "700",
      marginBottom: 6,
    },
    subtitle: {
      color: colors.text.secondary,
      fontSize: 16,
      marginBottom: 24,
    },
    card: {
      backgroundColor: colors.bg.card,
      borderColor: colors.bg.card,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
    },
    label: {
      color: colors.text.primary,
      fontSize: 13,
      marginTop: 10,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.bg.elevated,
      borderColor: colors.bg.elevated,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      color: colors.text.primary,
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
      color: colors.text.secondary,
      fontSize: 13,
      lineHeight: 18,
    },
    verifyLink: {
      color: colors.accent,
      fontWeight: "700",
      textDecorationLine: "underline",
    },
    button: {
      marginTop: 16,
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
    },
    buttonPressed: {
      opacity: 0.9,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: colors.text.primary,
      fontWeight: "700",
      fontSize: 16,
    },
    linkButton: {
      marginTop: 14,
      alignItems: "center",
    },
    linkText: {
      color: colors.text.secondary,
      fontSize: 14,
      textDecorationLine: "underline",
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.bg.overlay,
    },
    modalContent: {
      width: "85%",
      backgroundColor: colors.bg.modal,
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
      color: colors.text.muted,
      fontSize: 20,
      fontWeight: "600",
    },
    modalTitle: {
      color: colors.text.primary,
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 8,
    },
    modalSubtitle: {
      color: colors.text.secondary,
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
      color: colors.text.primary,
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
      color: colors.text.secondary,
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
  }), [colors]);

  async function onSubmit() {
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

  async function handleVerify() {
    setVerifyError("");
    setVerifying(true);
    try {
      await verifyEmail({ email: unverifiedEmail, code: code.trim() });
      setVerified(true);
      await new Promise((r) => setTimeout(r, 1500));
      setModalVisible(false);
      setVerified(false);
      await signIn({ username: username.trim(), password });
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
      await resendCode({ email: unverifiedEmail });
    } catch (e) {
      setVerifyError("Could not resend code. Try again.");
    } finally {
      setResending(false);
    }
  }

  const canSubmit = username.trim().length > 0 && password.length > 0 && !submitting;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to pick your next movie.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="juan"
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {unverifiedEmail ? (
          <View style={styles.unverifiedContainer}>
            <Text style={styles.unverifiedText}>
              To sign in you need to verify your email first.{" "}
              <Text style={styles.verifyLink} onPress={() => setModalVisible(true)}>
                Verify email
              </Text>
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.button,
            !canSubmit && styles.buttonDisabled,
            pressed && canSubmit && styles.buttonPressed,
          ]}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log in</Text>}
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Register")} style={styles.linkButton}>
          <Text style={styles.linkText}>New here? Create an account</Text>
        </Pressable>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>

            {verified ? (
              <>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successText}>Account verified successfully</Text>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Verify your email</Text>
                <Text style={styles.modalSubtitle}>
                  We sent a 6-digit code to{"\n"}{unverifiedEmail}
                </Text>

                <TextInput
                  style={styles.codeInput}
                  placeholder="Enter code"
                  placeholderTextColor={colors.text.muted}
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
                    <Text style={styles.verifyButtonText}>Verify</Text>
                  )}
                </Pressable>

                <Pressable
                  style={styles.resendButton}
                  onPress={handleResend}
                  disabled={resending}
                >
                  {resending ? (
                    <ActivityIndicator color={colors.text.secondary} size="small" />
                  ) : (
                    <Text style={styles.resendText}>Resend code</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
