import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const SIZE = 32;
const ICON_SIZE = 16;

export default function ThemeToggleMini() {
  const { themePref, setTheme, colors: C } = useTheme();

  const cycleTheme = () => {
    const modes = ['system', 'dark', 'light'];
    const idx = modes.indexOf(themePref);
    setTheme(modes[(idx + 1) % modes.length]);
  };

  const getIcon = () => {
    switch (themePref) {
      case 'light': return 'sunny';
      case 'dark': return 'moon';
      default: return 'phone-portrait-outline';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.toggle, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}
      onPress={cycleTheme}
      activeOpacity={0.7}
      accessibilityLabel="Cambiar tema"
      accessibilityRole="button"
    >
      <Ionicons name={getIcon()} size={ICON_SIZE} color={C.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});
