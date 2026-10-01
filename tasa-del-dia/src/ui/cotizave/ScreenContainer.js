// Estilo COTIZAVE — degradado del panel hero (#14130f) o de la página crema (#fbfaf7).
import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

export default function ScreenContainer({ children }) {
  const { isDark } = useTheme();
  if (isDark) {
    return (
      <LinearGradient
        colors={['#14130F', '#1B1916', '#14130F']}
        locations={[0, 0.5, 1]}
        style={styles.container}
      >
        {children}
      </LinearGradient>
    );
  }
  return (
    <LinearGradient
      colors={['#FBFAF7', '#F6F5F1']}
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
