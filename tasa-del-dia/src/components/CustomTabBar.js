import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { hapticLight } from '../utils/haptics';

const TABS = /** @type {const} */ ([
  { key: 'Tasas', icon: 'pulse' },
  { key: 'Conversor', icon: 'swap-horizontal' },
  { key: 'Datos', icon: 'wallet' },
  { key: 'PayPal', icon: 'logo-paypal' },
  { key: 'Historial', icon: 'stats-chart' },
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

  const iconColor = isActive ? colors.highlight : colors.textMuted;

  return (
    <TouchableOpacity
      onPress={() => { hapticLight(); onTabPress(index); }}
      style={styles.tab}
      accessibilityLabel={tab.key}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrapper}>
        <Ionicons name={tab.icon} size={22} color={iconColor} />
      </View>
      <Animated.Text style={[styles.label, { color: iconColor }]}>
        {tab.key}
      </Animated.Text>
      <Animated.View
        style={[
          styles.indicator,
          { backgroundColor: colors.highlight },
          indicatorStyle,
        ]}
      />
    </TouchableOpacity>
  );
}

function CustomTabBar({ activeIndex, onTabPress, colors }) {
  const { isDark } = useTheme();
  return (
    <BlurView intensity={Platform.OS === 'android' ? 60 : 90} tint={isDark ? 'dark' : 'light'} style={[
      styles.container,
      { borderTopColor: colors.tabBarBorder }
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
