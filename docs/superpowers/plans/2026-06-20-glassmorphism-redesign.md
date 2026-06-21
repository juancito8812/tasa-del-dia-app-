# Glassmorphism Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize UI with glassmorphism style + swipe navigation between screens

**Architecture:** Replace `createBottomTabNavigator` with `react-native-pager-view` + custom tab bar. Wrap screens in a ViewPager so all 3 screens stay mounted for instant swipe. Cards get `BlurView` backgrounds. Tab bar gets `BlurView` + animated active indicator.

**Tech Stack:** `expo-blur`, `react-native-pager-view`, React Native `Animated`

## Global Constraints

- Must keep all existing functionality (fetching, auto-refresh, notifications, history, gasolina calculator, etc.)
- Must pass all existing tests (59 tests)
- `useFocusEffect` replaced by `useEffect` with `isActive` prop in each screen
- Custom tab bar must match current visual style (icons + text, same icon set)
- All 3 screens must remain mounted at all times (PagerView behavior)

---

### Task 1: Install dependencies

**Files:**
- Modify: `tasa-del-dia/package.json`

- [ ] **Step 1: Install expo-blur and react-native-pager-view**

Run: `cd tasa-del-dia && npx expo install expo-blur react-native-pager-view`

Expected: Both packages added to `package.json` and `node_modules`.

- [ ] **Step 2: Verify install**

Run: `cd tasa-del-dia && npx jest --no-coverage --passWithNoTests`
Expected: All 59 tests still pass.

- [ ] **Step 3: Commit**

```bash
git add tasa-del-dia/package.json tasa-del-dia/package-lock.json
git commit -m "chore: add expo-blur and react-native-pager-view"
```

---

### Task 2: Add glass/glow colors to themes

**Files:**
- Modify: `tasa-del-dia/src/constants/themes.js`

**Interfaces:**
- Produces: `darkTheme` and `lightTheme` now have `glassCard`, `glassTabBar`, `glowBcv`, `glowParalelo`, `glowEuro`, `glowBcvLunes`, `glowGasolina` fields

- [ ] **Step 1: Update themes.js**

Replace the current file content with:

```js
export const darkTheme = {
  primary: '#0a0a14',
  secondary: '#0f0f1e',
  accent: '#1a1a3e',
  cardBg: 'rgba(255, 255, 255, 0.06)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',

  glassCard: 'rgba(255, 255, 255, 0.06)',
  glassTabBar: 'rgba(255, 255, 255, 0.08)',

  highlight: '#e94560',
  success: '#00b894',
  warning: '#f39c12',
  info: '#4fc3f7',
  bcvLunes: '#a855f7',

  glowBcv: 'rgba(0, 184, 148, 0.15)',
  glowParalelo: 'rgba(79, 195, 247, 0.15)',
  glowEuro: 'rgba(233, 69, 96, 0.15)',
  glowBcvLunes: 'rgba(168, 85, 247, 0.15)',
  glowGasolina: 'rgba(243, 156, 18, 0.15)',

  textPrimary: '#ffffff',
  textSecondary: '#a0aec0',
  textMuted: '#636e82',

  inputBg: 'rgba(255, 255, 255, 0.04)',
  inputBorder: 'rgba(255, 255, 255, 0.1)',

  tabBar: '#0a0a14',
  tabBarBorder: 'rgba(255, 255, 255, 0.06)',

  glassOverlay: 'rgba(255, 255, 255, 0.03)',
};

export const lightTheme = {
  primary: '#f0f2f5',
  secondary: '#ffffff',
  accent: '#e8ecf1',
  cardBg: '#ffffff',
  cardBorder: 'rgba(0, 0, 0, 0.08)',

  glassCard: 'rgba(255, 255, 255, 0.9)',
  glassTabBar: 'rgba(255, 255, 255, 0.95)',

  highlight: '#d63031',
  success: '#00b894',
  warning: '#e17055',
  info: '#0984e3',
  bcvLunes: '#7c3aed',

  glowBcv: 'rgba(0, 184, 148, 0.1)',
  glowParalelo: 'rgba(9, 132, 227, 0.1)',
  glowEuro: 'rgba(214, 48, 49, 0.1)',
  glowBcvLunes: 'rgba(124, 58, 237, 0.1)',
  glowGasolina: 'rgba(225, 112, 85, 0.1)',

  textPrimary: '#1a1a2e',
  textSecondary: '#636e82',
  textMuted: '#a0aec0',

  inputBg: '#f5f6fa',
  inputBorder: 'rgba(0, 0, 0, 0.1)',

  tabBar: '#ffffff',
  tabBarBorder: 'rgba(0, 0, 0, 0.06)',

  glassOverlay: 'rgba(0, 0, 0, 0.02)',
};
```

- [ ] **Step 2: Run tests**

Run: `cd tasa-del-dia && npx jest --no-coverage`
Expected: All tests still pass (themes.js has no tests directly consuming these).

- [ ] **Step 3: Commit**

```bash
git add tasa-del-dia/src/constants/themes.js
git commit -m "feat: add glass and glow colors to themes"
```

---

### Task 3: Create CustomTabBar component

**Files:**
- Create: `tasa-del-dia/src/components/CustomTabBar.js`
- Test: `tasa-del-dia/src/components/__tests__/CustomTabBar.test.js`

**Interfaces:**
- Consumes: `{ activeIndex, onTabPress, colors }`
- Produces: `<CustomTabBar activeIndex={number} onTabPress={(index) => void} />`

- [ ] **Step 1: Write the test**

```js
import React from 'react';
import TestRenderer from 'react-test-renderer';
import CustomTabBar from '../CustomTabBar';

const mockColors = {
  glassTabBar: 'rgba(255,255,255,0.08)',
  tabBarBorder: 'rgba(255,255,255,0.06)',
  highlight: '#e94560',
  textMuted: '#636e82',
  textPrimary: '#ffffff',
};

describe('CustomTabBar', () => {
  it('renders 3 tabs with text labels', () => {
    const onPress = jest.fn();
    const renderer = TestRenderer.create(
      <CustomTabBar activeIndex={0} onTabPress={onPress} colors={mockColors} />
    );
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const labels = texts.map(t => t.props.children).flat().filter(c => typeof c === 'string');
    expect(labels).toContain('Tasas');
    expect(labels).toContain('Conversor');
    expect(labels).toContain('Historial');
  });

  it('calls onTabPress when a tab is pressed', () => {
    const onPress = jest.fn();
    const renderer = TestRenderer.create(
      <CustomTabBar activeIndex={0} onTabPress={onPress} colors={mockColors} />
    );
    const touchables = root.findAllByType('TouchableOpacity');
    touchables[1].props.onPress();
    expect(onPress).toHaveBeenCalledWith(1);
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `cd tasa-del-dia && npx jest src/components/__tests__/CustomTabBar.test.js --no-coverage`
Expected: FAIL (module not found)

- [ ] **Step 3: Create CustomTabBar component**

```js
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
```

- [ ] **Step 4: Run test again**

Run: `cd tasa-del-dia && npx jest src/components/__tests__/CustomTabBar.test.js --no-coverage`
Expected: PASS

- [ ] **Step 5: Full test run**

Run: `cd tasa-del-dia && npx jest --no-coverage`
Expected: 62+ tests passing

- [ ] **Step 6: Commit**

```bash
git add tasa-del-dia/src/components/CustomTabBar.js tasa-del-dia/src/components/__tests__/CustomTabBar.test.js
git commit -m "feat: add glassmorphism CustomTabBar component"
```

---

### Task 4: Refactor App.js — PagerView + custom tab bar

**Files:**
- Modify: `tasa-del-dia/App.js`
- No test changes (App.js has no tests)

**Interfaces:**
- Consumes: `CustomTabBar` from Task 3
- Produces: Swipeable app with PagerView + sync'd tab bar

- [ ] **Step 1: Edit App.js**

Replace the current file content with:

```js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import RatesScreen from './src/screens/RatesScreen';
import ConverterScreen from './src/screens/ConverterScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import CustomTabBar from './src/components/CustomTabBar';
import { ensureReminderScheduled } from './src/services/notifications';
import { registerBackgroundFetchAsync } from './src/services/backgroundTasks';

function AnimatedAppContent() {
  const { colors: C, isDark, theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const prevTheme = useRef(theme);
  const pagerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (prevTheme.current !== theme) {
      prevTheme.current = theme;
      fadeAnim.setValue(1);
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5, duration: 120, useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 300, useNativeDriver: true,
        }),
      ]).start();
    }
  }, [theme, fadeAnim]);

  const onTabPress = useCallback((index) => {
    pagerRef.current?.setPage(index);
    setActiveIndex(index);
  }, []);

  const onPageSelected = useCallback((e) => {
    setActiveIndex(e.nativeEvent.position);
  }, []);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.container, { backgroundColor: C.primary }]}>
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          onPageSelected={onPageSelected}
        >
          <View style={styles.page} key="tasas">
            <RatesScreen isActive={activeIndex === 0} />
          </View>
          <View style={styles.page} key="conversor">
            <ConverterScreen isActive={activeIndex === 1} />
          </View>
          <View style={styles.page} key="historial">
            <HistoryScreen isActive={activeIndex === 2} />
          </View>
        </PagerView>
        <CustomTabBar
          activeIndex={activeIndex}
          onTabPress={onTabPress}
          colors={C}
        />
      </View>
    </Animated.View>
  );
}

class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) { console.error(error); }
  render() {
    return this.state.hasError ? <Text>Algo salió mal. Reinicia la app.</Text> : this.props.children;
  }
}

function App() {
  useEffect(() => {
    registerBackgroundFetchAsync().catch(console.warn);
    ensureReminderScheduled();
  }, []);

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AnimatedAppContent />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pager: { flex: 1 },
  page: { flex: 1 },
});

export default App;
```

- [ ] **Step 2: Run tests**

Run: `cd tasa-del-dia && npx jest --no-coverage`
Expected: Tests that mock the navigation may fail since we removed `NavigationContainer` and `createBottomTabNavigator`. Fix any test that breaks.

- [ ] **Step 3: Fix any test that depends on NavigationContainer**

If any screen test uses navigation mocking, the test already wraps in a mock or the screen doesn't directly depend on navigation context for tests. Run and fix as needed.

- [ ] **Step 4: Commit**

```bash
git add tasa-del-dia/App.js
git commit -m "feat: replace Tab.Navigator with PagerView + custom tab bar"
```

---

### Task 5: Replace useFocusEffect with useEffect(isActive) in all screens

**Files:**
- Modify: `tasa-del-dia/src/screens/RatesScreen.js`
- Modify: `tasa-del-dia/src/screens/ConverterScreen.js`
- Modify: `tasa-del-dia/src/screens/HistoryScreen.js`

All 3 screens use `useFocusEffect` imported from `@react-navigation/native`. The pattern to replace is:

```js
// BEFORE:
import { useFocusEffect } from '@react-navigation/native';
...
useFocusEffect(
  useCallback(() => {
    // do work when screen is focused
    ...
    return () => { /* cleanup */ };
  }, [dep1, dep2]),
);

// AFTER:
import { useCallback, useEffect } from 'react';
...
useEffect(() => {
  if (!isActive) return;
  // do work when screen is focused
  ...
  return () => { /* cleanup */ };
}, [isActive, dep1, dep2]);
```

- [ ] **Step 1: Fix RatesScreen.js** — apply the pattern above. Read the actual useFocusEffect contents and replace accordingly. Also add `isActive` to the component's destructured props.

- [ ] **Step 2: Fix ConverterScreen.js** — same pattern. Note: ConverterScreen has 2 useFocusEffect calls (lines 516 and 589).

- [ ] **Step 3: Fix HistoryScreen.js** — same pattern.

- [ ] **Step 4: Run tests**

Run: `cd tasa-del-dia && npx jest --no-coverage`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add tasa-del-dia/src/screens/RatesScreen.js tasa-del-dia/src/screens/ConverterScreen.js tasa-del-dia/src/screens/HistoryScreen.js
git commit -m "refactor: replace useFocusEffect with useEffect(isActive) for PagerView"
```

---

### Task 6: Add gradient background container to all screens

**Files:**
- Create: `tasa-del-dia/src/components/ScreenContainer.js`
- Modify: `tasa-del-dia/src/screens/RatesScreen.js`
- Modify: `tasa-del-dia/src/screens/ConverterScreen.js`
- Modify: `tasa-del-dia/src/screens/HistoryScreen.js`

- [ ] **Step 1: Create ScreenContainer component**

```js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export default function ScreenContainer({ children }) {
  const { isDark } = useTheme();
  if (isDark) {
    return (
      <LinearGradient
        colors={['#0a0a14', '#141428', '#1a1a3e']}
        locations={[0, 0.5, 1]}
        style={styles.container}
      >
        {children}
      </LinearGradient>
    );
  }
  return <View style={[styles.container, { backgroundColor: '#f0f2f5' }]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
```

- [ ] **Step 2: Wrap each screen's content in ScreenContainer**

In each screen, wrap the top-level view with `<ScreenContainer>...</ScreenContainer>` instead of the current background color.

- [ ] **Step 3: Run tests**

Run: `cd tasa-del-dia && npx jest --no-coverage`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add tasa-del-dia/src/components/ScreenContainer.js tasa-del-dia/src/screens/RatesScreen.js tasa-del-dia/src/screens/ConverterScreen.js tasa-del-dia/src/screens/HistoryScreen.js
git commit -m "feat: add gradient background ScreenContainer"
```

---

### Task 7: Update RateCard with BlurView + glow shadow

**Files:**
- Modify: `tasa-del-dia/src/components/RateCard.js`
- Test: `tasa-del-dia/src/components/__tests__/RateCard.test.js`

- [ ] **Step 1: Extract glow color mapping function**

In each card, determine the glow color based on `type` prop:
- BCV → `C.glowBcv`
- Paralelo → `C.glowParalelo`
- Euro → `C.glowEuro`
- BCV Lunes → `C.glowBcvLunes`
- Gasolina → `C.glowGasolina`

- [ ] **Step 2: Add glow style to card container**

Add to the card style:
```js
shadowColor: glowColor,
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.4,
shadowRadius: 12,
elevation: 8,
```

- [ ] **Step 3: Add BlurView inside the card**

Replace the card's `View` wrapper with a `BlurView`:

```js
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';

// Inside card render:
<BlurView
  intensity={Platform.OS === 'android' ? 30 : 40}
  tint={isDark ? 'dark' : 'light'}
  style={[styles.card, cardStyle, compact && styles.compactCard]}
>
  {children}
</BlurView>
```

Wait — but `BlurView` has issues with `overflow: 'hidden'` on some Android versions. And the card already has `overflow: 'hidden'`. Let me think about this more carefully.

Actually, the simplest approach: keep the outer View (with styles like shadow, border, overflow) and place a BlurView INSIDE it as the background layer.

```jsx
<View style={[styles.card, cardStyle, compact && styles.compactCard, { shadowColor: glowColor }]}>
  <BlurView
    intensity={Platform.OS === 'android' ? 30 : 40}
    tint={isDark ? 'dark' : 'light'}
    style={StyleSheet.absoluteFill}
  />
  {/* existing card content */}
  {children}
</View>
```

This way the View handles the layout and shadow, the BlurView provides the glass background as an absolute-fill layer.

- [ ] **Step 4: Run tests**

Run: `cd tasa-del-dia && npx jest --no-coverage`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add tasa-del-dia/src/components/RateCard.js
git commit -m "feat: add BlurView and glow shadow to RateCard"
```

---

### Task 8: Update shimmer and remaining glass details

**Files:**
- Modify: `tasa-del-dia/src/components/ShimmerEffect.js`
- Modify: `tasa-del-dia/src/screens/RatesScreen.js` (optional refactor)

- [ ] **Step 1: Update ShimmerEffect placeholder colors**

The shimmer colors were already updated in a previous fix (`rgba(180,180,180,0.2)`). Verify they look good against the glass cards. If not, adjust the alpha values.

- [ ] **Step 2: Final test run**

Run: `cd tasa-del-dia && npx jest --no-coverage`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add tasa-del-dia/src/components/ShimmerEffect.js
git commit -m "fix: update shimmer colors for glass aesthetic"
```

---

### Task 9: Full verification + checkpoint

- [ ] **Step 1: Run full test suite**

Run: `cd tasa-del-dia && npx jest --no-coverage`
Expected: All tests pass.

- [ ] **Step 2: Create a git checkpoint tag**

```bash
git tag -a glassmorphism-checkpoint -m "Glassmorphism redesign checkpoint — before APK build"
```

- [ ] **Step 3: Push everything including tags**

```bash
git push origin main --tags
```
