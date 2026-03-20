import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassTheme } from '@/constants/theme';

interface GlassToastProps {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onDismiss?: () => void;
}

export function GlassToast({ title, message, type = 'info', duration = 3000, onDismiss }: GlassToastProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });

    const handleDismiss = () => {
      if (onDismiss) {
        onDismiss();
      }
    };

    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(handleDismiss)();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      default:
        return GlassTheme.accentPrimary;
    }
  };

  const color = getColor();

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <View style={[styles.toast, { borderLeftColor: color }]}>
        <View style={styles.iconContainer}>
          <MaterialIcons name={getIcon() as any} size={24} color={color} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: GlassTheme.glassBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GlassTheme.glassBorder,
    borderLeftWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  iconContainer: {
    paddingTop: 2,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: GlassTheme.textPrimary,
  },
  message: {
    fontSize: 12,
    color: GlassTheme.textSecondary,
    lineHeight: 16,
  },
});
