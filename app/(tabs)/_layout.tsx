import { Tabs } from 'expo-router';
import { View, Pressable, Text, StyleSheet, Keyboard, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassTheme } from '@/constants/theme';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAppSettings } from '@/hooks/use-app-settings';

const TAB_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  index: 'note',
  todos: 'checklist',
  calendar: 'calendar-today',
  settings: 'settings',
};

function GlassPillTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  useAppSettings();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow';
    const hideEvent = Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide';

    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (isKeyboardVisible) {
    return null;
  }

  const activeColor = GlassTheme.accentPrimary;
  const tabActiveStyle = {
    backgroundColor: `${activeColor}26`,
    borderColor: `${activeColor}66`,
  };

  return (
    <View style={[styles.pillWrapper, { bottom: Math.max(insets.bottom, 12) }]}>
      <BlurView intensity={50} tint="dark" style={styles.pillBlur}>
        <View style={styles.pillInner}>
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
                style={[styles.tabButton, isFocused && tabActiveStyle]}
                hitSlop={4}
              >
                <MaterialIcons
                  name={iconName}
                  size={18}
                  color={isFocused ? activeColor : GlassTheme.textSecondary}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? activeColor : GlassTheme.textSecondary },
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
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  pillWrapper: {
    position: 'absolute',
    left: 28,
    right: 28,
    alignItems: 'center',
    elevation: 8,
    zIndex: 10,
  },
  pillBlur: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    width: '100%',
    maxWidth: 390,
  },
  pillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 7,
    backgroundColor: 'rgba(7,7,10,0.68)',
    gap: 4,
  },
  tabButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
