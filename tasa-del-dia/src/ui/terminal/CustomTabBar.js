// Variante TERMINAL del rediseño monocromo (fuente: feature/ui-monocromo).
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { hapticLight } from '../../utils/haptics';

const TABS = /** @type {const} */ ([
  { key: 'Tasas', tag: 'TAS' },
  { key: 'Conversor', tag: 'CONV' },
  { key: 'Datos', tag: 'DATOS' },
  { key: 'PayPal', tag: 'PP' },
  { key: 'Historial', tag: 'HIST' },
]);

function TabItem({ tab, index, activeIndex, colors, onTabPress }) {
  const isActive = index === activeIndex;
  const progress = useSharedValue(isActive ? 1 : 0);

  React.useEffect(() => {
    progress.value = withSpring(isActive ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [activeIndex, isActive, progress]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  const labelColor = isActive ? colors.textPrimary : colors.textMuted;

  return (
    <TouchableOpacity
      onPress={() => { hapticLight(); onTabPress(index); }}
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
          { backgroundColor: colors.textPrimary },
          indicatorStyle,
        ]}
      />
    </TouchableOpacity>
  );
}

function CustomTabBar({ activeIndex, onTabPress, colors }) {
  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.tabBar, borderTopColor: colors.tabBarBorder },
    ]}>
      <View style={styles.tabsRow}>
        {TABS.map((tab, i) => (
          <TabItem
            key={tab.key}
            tab={tab}
            index={i}
            activeIndex={activeIndex}
            colors={colors}
            onTabPress={onTabPress}
          />
        ))}
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
