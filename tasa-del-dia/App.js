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
