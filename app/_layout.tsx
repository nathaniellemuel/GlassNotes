import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GlassTheme } from '@/constants/theme';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.root}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: GlassTheme.backgroundPrimary },
            animation: 'fade_from_bottom',
            animationDuration: 250,
          }}
        >
          <Stack.Screen name="index" />
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
