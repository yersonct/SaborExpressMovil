import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getUserIdFromToken } from "@/features/auth/services/decodeToken";
import { setNetworkErrorLanguage } from "@/features/shared/services/networkStatus";
import {
  getApiLanguage,
  setApiLanguage,
} from "@/features/auth/services/apiLanguage";
import {
  getUserLanguagePreference,
  saveUserLanguagePreference,
} from "@/features/userPreferences/services/userLanguageService";
import type { LanguageCode } from "../../../locales/CashierTranslations";
import {
  CASHIER_LANGUAGE_OPTIONS,
  DEFAULT_CASHIER_PREFERENCES,
  getCashierStorageKey,
  loadCashierPreferences,
  persistCashierPreferences,
  type CashierPreferences,
} from "../services/cashierPreferences";

type CashierContextType = CashierPreferences & {
  hydrated: boolean;
  preferencesError: string | null;
  pushStatus: "checking" | "enabled" | "unavailable" | "permission-denied" | "error";
  setPushStatus: (status: CashierContextType["pushStatus"]) => void;
  setLanguage: (lang: LanguageCode) => void;
  setIsDark: (dark: boolean) => void;
  setNotificationSound: (on: boolean) => void;
  setVibrationNotifications: (on: boolean) => void;
  setAutoPrint: (on: boolean) => void;
};

const CashierContext = createContext<CashierContextType | undefined>(undefined);

export const CashierProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const userScope = user
    ? String(
        getUserIdFromToken(user.token) ?? user.identifier.trim().toLowerCase(),
      )
    : "anonymous";
  const storageKey = getCashierStorageKey(userScope);
  const [preferences, setPreferences] = useState(DEFAULT_CASHIER_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<CashierContextType["pushStatus"]>("checking");

  useEffect(() => {
    let active = true;
    const languageSelectedBeforeLogin = getApiLanguage();
    setHydrated(false);
    setPreferencesError(null);
    setPushStatus("checking");
    setPreferences(DEFAULT_CASHIER_PREFERENCES);

    const loadPreferences = async () => {
      const cached = await loadCashierPreferences(storageKey);

      if (!active) return;
      const cachedLanguage =
        typeof cached.language === "string" &&
        CASHIER_LANGUAGE_OPTIONS.includes(cached.language)
          ? cached.language
          : null;
      setPreferences({
        language: cachedLanguage ?? DEFAULT_CASHIER_PREFERENCES.language,
        isDark:
          typeof cached.isDark === "boolean"
            ? cached.isDark
            : DEFAULT_CASHIER_PREFERENCES.isDark,
        notificationSound:
          typeof cached.notificationSound === "boolean"
            ? cached.notificationSound
            : DEFAULT_CASHIER_PREFERENCES.notificationSound,
        vibrationNotifications:
          typeof cached.vibrationNotifications === "boolean"
            ? cached.vibrationNotifications
            : DEFAULT_CASHIER_PREFERENCES.vibrationNotifications,
        autoPrint:
          typeof cached.autoPrint === "boolean"
            ? cached.autoPrint
            : DEFAULT_CASHIER_PREFERENCES.autoPrint,
      });

      let resolvedLanguage = cachedLanguage ?? languageSelectedBeforeLogin;
      try {
        const saved = await getUserLanguagePreference();
        resolvedLanguage = saved.isConfigured
          ? saved.language
          : (cachedLanguage ?? languageSelectedBeforeLogin);
        if (!saved.isConfigured)
          await saveUserLanguagePreference(resolvedLanguage);
      } catch {
        // Keep the account-scoped language cache if the server is unreachable.
      }

      if (active) {
        setApiLanguage(resolvedLanguage);
        setPreferences((current) => ({
          ...current,
          language: resolvedLanguage,
        }));
        setHydrated(true);
      }
    };
    void loadPreferences();

    return () => {
      active = false;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    void persistCashierPreferences(storageKey, preferences)
      .then(() => setPreferencesError(null))
      .catch(() => setPreferencesError("No se pudieron guardar los ajustes del cajero en este dispositivo."));
  }, [hydrated, preferences, storageKey]);

  useEffect(() => {
    setNetworkErrorLanguage(preferences.language);
    setApiLanguage(preferences.language);
  }, [preferences.language]);

  const setLanguage = useCallback((language: LanguageCode) => {
    setApiLanguage(language);
    void saveUserLanguagePreference(language).catch(() => undefined);
    setPreferences((current) => ({ ...current, language }));
  }, []);
  const setIsDark = useCallback((isDark: boolean) => {
    setPreferences((current) => ({ ...current, isDark }));
  }, []);
  const setNotificationSound = useCallback((notificationSound: boolean) => {
    setPreferences((current) => ({ ...current, notificationSound }));
  }, []);
  const setVibrationNotifications = useCallback(
    (vibrationNotifications: boolean) => {
      setPreferences((current) => ({ ...current, vibrationNotifications }));
    },
    [],
  );
  const setAutoPrint = useCallback((autoPrint: boolean) => {
    setPreferences((current) => ({ ...current, autoPrint }));
  }, []);

  const value = useMemo(
    () => ({
      ...preferences,
      hydrated,
      preferencesError,
      pushStatus,
      setPushStatus,
      setLanguage,
      setIsDark,
      setNotificationSound,
      setVibrationNotifications,
      setAutoPrint,
    }),
    [
      preferences,
      hydrated,
      preferencesError,
      pushStatus,
      setPushStatus,
      setLanguage,
      setIsDark,
      setNotificationSound,
      setVibrationNotifications,
      setAutoPrint,
    ],
  );

  return (
    <CashierContext.Provider value={value}>{children}</CashierContext.Provider>
  );
};

export const useCashierContext = () => {
  const context = useContext(CashierContext);
  if (!context) {
    throw new Error(
      "useCashierContext debe usarse dentro de un CashierProvider",
    );
  }
  return context;
};
