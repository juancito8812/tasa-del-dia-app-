import React from 'react';
import { View, TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';
import { hapticLight } from '../utils/haptics';

const TABS = /** @type {const} */ ([
  { key: 'Tasas', tag: 'TAS' },
  { key: 'Conversor', tag: 'CONV' },
  { key: 'Historial', tag: 'HIST' },
]);

function CustomTabBar({ activeIndex, onTabPress, colors, scrollOffset }) {
  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.tabBar, borderTopColor: colors.tabBarBorder },
    ]}>
      <View style={styles.tabsRow}>
        {TABS.map((tab, i) => {
          const inputRange = [i - 1, i, i + 1];

          const activeProgress = scrollOffset.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });

          const labelColor = activeProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [colors.textMuted, colors.textPrimary],
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
              <Animated.Text style={[styles.tag, { color: labelColor }]}>
                [{tab.tag}]
              </Animated.Text>
              <Animated.Text style={[styles.label, { color: labelColor }]}>
                {tab.key}
              </Animated.Text>
              <Animated.View
                style={[
                  styles.indicator,
                  {
                    backgroundColor: colors.textPrimary,
                    transform: [{ scaleX: indicatorScaleX }],
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default React.memo(CustomTabBar);

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 5,
    paddingBottom: Platform.OS === 'ios' ? 20 : 4,
    height: Platform.OS === 'ios' ? 76 : 62,
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
  tag: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
    fontFamily: 'monospace',
  },
  indicator: {
    width: 22,
    height: 2,
    marginTop: 3,
  },
});