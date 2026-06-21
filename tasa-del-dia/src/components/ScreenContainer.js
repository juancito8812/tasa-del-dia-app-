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
