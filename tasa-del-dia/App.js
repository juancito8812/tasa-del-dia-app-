import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import RatesScreen from './src/screens/RatesScreen';
import ConverterScreen from './src/screens/ConverterScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import CustomTabBar from './src/components/CustomTabBar';
import ScreenContainer from './src/components/ScreenContainer';
import { ensureReminderScheduled } from './src/services/notifications';
import { registerBackgroundFetchAsync } from './src/services/backgroundTasks';
import UpdateModal from './src/components/UpdateModal';
import { checkLatestRelease, isUpdateAvailable, getCurrentVersion, isVersionSkipped } from './src/services/autoUpdate';

function AnimatedAppContent() {
  const { colors: C, isDark, theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const prevTheme = useRef(theme);
  const pagerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdate, setShowUpdate] = useState(false);

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

  const scrollOffset = useRef(new Animated.Value(0)).current;

  const onTabPress = useCallback((index) => {
    pagerRef.current?.setPage(index);
    setActiveIndex(index);
  }, []);

  const onPageScroll = useCallback((e) => {
    const { position, offset } = e.nativeEvent;
    scrollOffset.setValue(position + offset);
  }, [scrollOffset]);

  const onPageSelected = useCallback((e) => {
    setActiveIndex(e.nativeEvent.position);
  }, []);

  // Auto-update: check on mount, delay so it doesn't interrupt first render
  useEffect(() => {
    const check = async () => {
      try {
        const release = await checkLatestRelease();
        if (!release) return;
        const current = getCurrentVersion();
        if (!isUpdateAvailable(current, release.version)) return;
        const skipped = await isVersionSkipped(release.version);
        if (skipped) return;
        setUpdateInfo(release);
        setTimeout(() => setShowUpdate(true), 2000);
      } catch {}
    };
    check();
  }, []);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenContainer>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={[styles.container, { backgroundColor: 'transparent' }]}>
            <PagerView
              ref={pagerRef}
              style={styles.pager}
              initialPage={0}
              onPageScroll={onPageScroll}
              onPageSelected={onPageSelected}
              overScrollMode="never"
            >
              <View style={styles.page} key="tasas">
                <RatesScreen />
              </View>
              <View style={styles.page} key="conversor">
                <ConverterScreen />
              </View>
              <View style={styles.page} key="historial">
                <HistoryScreen />
              </View>
            </PagerView>
            <CustomTabBar
              activeIndex={activeIndex}
              scrollOffset={scrollOffset}
              onTabPress={onTabPress}
              colors={C}
            />
          </View>
        </SafeAreaView>
      </ScreenContainer>

      <UpdateModal
        visible={showUpdate}
        onClose={() => setShowUpdate(false)}
        currentVersion={getCurrentVersion()}
        latestVersion={updateInfo?.version || ''}
        apkUrl={updateInfo?.apkUrl || ''}
        notes={updateInfo?.notes || ''}
        C={C}
      />
    </Animated.View>
  );
}

class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) {
    // Solo loguear en desarrollo para no exponer stack traces en producción
    if (__DEV__) {
      console.warn('[ErrorBoundary] Component crash:', error?.message || error);
      console.warn('[ErrorBoundary] Stack:', info?.componentStack || info);
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex:1, justifyContent:'center', alignItems:'center', padding:24, backgroundColor:'#0a0a14' }}>
          <Text style={{ fontSize:40, marginBottom:12 }}>🔄</Text>
          <Text style={{ fontSize:18, fontWeight:'700', color:'#ffffff', marginBottom:8, textAlign:'center' }}>
            Algo salió mal
          </Text>
          <Text style={{ fontSize:14, color:'#a0aec0', textAlign:'center', marginBottom:24, lineHeight:20 }}>
            Ocurrió un error inesperado. Por favor, reinicia la app.
          </Text>
          <Text style={{ fontSize:12, color:'#636e82', textAlign:'center' }}>
            Si el problema persiste, contacta al soporte.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function App() {
  useEffect(() => {
    registerBackgroundFetchAsync().catch(console.warn);
    ensureReminderScheduled();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <AnimatedAppContent />
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pager: { flex: 1 },
  page: { flex: 1 },
});

export default App;
