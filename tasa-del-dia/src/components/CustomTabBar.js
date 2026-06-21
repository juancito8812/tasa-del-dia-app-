import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const TABS = [
  { key: 'Tasas', icon: 'pulse' },
  { key: 'Conversor', icon: 'swap-horizontal' },
  { key: 'Historial', icon: 'stats-chart' },
];

export default function CustomTabBar({ activeIndex, onTabPress, colors, scrollOffset }) {
  return (
    <BlurView intensity={Platform.OS === 'android' ? 50 : 80} tint="dark" style={[
      styles.container,
      { borderTopColor: colors.tabBarBorder }
    ]}>
      <View style={styles.tabsRow}>
        {TABS.map((tab, i) => {
          // Cada tab se activa cuando scrollOffset ≈ i
          const inputRange = [i - 1, i, i + 1];

          // ponytail: opacity es redundante — el cambio de color (muted→highlight) ya es señal visual suficiente
          const activeProgress = scrollOffset.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });

          const iconColor = activeProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [colors.textMuted, colors.highlight],
          });

          const indicatorScaleX = activeProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          const isActive = i === activeIndex;

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabPress(i)}
              style={styles.tab}
              accessibilityLabel={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Animated.View>
                <Ionicons
                  name={tab.icon}
                  size={22}
                  color={iconColor}
                />
              </Animated.View>
              <Animated.Text style={[styles.label, { color: iconColor }]}>
                {tab.key}
              </Animated.Text>
              {/* ponytail: el indicator y el scale son el mismo feedback visual — el indicator basta */}
              <Animated.View
                style={[
                  styles.indicator,
                  {
                    backgroundColor: colors.highlight,
                    transform: [{ scaleX: indicatorScaleX }],
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 4,
    paddingBottom: 4,
    height: 60,
  },
  tabsRow: {
    flexDirection: 'row',
    flex: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  indicator: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    marginTop: 3,
  },
});


