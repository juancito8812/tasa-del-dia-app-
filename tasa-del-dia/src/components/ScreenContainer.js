// ScreenContainer ÚNICO para todos los estilos de UI (Q1).
//
// El degradado de fondo sale de la PALETA del tema activo (`C.screenGradient`)
// y el estilo fintech envuelve además a los hijos con FintechFontsProvider.
// Antes había una copia por tema (`ui/editorial/ScreenContainer.js`,
// `ui/fintech/ScreenContainer.js`) con los colores hardcodeados.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { FintechFontsProvider } from '../ui/fintech/fonts';

export default function ScreenContainer({ children }) {
  const { colors: C, uiStyle } = useTheme();
  const gradient = C?.screenGradient;

  const content =
    uiStyle === 'fintech' ? <FintechFontsProvider>{children}</FintechFontsProvider> : children;

  // `screenGradient: null` (terminal) ⇒ fondo sólido de la paleta.
  if (!gradient) {
    return (
      <View style={[styles.container, { backgroundColor: C?.primary || '#000000' }]}>
        {content}
      </View>
    );
  }

  const gradientColors = /** @type {any} */ (gradient.colors);
  const gradientLocations = /** @type {any} */ (gradient.locations);

  return (
    <LinearGradient
      colors={gradientColors}
      locations={gradientLocations}
      style={styles.container}
    >
      {content}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
