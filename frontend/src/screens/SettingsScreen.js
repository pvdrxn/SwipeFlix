import React, { useContext, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { AuthContext } from "../auth/AuthContext";
import { me, deleteAccount, sendPasswordCode, changePassword, sendEmailCode, changeEmail } from "../api/authApi";
import { clearLiked, clearDisliked, clearSaved, clearFavorites, clearAll } from "../api/picksApi";
import { colors } from "../theme";

export function SettingsScreen() {
  const { signOut } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [pwStep, setPwStep] = useState("input");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [changeError, setChangeError] = useState("");
  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const [emailStep, setEmailStep] = useState("input");
  const [newEmail, setNewEmail] = useState("");
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState("");
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailVerifyError, setEmailVerifyError] = useState("");

  const eyeRef = useRef(null);

  useEffect(() => {
    me()
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleOpenDeleteModal() {
    setDeletePassword("");
    setDeleteError("");
    setDeleteModalVisible(true);
  }

  async function handleDelete() {
    setDeleteError("");
    setDeleting(true);
    try {
      await deleteAccount({ password: deletePassword });
      setDeleteModalVisible(false);
      signOut();
    } catch (err) {
      if (err.response?.status === 400) {
        setDeleteError("Incorrect password.");
      } else {
        setDeleteError("Something went wrong. Try again.");
      }
    } finally {
      setDeleting(false);
    }
  }

  function handleOpenPwModal() {
    setPwStep("input");
    setNewPassword("");
    setShowNewPassword(false);
    setChangeError("");
    setCode("");
    setVerifyError("");
    setPwModalVisible(true);
  }

  async function handleSendCode() {
    if (newPassword.length < 8) {
      setChangeError("Password must be at least 8 characters.");
      return;
    }
    setChangeError("");
    setSendingCode(true);
    try {
      await sendPasswordCode();
      setPwStep("code");
    } catch (err) {
      setChangeError("Could not send code. Try again.");
    } finally {
      setSendingCode(false);
    }
  }

  async function handleVerifyCode() {
    setVerifyError("");
    setVerifying(true);
    try {
      await changePassword({ code: code.trim(), newPassword });
      setPwStep("success");
      await new Promise((r) => setTimeout(r, 1500));
      setPwModalVisible(false);
      setNewPassword("");
      setCode("");
    } catch (err) {
      if (err.response?.status === 400) {
        setVerifyError(err.response.data.detail || "Invalid or expired code.");
      } else {
        setVerifyError("Something went wrong. Try again.");
      }
    } finally {
      setVerifying(false);
    }
  }

  function confirmClear(action, label) {
    Alert.alert(
      `Clear ${label}`,
      `Are you sure you want to delete all ${label.toLowerCase()}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: action },
      ]
    );
  }

  function handleClearLiked() {
    confirmClear(
      () => clearLiked().catch(() => {}),
      "Liked"
    );
  }

  function handleClearDisliked() {
    confirmClear(
      () => clearDisliked().catch(() => {}),
      "Disliked"
    );
  }

  function handleClearSaved() {
    confirmClear(
      () => clearSaved().catch(() => {}),
      "Watch Later"
    );
  }

  function handleClearFavorites() {
    confirmClear(
      () => clearFavorites().catch(() => {}),
      "Favorites"
    );
  }

  function handleResetLibrary() {
    confirmClear(
      () => clearAll().catch(() => {}),
      "Library"
    );
  }

  function handleOpenEmailModal() {
    setEmailStep("input");
    setNewEmail("");
    setEmailChangeError("");
    setEmailCode("");
    setEmailVerifyError("");
    setEmailModalVisible(true);
  }

  async function handleSendEmailCode() {
    if (!newEmail.includes("@")) {
      setEmailChangeError("Enter a valid email address.");
      return;
    }
    setEmailChangeError("");
    setSendingEmailCode(true);
    try {
      await sendEmailCode({ newEmail });
      setEmailStep("code");
    } catch (err) {
      setEmailChangeError(err.response?.data?.detail || "Could not send code. Try again.");
    } finally {
      setSendingEmailCode(false);
    }
  }

  async function handleVerifyEmailCode() {
    setEmailVerifyError("");
    setVerifyingEmail(true);
    try {
      await changeEmail({ code: emailCode.trim(), newEmail });
      setEmailStep("success");
      await new Promise((r) => setTimeout(r, 1500));
      setEmailModalVisible(false);
      setNewEmail("");
      setEmailCode("");
      setUser((prev) => ({ ...prev, email: newEmail }));
    } catch (err) {
      if (err.response?.status === 400) {
        setEmailVerifyError(err.response.data.detail || "Invalid or expired code.");
      } else {
        setEmailVerifyError("Something went wrong. Try again.");
      }
    } finally {
      setVerifyingEmail(false);
    }
  }

  return (
    <View style={styles.root}>
      <View pointerEvents="box-none" style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.text.secondary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          <View style={[styles.section, { backgroundColor: "#1a1a1a" }]}>
            <Text style={styles.sectionLabel}>ACCOUNT</Text>
            <View style={styles.row}>
                <Feather name="user" size={22} color={colors.text.primary} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowValue}>{user?.username || "—"}</Text>
                <Text style={styles.rowLabel}>Username</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
                <Feather name="mail" size={22} color={colors.text.primary} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowValue}>{user?.email || "—"}</Text>
                <Text style={styles.rowLabel}>Email</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <Pressable style={styles.chip} onPress={signOut}>
              <View style={styles.chipIcon}>
                <Feather name="log-out" size={24} color={colors.text.primary} />
              </View>
              <Text style={styles.chipLabel}>Sign out</Text>
            </Pressable>
          </View>

          <View style={[styles.section, { backgroundColor: "#1a1a1a" }]}>
            <Text style={styles.sectionLabel}>MANAGE LIBRARY</Text>
            <Pressable style={styles.chip} onPress={handleClearLiked}>
              <View style={styles.chipIcon}>
                <Feather name="thumbs-up" size={22} color={colors.text.primary} />
              </View>
              <Text style={styles.chipLabel}>Delete liked list</Text>
            </Pressable>
            <View style={styles.chipDivider} />
            <Pressable style={styles.chip} onPress={handleClearDisliked}>
              <View style={styles.chipIcon}>
                <Feather name="thumbs-down" size={22} color={colors.text.primary} />
              </View>
              <Text style={styles.chipLabel}>Delete disliked list</Text>
            </Pressable>
            <View style={styles.chipDivider} />
            <Pressable style={styles.chip} onPress={handleClearSaved}>
              <View style={styles.chipIcon}>
                <Feather name="bookmark" size={22} color={colors.text.primary} />
              </View>
              <Text style={styles.chipLabel}>Delete watch later list</Text>
            </Pressable>
            <View style={styles.chipDivider} />
            <Pressable style={styles.chip} onPress={handleClearFavorites}>
              <View style={styles.chipIcon}>
                <Feather name="star" size={22} color={colors.text.primary} />
              </View>
              <Text style={styles.chipLabel}>Delete favorites list</Text>
            </Pressable>
            <View style={styles.chipDivider} />
            <Pressable style={styles.chip} onPress={handleResetLibrary}>
              <View style={styles.chipIcon}>
                <Feather name="refresh-cw" size={22} color={colors.accent} />
              </View>
              <Text style={[styles.chipLabel, { color: colors.accent }]}>Reset library</Text>
            </Pressable>
          </View>

          <View style={[styles.section, { backgroundColor: "#1a1a1a" }]}>
            <Text style={styles.sectionLabel}>MANAGE ACCOUNT</Text>
            <Pressable style={styles.chip} onPress={handleOpenPwModal}>
              <View style={styles.chipIcon}>
                <Feather name="lock" size={22} color={colors.text.primary} />
              </View>
              <Text style={styles.chipLabel}>Change password</Text>
            </Pressable>
            <View style={styles.chipDivider} />
            <Pressable style={styles.chip} onPress={handleOpenEmailModal}>
              <View style={styles.chipIcon}>
                <Feather name="mail" size={22} color={colors.text.primary} />
              </View>
              <Text style={styles.chipLabel}>Change email</Text>
            </Pressable>
            <View style={styles.chipDivider} />
            <Pressable style={styles.chip} onPress={handleOpenDeleteModal}>
              <View style={styles.chipIcon}>
                <Feather name="trash-2" size={22} color={colors.accent} />
              </View>
              <Text style={[styles.chipLabel, { color: colors.accent }]}>Delete account</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              This product uses the TMDB API but is not endorsed or certified by TMDB.
            </Text>
          </View>
        </ScrollView>
      )}

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Are you sure you want to delete your account?</Text>
            <Text style={styles.modalSubtitle}>This action cannot be undone.</Text>

            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor={colors.text.muted}
              secureTextEntry
              value={deletePassword}
              onChangeText={(text) => {
                setDeletePassword(text);
                if (deleteError) setDeleteError("");
              }}
              autoCapitalize="none"
            />

            {deleteError ? <Text style={styles.errorText}>{deleteError}</Text> : null}

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.deleteButton, deleting && styles.buttonDisabled]}
                onPress={handleDelete}
                disabled={deleting || !deletePassword}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={pwModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPwModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <Pressable style={styles.closeButton} onPress={() => setPwModalVisible(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>

            {pwStep === "input" ? (
              <>
                <Text style={styles.modalTitle}>Change password</Text>
                <View style={styles.modalInputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="New password"
                    placeholderTextColor={colors.text.muted}
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      if (changeError) setChangeError("");
                    }}
                    autoCapitalize="none"
                  />
                  <Pressable
                    style={styles.modalEyeButton}
                    onPressIn={() => setShowNewPassword(true)}
                    onPressOut={() => setShowNewPassword(false)}
                  >
                    <Feather
                      name={showNewPassword ? "eye-off" : "eye"}
                      size={22}
                      color={colors.text.muted}
                    />
                  </Pressable>
                </View>
                {changeError ? <Text style={styles.errorText}>{changeError}</Text> : null}
                <Pressable
                  style={[styles.verifyButton, sendingCode && styles.buttonDisabled]}
                  onPress={handleSendCode}
                  disabled={sendingCode || newPassword.length < 8}
                >
                  {sendingCode ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.verifyButtonText}>Send code</Text>
                  )}
                </Pressable>
              </>
            ) : pwStep === "code" ? (
              <>
                <Text style={styles.modalTitle}>Confirm password change</Text>
                <Text style={styles.modalSubtitle}>
                  We sent a 6-digit code to{"\n"}{user?.email}
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
                  onPress={handleVerifyCode}
                  disabled={verifying || code.trim().length < 6}
                >
                  {verifying ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.verifyButtonText}>Confirm</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successText}>Password changed successfully</Text>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={emailModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <Pressable style={styles.closeButton} onPress={() => setEmailModalVisible(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>

            {emailStep === "input" ? (
              <>
                <Text style={styles.modalTitle}>Change email</Text>
                <View style={styles.modalInputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="New email"
                    placeholderTextColor={colors.text.muted}
                    value={newEmail}
                    onChangeText={(text) => {
                      setNewEmail(text);
                      if (emailChangeError) setEmailChangeError("");
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                {emailChangeError ? <Text style={styles.errorText}>{emailChangeError}</Text> : null}
                <Pressable
                  style={[styles.verifyButton, sendingEmailCode && styles.buttonDisabled]}
                  onPress={handleSendEmailCode}
                  disabled={sendingEmailCode || newEmail.length < 3}
                >
                  {sendingEmailCode ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.verifyButtonText}>Send code</Text>
                  )}
                </Pressable>
              </>
            ) : emailStep === "code" ? (
              <>
                <Text style={styles.modalTitle}>Confirm email change</Text>
                <Text style={styles.modalSubtitle}>
                  We sent a 6-digit code to{"\n"}{newEmail}
                </Text>
                <TextInput
                  style={styles.codeInput}
                  placeholder="Enter code"
                  placeholderTextColor={colors.text.muted}
                  value={emailCode}
                  onChangeText={(text) => {
                    setEmailCode(text);
                    if (emailVerifyError) setEmailVerifyError("");
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                {emailVerifyError ? <Text style={styles.errorText}>{emailVerifyError}</Text> : null}
                <Pressable
                  style={[styles.verifyButton, verifyingEmail && styles.buttonDisabled]}
                  onPress={handleVerifyEmailCode}
                  disabled={verifyingEmail || emailCode.trim().length < 6}
                >
                  {verifyingEmail ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.verifyButtonText}>Confirm</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successText}>Email changed successfully</Text>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: colors.bg.primary,
    zIndex: 10,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: "800",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: colors.bg.card,
    borderRadius: 12,
    marginBottom: 24,
    paddingBottom: 4,
  },
  sectionLabel: {
    color: colors.text.tertiary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowInfo: {
    marginLeft: 12,
    flex: 1,
  },
  rowValue: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  rowLabel: {
    color: colors.text.tertiary,
    fontSize: 16,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#444",
    marginHorizontal: 16,
  },

  chip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 17,
    paddingHorizontal: 16,
  },
  chipDivider: {
    height: 1,
    backgroundColor: "#444",
    marginHorizontal: 16,
  },
  chipIcon: {
    width: 24,
    alignItems: "center",
  },
  chipLabel: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  modalInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    width: "100%",
    marginBottom: 12,
  },
  modalInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text.primary,
    fontSize: 16,
  },
  modalEyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 14,
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
    color: colors.text.muted,
    fontSize: 16,
    fontWeight: "600",
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    color: colors.text.tertiary,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  passwordInput: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text.primary,
    fontSize: 16,
    marginBottom: 12,
  },
  codeInput: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: 12,
  },
  errorText: {
    color: colors.accent,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  verifyButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: "center",
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  successIcon: {
    color: colors.success,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  successText: {
    color: colors.success,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  footer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  footerText: {
    color: colors.text.muted,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});
