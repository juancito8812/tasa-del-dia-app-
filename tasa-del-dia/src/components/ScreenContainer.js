import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export default function ScreenContainer({ children }) {
  const { isDark } = useTheme();
  if (isDark) {
    return (
      <LinearGradient
        colors={['#0b0b16', '#10102a', '#151540']}
        locations={[0, 0.5, 1]}
        style={styles.container}
      >
        {children}
      </LinearGradient>
    );
  }
  return (
    <LinearGradient
      colors={['#f5f0eb', '#faf6f2']}
      locations={[0, 1]}
      style={styles.container}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
