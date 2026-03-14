export const GlassTheme = {
  // Backgrounds
  backgroundPrimary: '#050505',
  backgroundSecondary: '#0a0a0a',
  backgroundElevated: '#111111',

  // Glass effect
  glassBackground: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderFocused: 'rgba(255, 255, 255, 0.15)',

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
  destructiveBackground: 'rgba(239, 68, 68, 0.12)',

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
    full: 9999,
  },

  // Blur
  blurIntensity: 40,
  blurTint: 'dark' as const,
};
