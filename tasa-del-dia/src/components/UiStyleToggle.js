import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

const SIZE = 32;
const ICON_SIZE = 16;

const STYLES = /** @type {const} */ ([
  { id: 'original', icon: 'ellipse-outline', label: 'Original', radius: SIZE / 2 },
  { id: 'terminal', icon: 'code-slash', label: 'Terminal', radius: 0 },
  { id: 'editorial', icon: 'book', label: 'Editorial', radius: 4 },
]);

function UiStyleToggle() {
  const { uiStyle, setUiStyle, colors: C } = useTheme();
  const idx = Math.max(0, STYLES.findIndex((s) => s.id === uiStyle));
  const current = STYLES[idx];
  const next = STYLES[(idx + 1) % STYLES.length];

  return (
    <TouchableOpacity
      style={[styles.toggle, { backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: current.radius }]}
      onPress={() => setUiStyle(next.id)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Diseño actual: ${current.label}. Toca para cambiar a ${next.label}`}
    >
      <Ionicons name={current.icon} size={ICON_SIZE} color={C.textSecondary} />
    </TouchableOpacity>
  );
}

export default React.memo(UiStyleToggle);

const styles = StyleSheet.create({
  toggle: {
    width: SIZE,
    height: SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});
