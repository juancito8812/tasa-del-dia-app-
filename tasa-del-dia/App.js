import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import RatesScreen from './src/screens/RatesScreen';
import ConverterScreen from './src/screens/ConverterScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { registerBackgroundFetchAsync } from './src/services/backgroundTasks';

const Tab = createBottomTabNavigator();

function AnimatedTabIcon({ routeName, focused, color, size }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevFocused = useRef(focused);

  useEffect(() => {
    if (focused && !prevFocused.current) {
      scaleAnim.setValue(0.75);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }).start();
    }
    prevFocused.current = focused;
  }, [focused, scaleAnim]);

  let iconName;
  if (routeName === 'Tasas') {
    iconName = focused ? 'pulse' : 'pulse-outline';
  } else if (routeName === 'Conversor') {
    iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
  } else if (routeName === 'Historial') {
    iconName = focused ? 'stats-chart' : 'stats-chart-outline';
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Ionicons name={iconName} size={size} color={color} />
    </Animated.View>
  );
}

function AnimatedAppContent() {
  const { colors: C, isDark, theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const prevTheme = useRef(theme);

  useEffect(() => {
    if (prevTheme.current !== theme) {
      prevTheme.current = theme;
      fadeAnim.setValue(1);
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [theme, fadeAnim]);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer
        theme={{
          dark: isDark,
          colors: {
            primary: C.highlight,
            background: C.primary,
            card: C.tabBar,
            text: C.textPrimary,
            border: C.tabBarBorder,
            notification: C.highlight,
          },
          fonts: {
            regular: { fontFamily: 'System', fontWeight: '400' },
            medium: { fontFamily: 'System', fontWeight: '500' },
            bold: { fontFamily: 'System', fontWeight: '700' },
            heavy: { fontFamily: 'System', fontWeight: '800' },
          },
        }}
      >
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => (
              <AnimatedTabIcon routeName={route.name} focused={focused} color={color} size={size} />
            ),
            tabBarActiveTintColor: C.highlight,
            tabBarInactiveTintColor: C.textMuted,
            tabBarStyle: {
              backgroundColor: C.tabBar,
              borderTopColor: C.tabBarBorder,
              borderTopWidth: 1,
              paddingTop: 6,
              paddingBottom: 8,
              height: 60,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
            },
          })}
        >
          <Tab.Screen name="Tasas" component={RatesScreen} />
          <Tab.Screen name="Conversor" component={ConverterScreen} />
          <Tab.Screen name="Historial" component={HistoryScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </Animated.View>
  );
}

function App() {
  useEffect(() => {
    registerBackgroundFetchAsync();
  }, []);

  return (
    <ThemeProvider>
      <AnimatedAppContent />
    </ThemeProvider>
  );
}

export default App;
