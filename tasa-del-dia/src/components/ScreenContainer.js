import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export default function ScreenContainer({ children }) {
  const { isDark } = useTheme();
  if (isDark) {
    return (
      <LinearGradient
        colors={['#000000', '#0d0d0d', '#1a1a1a']}
        locations={[0, 0.5, 1]}
        style={styles.container}
      >
        {children}
      </LinearGradient>
    );
  }
  return (
    <LinearGradient
      colors={['#ffffff', '#f2f2f2']}
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
