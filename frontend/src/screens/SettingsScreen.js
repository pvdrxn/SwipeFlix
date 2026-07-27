import React, { useContext, useEffect, useMemo, useState, useRef } from "react";
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
  Switch,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { AuthContext } from "../auth/AuthContext";
import { me, deleteAccount, sendPasswordCode, changePassword, changeUsername } from "../api/authApi";
import { clearLiked, clearDisliked, clearSaved, clearFavorites, clearAll } from "../api/picksApi";
import { useTheme } from "../theme";
import { LanguageContext } from "../context/LanguageContext";

export function SettingsScreen() {
  const { signOut } = useContext(AuthContext);
  const { language, setLanguage, t } = useContext(LanguageContext);
  const { colors, themeMode, toggleTheme } = useTheme();
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

  const [usernameModalVisible, setUsernameModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernamePassword, setUsernamePassword] = useState("");
  const [showUsernamePassword, setShowUsernamePassword] = useState(false);
  const [changingUsername, setChangingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [langModalVisible, setLangModalVisible] = useState(false);

  const eyeRef = useRef(null);

  const styles = useMemo(() => StyleSheet.create({
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
      backgroundColor: colors.border,
      marginHorizontal: 16,
    },

    chip: {
      alignSelf: "stretch",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 17,
      paddingHorizontal: 16,
    },
    chipDivider: {
      height: 1,
      backgroundColor: colors.border,
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
      backgroundColor: colors.bg.elevated,
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
      backgroundColor: colors.bg.elevated,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: colors.text.primary,
      fontSize: 16,
      marginBottom: 20,
    },
    errorText: {
      color: colors.accent,
      fontSize: 16,
      textAlign: "center",
      marginBottom: 20,
    },
    codeInput: {
      width: "100%",
      backgroundColor: colors.bg.elevated,
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
    modalButtons: {
      flexDirection: "row",
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 10,
      backgroundColor: colors.bg.elevated,
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
    langOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 10,
      marginBottom: 8,
    },
    langOptionActive: {
      backgroundColor: colors.bg.elevated,
    },
    langOptionText: {
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: "600",
    },
    langOptionTextActive: {
      color: colors.accent,
    },
  }), [colors]);

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
        setDeleteError(t("error.incorrectPassword"));
      } else {
        setDeleteError(t("error.somethingWrong"));
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
      setChangeError(t("error.passwordLength"));
      return;
    }
    setChangeError("");
    setSendingCode(true);
    try {
      await sendPasswordCode();
      setPwStep("code");
    } catch (err) {
      setChangeError(t("error.couldNotSendCode"));
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
        setVerifyError(err.response.data.detail || t("error.invalidCode"));
      } else {
        setVerifyError(t("error.somethingWrong"));
      }
    } finally {
      setVerifying(false);
    }
  }

  function confirmClear(action, labelKey) {
    const label = t(`alert.${labelKey}`);
    Alert.alert(
      t("alert.clearTitle", { label }),
      t("alert.clearMessage", { label: label.toLowerCase() }),
      [
        { text: t("modal.cancel"), style: "cancel" },
        { text: t("modal.delete"), style: "destructive", onPress: action },
      ]
    );
  }

  function handleClearLiked() {
    confirmClear(() => clearLiked().catch(() => {}), "liked");
  }
  function handleClearDisliked() {
    confirmClear(() => clearDisliked().catch(() => {}), "disliked");
  }
  function handleClearSaved() {
    confirmClear(() => clearSaved().catch(() => {}), "watchLater");
  }
  function handleClearFavorites() {
    confirmClear(() => clearFavorites().catch(() => {}), "favorites");
  }
  function handleResetLibrary() {
    confirmClear(() => clearAll().catch(() => {}), "library");
  }

  function handleOpenUsernameModal() {
    setNewUsername("");
    setUsernamePassword("");
    setUsernameError("");
    setShowUsernamePassword(false);
    setUsernameModalVisible(true);
  }

  async function handleChangeUsername() {
    setUsernameError("");
    if (newUsername.trim().length < 3) {
      setUsernameError(t("error.usernameLength"));
      return;
    }
    if (!usernamePassword) {
      setUsernameError(t("error.enterPassword"));
      return;
    }
    setChangingUsername(true);
    try {
      await changeUsername({ newUsername: newUsername.trim(), password: usernamePassword });
      setUsernameModalVisible(false);
      setUser((prev) => ({ ...prev, username: newUsername.trim() }));
      setNewUsername("");
      setUsernamePassword("");
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail?.toLowerCase().includes("incorrect password")) {
        setUsernameError(t("error.incorrectPassword"));
      } else if (detail?.toLowerCase().includes("already exists")) {
        setUsernameError(t("error.usernameTaken"));
      } else {
        setUsernameError(detail || t("error.somethingWrong"));
      }
    } finally {
      setChangingUsername(false);
    }
  }

  return (
    <View style={styles.root}>
      <View pointerEvents="box-none" style={styles.header}>
        <Text style={styles.headerTitle}>{t("settings.title")}</Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.text.secondary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          <View style={[styles.section, { backgroundColor: colors.bg.section }]}>
            <Text style={styles.sectionLabel}>{t("settings.account")}</Text>
            <View style={styles.row}>
                <Feather name="user" size={22} color={colors.text.primary} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowValue}>{user?.username || "—"}</Text>
                <Text style={styles.rowLabel}>{t("settings.username")}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <Pressable style={styles.chip} onPress={() => Alert.alert(t("modal.signOutTitle"), t("modal.signOutSubtitle"), [{ text: t("modal.cancel"), style: "cancel" }, { text: t("modal.signOut"), style: "destructive", onPress: signOut }])}>
              <View style={styles.chipIcon}>
                <Feather name="log-out" size={24} color={colors.text.primary} />
              </View>
              <Text style={styles.chipLabel}>{t("settings.signOut")}</Text>
            </Pressable>
          </View>

          <View style={[styles.section, { backgroundColor: colors.bg.section }]}>
            <Text style={styles.sectionLabel}>{t("settings.manageLibrary")}</Text>
            <Pressable style={styles.chip} onPress={handleClearLiked}>
              <View style={styles.chipIcon}>
                <Feather name="thumbs-up" size={22} color={colors.text.primary} />
              </View>
              <Text style={styles.chipLabel}>{t("settings.deleteLiked")}</Text>
            </Pressable>
            <View style={styles.chipDivider} />
            <Pressable style={styles.chip} onPress={handleClearDisliked}>
              <View style={styles.chipIcon}>
                <Feather name="thumbs-down" size={22} color={colors.text.primary} />
              </View>
              <Text style={styles.chipLabel}>{t("settings.deleteDisliked")}</Text>
            </Pressable>
            <View style={styles.chipDivider} />
            <Pressable style={styles.chip} onPress={handleClearSaved}>
              <View style={styles.chipIcon}>
                <Feather name="bookmark" size={22} color={colors.text.primary} />
              </View>
              <Text style={styles.chipLabel}>{t("settings.deleteWatchLater")}</Text>
            </Pressable>
            <View style={styles.chipDivider} />
            <Pressable style={styles.chip} onPress={handleClearFavorites}>
              <View style={styles.chipIcon}>
                <Feather name="star" size={22} color={colors.text.primary} />
              </View>
              <Text style={styles.chipLabel}>{t("settings.deleteFavorites")}</Text>
            </Pressable>
            <View style={styles.chipDivider} />
            <Pressable style={styles.chip} onPress={handleResetLibrary}>
              <View style={styles.chipIcon}>
                <Feather name="trash" size={22} color={colors.accent} />
              </View>
              <Text style={[styles.chipLabel, { color: colors.accent }]}>{t("settings.resetLibrary")}</Text>
            </Pressable>
          </View>

          <View style={[styles.section, { backgroundColor: colors.bg.section }]}>
            <Text style={styles.sectionLabel}>{t("settings.languageSection")}</Text>
            <Pressable style={styles.chip} onPress={() => setLangModalVisible(true)}>
              <View style={styles.chipIcon}>
                <Feather name="globe" size={22} color={colors.text.primary} />
              </View>
              <Text style={styles.chipLabel}>{t(`language.${language}`)}</Text>
              <Feather name="chevron-right" size={20} color={colors.text.tertiary} style={{ marginLeft: "auto" }} />
            </Pressable>
          </View>

          <View style={[styles.section, { backgroundColor: colors.bg.section }]}>
            <Text style={styles.sectionLabel}>{t("settings.appearance")}</Text>
            <View style={styles.row}>
              <Feather name={themeMode === "dark" ? "moon" : "sun"} size={22} color={colors.text.primary} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowValue}>{t("settings.darkMode")}</Text>
              </View>
              <Switch
                value={themeMode === "dark"}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.bg.elevated, true: colors.accent }}
                thumbColor={colors.text.primary}
              />
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.bg.section }]}>
            <Text style={styles.sectionLabel}>{t("settings.manageAccount")}</Text>
            <Pressable style={styles.chip} onPress={handleOpenPwModal}>
              <View style={styles.chipIcon}>
                <Feather name="lock" size={22} color={colors.text.primary} />
              </View>
              <Text style={styles.chipLabel}>{t("settings.changePassword")}</Text>
            </Pressable>
            <View style={styles.chipDivider} />
            <Pressable style={styles.chip} onPress={handleOpenUsernameModal}>
              <View style={styles.chipIcon}>
                <Feather name="edit-3" size={22} color={colors.text.primary} />
              </View>
              <Text style={styles.chipLabel}>{t("settings.changeUsername")}</Text>
            </Pressable>
            <View style={styles.chipDivider} />
            <Pressable style={styles.chip} onPress={handleOpenDeleteModal}>
              <View style={styles.chipIcon}>
                <Feather name="trash-2" size={22} color={colors.accent} />
              </View>
              <Text style={[styles.chipLabel, { color: colors.accent }]}>{t("settings.deleteAccount")}</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t("footer.tmdb")}
            </Text>
          </View>
        </ScrollView>
      )}

      <Modal
        visible={deleteModalVisible}
        transparent
        statusBarTranslucent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("modal.deleteAccountTitle")}</Text>
            <Text style={styles.modalSubtitle}>{t("modal.deleteAccountSubtitle")}</Text>

            <TextInput
              style={styles.passwordInput}
              placeholder={t("modal.enterPassword")}
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
                <Text style={styles.cancelButtonText}>{t("modal.cancel")}</Text>
              </Pressable>
              <Pressable
                style={[styles.deleteButton, (deleting || !deletePassword) && styles.buttonDisabled]}
                onPress={handleDelete}
                disabled={deleting || !deletePassword}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.deleteButtonText}>{t("modal.delete")}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={pwModalVisible}
        transparent
        statusBarTranslucent={true}
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
                <Text style={styles.modalTitle}>{t("modal.changePassword")}</Text>
                <View style={styles.modalInputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={t("modal.newPassword")}
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
                    <Text style={styles.verifyButtonText}>{t("modal.sendCode")}</Text>
                  )}
                </Pressable>
              </>
            ) : pwStep === "code" ? (
              <>
                <Text style={styles.modalTitle}>{t("modal.confirmPasswordChange")}</Text>
                <Text style={styles.modalSubtitle}>
                  {t("modal.weSentCode")}{"\n"}{user?.email}
                </Text>
                <TextInput
                  style={styles.codeInput}
                  placeholder={t("modal.enterCode")}
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
                    <Text style={styles.verifyButtonText}>{t("modal.confirm")}</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successText}>{t("modal.passwordChangedSuccess")}</Text>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={usernameModalVisible}
        transparent
        statusBarTranslucent={true}
        animationType="fade"
        onRequestClose={() => setUsernameModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <Pressable style={styles.closeButton} onPress={() => setUsernameModalVisible(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>

            <Text style={styles.modalTitle}>{t("modal.changeUsername")}</Text>
            <Text style={styles.modalSubtitle}>{t("modal.changeUsernameSubtitle")}</Text>

            <View style={styles.modalInputWrapper}>
              <TextInput
                style={styles.modalInput}
                placeholder={t("modal.newUsername")}
                placeholderTextColor={colors.text.muted}
                value={newUsername}
                onChangeText={(text) => {
                  setNewUsername(text);
                  if (usernameError) setUsernameError("");
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.modalInputWrapper}>
              <TextInput
                style={styles.modalInput}
                placeholder={t("modal.enterPassword")}
                placeholderTextColor={colors.text.muted}
                secureTextEntry={!showUsernamePassword}
                value={usernamePassword}
                onChangeText={(text) => {
                  setUsernamePassword(text);
                  if (usernameError) setUsernameError("");
                }}
                autoCapitalize="none"
              />
              <Pressable
                style={styles.modalEyeButton}
                onPressIn={() => setShowUsernamePassword(true)}
                onPressOut={() => setShowUsernamePassword(false)}
              >
                <Feather
                  name={showUsernamePassword ? "eye-off" : "eye"}
                  size={22}
                  color={colors.text.muted}
                />
              </Pressable>
            </View>

            {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}

            <Pressable
              style={[styles.verifyButton, changingUsername && styles.buttonDisabled]}
              onPress={handleChangeUsername}
              disabled={changingUsername || !newUsername.trim() || !usernamePassword}
            >
              {changingUsername ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.verifyButtonText}>{t("modal.save")}</Text>
              )}
            </Pressable>
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
        <Pressable style={styles.modalOverlay} onPress={() => setLangModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("language.select")}</Text>
            {["en", "es", "ru"].map((lang) => (
              <Pressable
                key={lang}
                style={[
                  styles.langOption,
                  language === lang && styles.langOptionActive,
                ]}
                onPress={() => {
                  setLanguage(lang);
                  setLangModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.langOptionText,
                    language === lang && styles.langOptionTextActive,
                  ]}
                >
                  {t(`language.${lang}`)}
                </Text>
                {language === lang && (
                  <Feather name="check" size={20} color={colors.accent} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}


