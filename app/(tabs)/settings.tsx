import { useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@/components/glass-card';
import { GlassTheme, type AccentThemeId } from '@/constants/theme';
import { useAppSettings } from '@/hooks/use-app-settings';

const THEME_OPTIONS: { id: AccentThemeId; label: string; subtitle: string }[] = [
  { id: 'white', label: 'White', subtitle: 'Soft silver glass accent' },
  { id: 'red', label: 'Red', subtitle: 'Bold ruby glass accent' },
  { id: 'gold', label: 'Gold', subtitle: 'Warm amber glass accent' },
  { id: 'default', label: 'Default', subtitle: 'Original violet glass accent' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, language, setTheme, setLanguage } = useAppSettings();

  const activeGradient = useMemo(
    () => [`${GlassTheme.accentPrimary}22`, 'transparent'] as const,
    [theme],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={activeGradient} style={styles.gradient} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Customize style and language</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(300)}>
          <Text style={styles.sectionTitle}>Theme</Text>
          {THEME_OPTIONS.map((option) => {
            const selected = theme === option.id;
            return (
              <Pressable key={option.id} onPress={() => setTheme(option.id)} style={styles.rowWrap}>
                <GlassCard
                  noPadding
                  style={[
                    styles.rowCard,
                    selected && { borderColor: `${GlassTheme.accentPrimary}88` },
                  ]}
                >
                  <View style={styles.rowInner}>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{option.label}</Text>
                      <Text style={styles.rowSubtitle}>{option.subtitle}</Text>
                    </View>
                    <MaterialIcons
                      name={selected ? 'radio-button-checked' : 'radio-button-unchecked'}
                      size={20}
                      color={selected ? GlassTheme.accentPrimary : GlassTheme.textTertiary}
                    />
                  </View>
                </GlassCard>
              </Pressable>
            );
          })}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(300)}>
          <Text style={styles.sectionTitle}>Language</Text>
          <Pressable style={styles.rowWrap} onPress={() => setLanguage('en')}>
            <GlassCard
              noPadding
              style={[
                styles.rowCard,
                language === 'en' && { borderColor: `${GlassTheme.accentPrimary}88` },
              ]}
            >
              <View style={styles.rowInner}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>English</Text>
                  <Text style={styles.rowSubtitle}>Default language</Text>
                </View>
                <MaterialIcons
                  name={language === 'en' ? 'check-circle' : 'radio-button-unchecked'}
                  size={20}
                  color={language === 'en' ? GlassTheme.accentPrimary : GlassTheme.textTertiary}
                />
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlassTheme.backgroundPrimary,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
  },
  header: {
    paddingHorizontal: GlassTheme.spacing.lg,
    paddingTop: GlassTheme.spacing.lg,
    paddingBottom: GlassTheme.spacing.md,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: GlassTheme.textPrimary,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: GlassTheme.textTertiary,
  },
  content: {
    paddingHorizontal: GlassTheme.spacing.md,
    paddingBottom: 140,
    gap: 14,
  },
  sectionTitle: {
    marginHorizontal: 4,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '700',
    color: GlassTheme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  rowWrap: { marginBottom: 8 },
  rowCard: {
    borderRadius: GlassTheme.radius.lg,
  },
  rowInner: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GlassTheme.spacing.md,
    paddingVertical: GlassTheme.spacing.sm + 2,
    gap: 12,
  },
  rowText: { flex: 1 },
  rowTitle: {
    color: GlassTheme.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  rowSubtitle: {
    marginTop: 2,
    color: GlassTheme.textTertiary,
    fontSize: 12,
  },
});
