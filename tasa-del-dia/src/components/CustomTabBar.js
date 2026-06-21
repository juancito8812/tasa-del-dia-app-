import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const TABS = [
  { key: 'Tasas', icon: 'pulse', iconOutline: 'pulse-outline' },
  { key: 'Conversor', icon: 'swap-horizontal', iconOutline: 'swap-horizontal-outline' },
  { key: 'Historial', icon: 'stats-chart', iconOutline: 'stats-chart-outline' },
];

export default function CustomTabBar({ activeIndex, onTabPress, colors }) {
  const animValues = useRef(TABS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    TABS.forEach((_, i) => {
      Animated.spring(animValues[i], {
        toValue: i === activeIndex ? 1 : 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    });
  }, [activeIndex]);

  return (
    <BlurView intensity={Platform.OS === 'android' ? 50 : 80} tint="dark" style={[
      styles.container,
      { borderTopColor: colors.tabBarBorder }
    ]}>
      {TABS.map((tab, i) => {
        const isActive = i === activeIndex;
        const scale = animValues[i].interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.15],
        });
        const opacity = animValues[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 1],
        });
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabPress(i)}
            style={styles.tab}
            accessibilityLabel={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              <Ionicons
                name={isActive ? tab.icon : tab.iconOutline}
                size={22}
                color={isActive ? colors.highlight : colors.textMuted}
              />
            </Animated.View>
            <Animated.Text style={[
              styles.label,
              { color: isActive ? colors.highlight : colors.textMuted, opacity }
            ]}>
              {tab.key}
            </Animated.Text>
          </TouchableOpacity>
        );
      })}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 6,
    paddingBottom: 8,
    height: 60,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
