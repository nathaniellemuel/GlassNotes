import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassTheme } from '@/constants/theme';

export const AILoading: React.FC = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '•';
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
      <View
        style={{
          backgroundColor: 'rgba(147, 112, 219, 0.1)',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: 'rgba(147, 112, 219, 0.2)',
          paddingVertical: 12,
          paddingHorizontal: 14,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Animated Dots */}
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(147, 112, 219, 0.6)',
                  opacity: dots.length > i ? 1 : 0.3,
                }}
              />
            ))}
          </View>
          <Text
            style={{
              fontSize: 14,
              color: GlassTheme.textSecondary,
              fontStyle: 'italic',
            }}
          >
            AI is thinking{dots}
          </Text>
        </View>
      </View>
    </View>
  );
};
