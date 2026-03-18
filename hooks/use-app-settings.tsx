import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { applyAccentTheme, applyBackgroundTheme, type AccentThemeId, type BackgroundThemeId } from '@/constants/theme';
import { storage } from '@/utils/storage';

type AppLanguage = 'en';

type AppSettingsState = {
  theme: AccentThemeId;
  bgTheme: BackgroundThemeId;
  language: AppLanguage;
  isLoaded: boolean;
  setTheme: (theme: AccentThemeId) => Promise<void>;
  setBgTheme: (bgTheme: BackgroundThemeId) => Promise<void>;
  setLanguage: (language: AppLanguage) => Promise<void>;
};

const SETTINGS_KEY = 'glassnotes_app_settings';

const AppSettingsContext = createContext<AppSettingsState | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AccentThemeId>('default');
  const [bgTheme, setBgThemeState] = useState<BackgroundThemeId>('black');
  const [language, setLanguageState] = useState<AppLanguage>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await storage.get<{ theme?: AccentThemeId; bgTheme?: BackgroundThemeId; language?: AppLanguage }>(SETTINGS_KEY);
      if (!mounted) return;
      const nextTheme = saved?.theme ?? 'default';
      const nextBgTheme = saved?.bgTheme ?? 'black';
      const nextLanguage = saved?.language ?? 'en';
      
      applyAccentTheme(nextTheme);
      applyBackgroundTheme(nextBgTheme);
      setThemeState(nextTheme);
      setBgThemeState(nextBgTheme);
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
      await storage.set(SETTINGS_KEY, { theme: nextTheme, bgTheme, language });
    },
    [bgTheme, language],
  );

  const setBgTheme = useCallback(
    async (nextBgTheme: BackgroundThemeId) => {
      applyBackgroundTheme(nextBgTheme);
      setBgThemeState(nextBgTheme);
      await storage.set(SETTINGS_KEY, { theme, bgTheme: nextBgTheme, language });
    },
    [theme, language],
  );

  const setLanguage = useCallback(
    async (nextLanguage: AppLanguage) => {
      setLanguageState(nextLanguage);
      await storage.set(SETTINGS_KEY, { theme, bgTheme, language: nextLanguage });
    },
    [theme, bgTheme],
  );

  const value = useMemo(
    () => ({
      theme,
      bgTheme,
      language,
      isLoaded,
      setTheme,
      setBgTheme,
      setLanguage,
    }),
    [theme, bgTheme, language, isLoaded, setTheme, setBgTheme, setLanguage],
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used inside AppSettingsProvider');
  return ctx;
}
