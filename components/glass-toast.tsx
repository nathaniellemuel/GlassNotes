import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
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
  const translateY = useSharedValue(-20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withTiming(0, { duration: 300 });

    const handleDismiss = () => {
      if (onDismiss) {
        onDismiss();
      }
    };

    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(-20, { duration: 300 }, () => {
        runOnJS(handleDismiss)();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const getIconData = () => {
    switch (type) {
      case 'success':
        return { icon: 'check-circle', bgColor: '#10B98120', color: '#10B981' };
      case 'error':
        return { icon: 'error', bgColor: '#EF444420', color: '#EF4444' };
      default:
        return { icon: 'info', bgColor: `${GlassTheme.accentPrimary}20`, color: GlassTheme.accentPrimary };
    }
  };

  const iconData = getIconData();

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <BlurView intensity={95} tint="dark" style={styles.blurContainer}>
        <View style={[styles.toast, { borderLeftColor: iconData.color }]}>
          {/* Icon with colored background */}
          <View style={[styles.iconBackground, { backgroundColor: iconData.bgColor }]}>
            <MaterialIcons name={iconData.icon as any} size={24} color={iconData.color} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.message} numberOfLines={2}>
              {message}
            </Text>
          </View>

          {/* Close button */}
          <Pressable
            onPress={() => {
              opacity.value = withTiming(0, { duration: 200 });
              if (onDismiss) runOnJS(onDismiss)();
            }}
            hitSlop={8}
          >
            <MaterialIcons name="close" size={18} color={GlassTheme.textTertiary} />
          </Pressable>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 12,
    right: 12,
    zIndex: 1000,
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconBackground: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: GlassTheme.textPrimary,
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 12,
    color: GlassTheme.textSecondary,
    lineHeight: 16,
    fontWeight: '400',
  },
});
