import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { applyAccentTheme, type AccentThemeId } from '@/constants/theme';
import { storage } from '@/utils/storage';

type AppLanguage = 'en';

type AppSettingsState = {
  theme: AccentThemeId;
  language: AppLanguage;
  isLoaded: boolean;
  setTheme: (theme: AccentThemeId) => Promise<void>;
  setLanguage: (language: AppLanguage) => Promise<void>;
};

const SETTINGS_KEY = 'glassnotes_app_settings';

const AppSettingsContext = createContext<AppSettingsState | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AccentThemeId>('default');
  const [language, setLanguageState] = useState<AppLanguage>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await storage.get<{ theme?: AccentThemeId; language?: AppLanguage }>(SETTINGS_KEY);
      if (!mounted) return;
      const nextTheme = saved?.theme ?? 'default';
      const nextLanguage = saved?.language ?? 'en';
      applyAccentTheme(nextTheme);
      setThemeState(nextTheme);
      setLanguageState(nextLanguage);
      setIsLoaded(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setTheme = useCallback(
    async (nextTheme: AccentThemeId) => {
      applyAccentTheme(nextTheme);
      setThemeState(nextTheme);
      await storage.set(SETTINGS_KEY, { theme: nextTheme, language });
    },
    [language],
  );

  const setLanguage = useCallback(
    async (nextLanguage: AppLanguage) => {
      setLanguageState(nextLanguage);
      await storage.set(SETTINGS_KEY, { theme, language: nextLanguage });
    },
    [theme],
  );

  const value = useMemo(
    () => ({
      theme,
      language,
      isLoaded,
      setTheme,
      setLanguage,
    }),
    [theme, language, isLoaded, setTheme, setLanguage],
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used inside AppSettingsProvider');
  return ctx;
}
