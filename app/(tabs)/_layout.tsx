import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassTheme } from '@/constants/theme';

function TabIcon({
  name,
  focused,
}: {
  name: keyof typeof MaterialIcons.glyphMap;
  focused: boolean;
}) {
  return (
    <MaterialIcons
      name={name}
      size={24}
      color={focused ? GlassTheme.accentPrimary : GlassTheme.textTertiary}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: GlassTheme.accentPrimary,
        tabBarInactiveTintColor: GlassTheme.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => <View style={styles.tabBarBg} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Notes',
          tabBarIcon: ({ focused }) => <TabIcon name="note" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="todos"
        options={{
          title: 'To-Do',
          tabBarIcon: ({ focused }) => <TabIcon name="checklist" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused }) => <TabIcon name="calendar-today" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: GlassTheme.glassBorder,
    elevation: 0,
    height: 60,
    paddingBottom: 8,
  },
  tabBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GlassTheme.backgroundSecondary,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
