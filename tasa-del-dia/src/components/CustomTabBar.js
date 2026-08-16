import React from 'react';
import { View, TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { hapticLight } from '../utils/haptics';

const TABS = /** @type {const} */ ([
  { key: 'Tasas', icon: 'pulse' },
  { key: 'Conversor', icon: 'swap-horizontal' },
  { key: 'Historial', icon: 'stats-chart' },
]);

function CustomTabBar({ activeIndex, onTabPress, colors, scrollOffset }) {
  const { isDark } = useTheme();
  return (
    <BlurView intensity={Platform.OS === 'android' ? 60 : 90} tint={isDark ? 'dark' : 'light'} style={[
      styles.container,
      { borderTopColor: colors.tabBarBorder }
    ]}>
      <View style={styles.tabsRow}>
        {TABS.map((tab, i) => {
          const inputRange = [i - 1, i, i + 1];

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
              onPress={() => { hapticLight(); onTabPress(i); }}
              style={styles.tab}
              accessibilityLabel={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrapper}>
                <Animated.View>
                  <Ionicons
                    name={tab.icon}
                    size={22}
                    color={iconColor}
                  />
                </Animated.View>
              </View>
              <Animated.Text style={[styles.label, { color: iconColor }]}>
                {tab.key}
              </Animated.Text>
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

export default React.memo(CustomTabBar);

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 4,
    paddingBottom: Platform.OS === 'ios' ? 20 : 4,
    height: Platform.OS === 'ios' ? 76 : 60,
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
  iconWrapper: {
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
