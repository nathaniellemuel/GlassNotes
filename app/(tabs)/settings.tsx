import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@/components/glass-card';
import { GlassTheme, type AccentThemeId, type BackgroundThemeId } from '@/constants/theme';
import { useAppSettings } from '@/hooks/use-app-settings';

const ACCENT_OPTIONS: { id: AccentThemeId; label: string; subtitle: string }[] = [
  { id: 'white', label: 'White', subtitle: 'Soft silver glass accent' },
  { id: 'red', label: 'Red', subtitle: 'Bold ruby glass accent' },
  { id: 'gold', label: 'Gold', subtitle: 'Warm amber glass accent' },
  { id: 'default', label: 'Default', subtitle: 'Original violet glass accent' },
];

const BG_OPTIONS: { id: BackgroundThemeId; label: string; subtitle: string }[] = [
  { id: 'black', label: 'Pure Black', subtitle: 'True OLED background' },
  { id: 'slate', label: 'Slate', subtitle: 'Cool grey background' },
  { id: 'navy', label: 'Navy', subtitle: 'Deep space blue' },
  { id: 'midnight', label: 'Midnight', subtitle: 'Dark indigo background' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, bgTheme, language, setTheme, setBgTheme, setLanguage } = useAppSettings();

  const [activeModal, setActiveModal] = useState<'accent' | 'bg' | null>(null);

  const currentAccent = ACCENT_OPTIONS.find((o) => o.id === theme) || ACCENT_OPTIONS[3];
  const currentBg = BG_OPTIONS.find((o) => o.id === (bgTheme || 'black')) || BG_OPTIONS[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: GlassTheme.backgroundPrimary }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Customize style and preferences</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(300)}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <Pressable onPress={() => setActiveModal('bg')} style={styles.rowWrap}>
            <GlassCard noPadding style={styles.rowCard}>
              <View style={styles.rowInner}>
                <View style={styles.rowIconWrap}>
                  <MaterialIcons name="format-color-fill" size={22} color={GlassTheme.textSecondary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Background Color</Text>
                  <Text style={styles.rowSubtitle}>{currentBg.label}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={GlassTheme.textTertiary} />
              </View>
            </GlassCard>
          </Pressable>

          <Pressable onPress={() => setActiveModal('accent')} style={styles.rowWrap}>
            <GlassCard noPadding style={styles.rowCard}>
              <View style={styles.rowInner}>
                <View style={styles.rowIconWrap}>
                  <MaterialIcons name="palette" size={22} color={GlassTheme.accentPrimary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Accent Color</Text>
                  <Text style={styles.rowSubtitle}>{currentAccent.label}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={GlassTheme.textTertiary} />
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(300)}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Pressable style={styles.rowWrap} onPress={() => setLanguage('en')}>
            <GlassCard noPadding style={styles.rowCard}>
              <View style={styles.rowInner}>
                <View style={styles.rowIconWrap}>
                  <MaterialIcons name="language" size={22} color={GlassTheme.textSecondary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Language</Text>
                  <Text style={styles.rowSubtitle}>English</Text>
                </View>
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Action Sheet Modal */}
      <Modal visible={activeModal !== null} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setActiveModal(null)}>
          <View style={[styles.actionSheet, { paddingBottom: Math.max(insets.bottom + 16, GlassTheme.spacing.lg) }]} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {activeModal === 'bg' ? 'Background Color' : 'Accent Color'}
            </Text>
            
            {(activeModal === 'bg' ? BG_OPTIONS : ACCENT_OPTIONS).map((option: any) => {
              const isSelected = activeModal === 'bg' ? bgTheme === option.id : theme === option.id;
              return (
                <Pressable
                  key={option.id}
                  style={[styles.sheetItem, isSelected && styles.sheetItemSelected]}
                  onPress={() => {
                    if (activeModal === 'bg') setBgTheme(option.id);
                    else setTheme(option.id);
                    setActiveModal(null);
                  }}
                >
                  <View style={styles.sheetItemTextWrap}>
                    <Text style={[styles.sheetItemTitle, isSelected && { color: GlassTheme.accentPrimary }]}>{option.label}</Text>
                    <Text style={styles.sheetItemSubtitle}>{option.subtitle}</Text>
                  </View>
                  {isSelected && (
                    <MaterialIcons name="check" size={22} color={GlassTheme.accentPrimary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: GlassTheme.spacing.lg,
    paddingTop: GlassTheme.spacing.lg,
    paddingBottom: GlassTheme.spacing.md,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: GlassTheme.textPrimary,
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: GlassTheme.textTertiary,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: GlassTheme.spacing.md,
    paddingBottom: 140,
    gap: 14,
  },
  sectionTitle: {
    marginHorizontal: 4,
    marginBottom: 8,
    marginTop: 8,
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
    paddingHorizontal: GlassTheme.spacing.md,
    paddingVertical: GlassTheme.spacing.sm,
    gap: 14,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GlassTheme.glassHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: {
    color: GlassTheme.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubtitle: {
    marginTop: 2,
    color: GlassTheme.textTertiary,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: GlassTheme.radius.xl,
    borderTopRightRadius: GlassTheme.radius.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: GlassTheme.glassBorderFocused,
    paddingHorizontal: GlassTheme.spacing.lg,
    paddingTop: GlassTheme.spacing.sm,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: GlassTheme.glassBorderFocused,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: GlassTheme.spacing.lg,
  },
  sheetTitle: {
    color: GlassTheme.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: GlassTheme.spacing.lg,
    paddingHorizontal: 4,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: GlassTheme.spacing.md,
    paddingHorizontal: GlassTheme.spacing.md,
    borderRadius: GlassTheme.radius.md,
    marginBottom: 4,
  },
  sheetItemSelected: {
    backgroundColor: GlassTheme.glassBackground,
  },
  sheetItemTextWrap: {
    flex: 1,
    gap: 2,
  },
  sheetItemTitle: {
    color: GlassTheme.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  sheetItemSubtitle: {
    color: GlassTheme.textTertiary,
    fontSize: 13,
  },
});
