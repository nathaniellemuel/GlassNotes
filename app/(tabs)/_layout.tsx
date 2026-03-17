import { Tabs } from 'expo-router';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassTheme } from '@/constants/theme';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  index: 'note',
  todos: 'checklist',
  calendar: 'calendar-today',
};

function GlassPillTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.pillWrapper, { bottom: Math.max(insets.bottom, 12) }]}>
      <BlurView intensity={50} tint="dark" style={styles.pillBlur}>
        <View style={styles.pillInner}>
          <View pointerEvents="none" style={styles.ambientGlow}>
            <LinearGradient
              colors={['rgba(139,92,246,0)', 'rgba(139,92,246,0.35)', 'rgba(34,197,94,0.28)', 'rgba(34,197,94,0)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.ambientGlowGradient}
            />
          </View>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.title ?? route.name;
            const isFocused = state.index === index;
            const iconName = TAB_ICONS[route.name] ?? 'circle';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };
            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabButton}
                hitSlop={4}
              >
                {isFocused ? (
                  <View pointerEvents="none" style={styles.tabButtonActive}>
                    <LinearGradient
                      colors={['rgba(139,92,246,0.20)', 'rgba(255,255,255,0.08)', 'rgba(34,197,94,0.16)']}
                      start={{ x: 0.15, y: 0 }}
                      end={{ x: 0.85, y: 1 }}
                      style={styles.tabButtonActiveGradient}
                    />
                  </View>
                ) : null}
                <MaterialIcons
                  name={iconName}
                  size={20}
                  color={isFocused ? GlassTheme.textPrimary : GlassTheme.textSecondary}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? GlassTheme.textPrimary : GlassTheme.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassPillTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Notes' }} />
      <Tabs.Screen name="todos" options={{ title: 'To-Do' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  pillWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  pillBlur: {
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    width: '100%',
    maxWidth: 460,
  },
  pillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(7,7,10,0.68)',
    gap: 8,
    position: 'relative',
  },
  ambientGlow: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ambientGlowGradient: {
    width: '70%',
    height: 86,
    borderRadius: 30,
  },
  tabButton: {
    flex: 1,
    minHeight: 54,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  tabButtonActive: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  tabButtonActiveGradient: {
    flex: 1,
    borderRadius: 24,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
