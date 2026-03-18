import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GlassTheme } from '@/constants/theme';
import { useNotificationSetup } from '@/hooks/use-notifications';
import { AppSettingsProvider, useAppSettings } from '@/hooks/use-app-settings';
import 'react-native-reanimated';

function RootNavigator() {
  useNotificationSetup();
  const { isLoaded } = useAppSettings();

  if (!isLoaded) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: GlassTheme.backgroundPrimary },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="editor"
          options={{ animation: 'slide_from_bottom', animationDuration: 300 }}
        />
      </Stack>
      <StatusBar style="light" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AppSettingsProvider>
        <RootNavigator />
      </AppSettingsProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GlassTheme.backgroundPrimary,
  },
});
