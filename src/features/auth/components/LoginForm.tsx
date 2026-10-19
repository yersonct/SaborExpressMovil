"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ScrollView,
  TextInput,
  useWindowDimensions,
  Animated,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { setApiLanguage } from "../services/apiLanguage";
import { ForgotPasswordFlow } from "./ForgotPasswordFlow";
import { ClientRegistrationFlow } from "./ClientRegistrationFlow";
import { LanguageDropdown } from "../../../components/LanguageDropdown";
import { AuthInput } from "./AuthInput";
import { AnimatedSuccessModal } from "./AnimatedSuccessModal";
import { EmailConfirmationModal } from "./EmailConfirmationModal";
import { AccountActivationModal } from "./AccountActivationModal";
import {
  ROLE_ROUTES,
  ROLE_LABELS,
  resolvePrimaryRole,
  resolveEffectiveRole,
} from "../services/roleMap";
import { styles } from "./style/LoginForm.styles";
import { setNetworkErrorLanguage } from "@/features/shared/services/networkStatus";

const translations = require("../../../locales/translations.json") as Record<
  string,
  Record<string, string>
>;
type LanguageCode = "es" | "en" | "pt" | "fr";

const serverDownTitles: Record<LanguageCode, string> = {
  es: "Sin conexión con el sistema",
  en: "Unable to connect to the service",
  pt: "Sem conexão com o sistema",
  fr: "Connexion au service impossible",
};

export const LoginForm = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>("es");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const [activeView, setActiveView] = useState<
    "login" | "forgot" | "registerClient"
  >("login");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showClientSuccess, setShowClientSuccess] = useState(false);
  const [showServerDownAlert, setShowServerDownAlert] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [noMobileAccess, setNoMobileAccess] = useState(false);

  const {
    user,
    loading,
    error,
    errorCode,
    pendingIdentifier,
    handleLogin,
    handleLogout,
    clearError,
  } = useAuth();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const t = translations[selectedLanguage] || translations.es;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Registrar el campo enfocado, sin mover el formulario hasta arriba.
  const scrollRef = useRef<ScrollView>(null);
  const identifierRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const focusedFieldRef = useRef<"identifier" | "password" | null>(null);
  const scrollOffsetRef = useRef(0);

  // Desplazamiento real: solo lo necesario para ver el campo sobre el teclado.
  const ensureFocusedFieldVisible = (keyboardTop: number) => {
    const input = focusedFieldRef.current === "identifier"
      ? identifierRef.current
      : focusedFieldRef.current === "password"
        ? passwordRef.current
        : null;
    if (!input) return;

    input.measureInWindow((_x, y, _width, height) => {
      const overlap = y + height + 24 - keyboardTop;
      if (overlap > 0) {
        scrollRef.current?.scrollTo({
          y: Math.max(0, scrollOffsetRef.current + overlap),
          animated: true,
        });
      }
    });
  };

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (event) => {
      setKeyboardVisible(true);
      // Esperar a que Android/iOS termine de recalcular el area util.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          ensureFocusedFieldVisible(event.endCoordinates.screenY);
        });
      });
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
      focusedFieldRef.current = null;
      scrollOffsetRef.current = 0;
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeView]);

  useEffect(() => {
    const storedLanguage = globalThis.localStorage?.getItem(
      "saborexpress-login-language",
    ) as LanguageCode | null;
    const storedTheme = globalThis.localStorage?.getItem(
      "saborexpress-login-theme",
    ) as "light" | "dark" | null;
    if (storedLanguage && translations[storedLanguage])
      setSelectedLanguage(storedLanguage);
    if (storedTheme === "light" || storedTheme === "dark")
      setThemeMode(storedTheme);
  }, []);

  useEffect(() => {
    setNetworkErrorLanguage(selectedLanguage);
    setApiLanguage(selectedLanguage);
    globalThis.localStorage?.setItem("saborexpress-login-language", selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    if (errorCode === "SERVER_DOWN") setShowServerDownAlert(true);
  }, [errorCode]);

  useEffect(() => {
    globalThis.localStorage?.setItem("saborexpress-login-theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (user) {
      const effectiveRole = resolveEffectiveRole(
        user.roles,
        user.hasActiveShift,
        user.activeShiftRoleName,
      );
      const route = ROLE_ROUTES[effectiveRole];
      // ... el resto del bloque queda igual

      if (!route) {
        // Es Gerente/Administrador (o rol sin pantalla móvil todavía)
        setNoMobileAccess(true);
        setIsNavigating(false);
        return;
      }

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        setIsNavigating(true);
        router.replace(route as any);
      }, 1200);
    } else {
      setIsNavigating(false);
    }
  }, [user, router]);

  const isDark = themeMode === "dark";
  const themeColors = {
    background: isDark ? "#0B1220" : "#F8FAFC",
    surface: isDark ? "#111827" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#1E293B",
    mutedText: isDark ? "#CBD5E1" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBackground: isDark ? "#111827" : "#F8FAFC",
    buttonBackground: "#E61C24",
    buttonText: "#FFFFFF",
    toggleBg: isDark ? "#1F2937" : "#E2E8F0",
  };

  if (isNavigating) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: themeColors.background,
          },
        ]}
      >
        <ActivityIndicator size="large" color="#E61C24" />
        <Text
          style={{
            marginTop: 15,
            color: themeColors.mutedText,
            fontSize: 16,
            fontWeight: "500",
          }}
        >
          {t.openingPanel || "Abriendo panel..."}
        </Text>
      </View>
    );
  }

  if (noMobileAccess) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
            backgroundColor: themeColors.background,
          },
        ]}
      >
        <Ionicons name="alert-circle-outline" size={48} color="#E61C24" />
        <Text
          style={{
            marginTop: 16,
            color: themeColors.text,
            fontSize: 16,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Tu cuenta no tiene acceso a la app móvil
        </Text>
        <Text
          style={{
            marginTop: 8,
            color: themeColors.mutedText,
            fontSize: 14,
            textAlign: "center",
          }}
        >
          Los roles de Gerente y Administrador usan el panel web de
          SaborExpress.
        </Text>
        <TouchableOpacity
          style={[styles.logoutButton, { marginTop: 24 }]}
          onPress={() => {
            handleLogout();
            setNoMobileAccess(false);
          }}
        >
          <Text style={styles.logoutButtonText}>Volver a intentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (user && !showSuccessModal) {
    return (
      <View
        style={[
          styles.welcomeContainer,
          { backgroundColor: themeColors.background },
        ]}
      >
        <Animated.View
          style={[
            styles.profileCard,
            {
              backgroundColor: themeColors.surface,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Image
            source={isDark
              ? require("../../../../assets/images/logo-dark.png")
              : require("../../../../assets/images/logo.png")}
            style={styles.profileImage}
          />
          <Text style={[styles.welcomeTitle, { color: themeColors.mutedText }]}>
            {t.welcomeBack}
          </Text>

          {/* CORRECCIÓN 2: Cambiamos user.name por user.identifier */}
          <Text style={[styles.userName, { color: themeColors.text }]}>
            {user.identifier}
          </Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {ROLE_LABELS[resolvePrimaryRole(user.roles)] ?? "USUARIO"}
            </Text>
          </View>
        </Animated.View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutButtonText}>{t.logout}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      <View style={[styles.headerTopBar, { paddingHorizontal: windowWidth < 360 ? 14 : 24 }]}>
        <View
          style={[
            styles.themeToggle,
            { backgroundColor: themeColors.toggleBg },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.themeIconButton,
              !isDark && styles.themeIconButtonActive,
            ]}
            onPress={() => setThemeMode("light")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="sunny"
              size={18}
              color={!isDark ? "#E61C24" : themeColors.mutedText}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.themeIconButton,
              isDark && [
                styles.themeIconButtonActive,
                { backgroundColor: "#3F3F46" },
              ],
            ]}
            onPress={() => setThemeMode("dark")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="moon"
              size={18}
              color={isDark ? "#FAFAFA" : themeColors.mutedText}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.languageSelectorContainer}>
          <LanguageDropdown
            label={""}
            compact
            value={selectedLanguage}
            options={(["es", "en", "pt", "fr"] as LanguageCode[]).map(
              (lang) => ({
                label: translations[lang].languageName,
                value: lang,
              }),
            )}
            onChange={(value) => setSelectedLanguage(value as LanguageCode)}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        {/* Logo compacto fijo sobre el formulario mientras está abierto el teclado. El logo queda fuera del ScrollView, así no desaparece al desplazar los inputs. */}
        {activeView === "login" && keyboardVisible && (
          <View
            style={{
              width: "100%",
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 2,
              paddingBottom: 4,
            }}
          >
            <Image
              source={isDark
                ? require("../../../../assets/images/logo-dark.png")
                : require("../../../../assets/images/logo.png")}
              style={{
                width: "100%",
                height: Math.max(118, Math.min(windowWidth * 0.42, 160)),
              }}
              resizeMode="contain"
              accessibilityLabel="SaborExpress"
            />
          </View>
        )}

        <ScrollView
          ref={scrollRef}
          onScroll={(event) => {
            scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.scrollContainer,
            {
              justifyContent: keyboardVisible ? "flex-start" : "center",
              paddingTop: keyboardVisible ? 4 : 0,
              paddingHorizontal: windowWidth < 360 ? 12 : 20,
              paddingBottom: keyboardVisible ? 24 : 36,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {activeView === "login" && !keyboardVisible && (
            <Animated.View
              style={[styles.logoContainer, { opacity: fadeAnim, marginBottom: 8 }]}
            >
              <Image
                source={isDark
                  ? require("../../../../assets/images/logo-dark.png")
                  : require("../../../../assets/images/logo.png")}
                style={[styles.logo, { height: Math.min(windowWidth * 0.68, 250), marginBottom: 0 }]}
                resizeMode="contain"
              />
            </Animated.View>
          )}

          <Animated.View
            style={[
              styles.formContainer,
              { maxWidth: 520, alignSelf: "center", padding: windowWidth < 360 ? 18 : windowWidth < 420 ? 24 : 28 },
              {
                backgroundColor: themeColors.surface,
                shadowColor: isDark ? "#000" : "#E61C24",
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {activeView === "forgot" && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setActiveView("login")}
              ></TouchableOpacity>
            )}

            {activeView === "login" && (
              <>
                <AuthInput
                  label={t.identifierLabel || t.usernameLabel}
                  placeholder={t.identifierPlaceholder || t.usernamePlaceholder}
                  value={identifier}
                  inputRef={identifierRef}
                  onFocus={() => {
                    focusedFieldRef.current = "identifier";
                    const metrics =
  typeof Keyboard.metrics === "function"
    ? Keyboard.metrics()
    : undefined;
                    if (metrics) requestAnimationFrame(() => ensureFocusedFieldVisible(metrics.screenY));
                  }}
                  onChangeText={setIdentifier}
                  error={!!error && errorCode !== "SERVER_DOWN"}
                  themeColors={themeColors}
                />
                <AuthInput
                  label={t.passwordLabel}
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  inputRef={passwordRef}
                  onFocus={() => {
                    focusedFieldRef.current = "password";
                    const metrics =
  typeof Keyboard.metrics === "function"
    ? Keyboard.metrics()
    : undefined;
                    if (metrics) requestAnimationFrame(() => ensureFocusedFieldVisible(metrics.screenY));
                  }}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  showPasswordToggle={true}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  error={!!error && errorCode !== "SERVER_DOWN"}
                  themeColors={themeColors}
                />

                <TouchableOpacity
                  onPress={() => setActiveView("forgot")}
                  style={styles.forgotPasswordContainer}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotText}>{t.forgotPassword}</Text>
                </TouchableOpacity>

                {error && errorCode !== "SERVER_DOWN" ? <Text style={styles.errorText}>{error}</Text> : null}

                {loading ? (
                  <ActivityIndicator
                    size="large"
                    color="#E61C24"
                    style={styles.loader}
                  />
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      { backgroundColor: themeColors.buttonBackground },
                    ]}
                    onPress={() => handleLogin(identifier, password)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.loginButtonText,
                        { color: themeColors.buttonText },
                      ]}
                    >
                      {t.signIn}
                    </Text>
                  </TouchableOpacity>
                )}

                <View style={styles.registerClientLinkContainer}>
                  <Text
                    style={[
                      styles.registerClientText,
                      { color: themeColors.mutedText },
                    ]}
                  >
                    {t.noAccount}{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setActiveView("registerClient")}
                  >
                    <Text style={styles.registerClientAction}>
                      {t.registerHere}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {activeView === "forgot" && (
              <ForgotPasswordFlow
                onSuccess={() => setActiveView("login")}
                onCancel={() => setActiveView("login")}
                t={t}
                themeColors={themeColors}
              />
            )}

            {activeView === "registerClient" && (
              <ClientRegistrationFlow
                themeColors={themeColors}
                t={t}
                onCancel={() => setActiveView("login")}
                onSuccess={() => {
                  setActiveView("login");
                  setShowClientSuccess(true);
                  setTimeout(() => setShowClientSuccess(false), 5000);
                }}
              />
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AnimatedSuccessModal
        visible={showSuccessModal}
        title={t.successTitle}
        text={t.successText}
      />
      <AnimatedSuccessModal
        visible={showClientSuccess}
        title="¡Cuenta Creada!"
        text="Te enviamos un correo. Presiona el botón 'Activar cuenta' para poder iniciar sesión."
      />
      <EmailConfirmationModal
        visible={errorCode === "EMAIL_NOT_CONFIRMED"}
        identifier={pendingIdentifier}
        themeColors={themeColors}
        t={t}
        onCancel={clearError}
      />

      <AccountActivationModal
        visible={errorCode === "ACCOUNT_NOT_ACTIVATED"}
        identifier={pendingIdentifier}
        themeColors={themeColors}
        onCancel={clearError}
      />

      <Modal
        transparent
        visible={showServerDownAlert}
        animationType="fade"
        onRequestClose={() => {
          setShowServerDownAlert(false);
          clearError();
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 360,
              padding: 24,
              borderRadius: 20,
              backgroundColor: themeColors.surface,
              alignItems: "center",
            }}
          >
            <Ionicons name="cloud-offline-outline" size={44} color="#E61C24" />
            <Text
              style={{
                marginTop: 12,
                color: themeColors.text,
                fontSize: 18,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              {serverDownTitles[selectedLanguage]}
            </Text>
            <Text
              style={{
                marginTop: 10,
                marginBottom: 22,
                color: themeColors.mutedText,
                fontSize: 14,
                lineHeight: 21,
                textAlign: "center",
              }}
            >
              {error ||
                "No se pudo conectar con el servicio del sistema. Revisa la conexión o inténtalo más tarde."}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowServerDownAlert(false);
                clearError();
              }}
              style={{
                backgroundColor: "#E61C24",
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 24,
                minWidth: 120,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                Entendido
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
