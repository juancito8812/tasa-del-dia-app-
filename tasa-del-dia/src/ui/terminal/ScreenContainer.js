// Variante TERMINAL del rediseño monocromo (fuente: feature/ui-monocromo).
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function ScreenContainer({ children }) {
  const { colors: C, isDark } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: C?.primary || (isDark ? '#000000' : '#ffffff') }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});