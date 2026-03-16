import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GlassTheme } from '@/constants/theme';
import { useNotificationSetup } from '@/hooks/use-notifications';
import 'react-native-reanimated';

export default function RootLayout() {
  useNotificationSetup();

  return (
    <GestureHandlerRootView style={styles.root}>
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
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GlassTheme.backgroundPrimary,
  },
});
