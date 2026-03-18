export const GlassTheme = {
  // Backgrounds
  backgroundPrimary: '#050505',
  backgroundSecondary: '#0a0a0a',
  backgroundElevated: '#111111',

  // Glass effect
  glassBackground: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderFocused: 'rgba(255, 255, 255, 0.15)',
  glassHighlight: 'rgba(255, 255, 255, 0.12)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  textTertiary: 'rgba(255, 255, 255, 0.35)',
  textPlaceholder: 'rgba(255, 255, 255, 0.25)',

  // Accent
  accentPrimary: '#8B5CF6',
  accentSecondary: '#6366F1',
  accentGradient: ['#8B5CF6', '#6366F1'] as const,

  // Semantic
  destructive: '#EF4444',
  destructiveBackground: 'rgba(239, 68, 68, 0.15)',
  success: '#22C55E',
  successBackground: 'rgba(34, 197, 94, 0.15)',
  warning: '#F59E0B',

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Border radius
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },

  // Blur
  blurIntensity: 40,
  blurTint: 'dark' as const,

  // Shadows
  shadowPrimary: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};

export type AccentThemeId = 'default' | 'white' | 'red' | 'gold';

export const AccentThemePresets: Record<
  AccentThemeId,
  { accentPrimary: string; accentSecondary: string; accentGradient: readonly [string, string] }
> = {
  default: {
    accentPrimary: '#8B5CF6',
    accentSecondary: '#6366F1',
    accentGradient: ['#8B5CF6', '#6366F1'],
  },
  white: {
    accentPrimary: '#E5E7EB',
    accentSecondary: '#CBD5E1',
    accentGradient: ['#E5E7EB', '#CBD5E1'],
  },
  red: {
    accentPrimary: '#EF4444',
    accentSecondary: '#B91C1C',
    accentGradient: ['#EF4444', '#B91C1C'],
  },
  gold: {
    accentPrimary: '#F59E0B',
    accentSecondary: '#D97706',
    accentGradient: ['#F59E0B', '#D97706'],
  },
};

export function applyAccentTheme(themeId: AccentThemeId) {
  const preset = AccentThemePresets[themeId];
  GlassTheme.accentPrimary = preset.accentPrimary;
  GlassTheme.accentSecondary = preset.accentSecondary;
  GlassTheme.accentGradient = preset.accentGradient;
  GlassTheme.shadowPrimary.shadowColor = preset.accentPrimary;
}
