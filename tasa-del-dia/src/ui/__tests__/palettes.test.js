import { darkTheme, lightTheme } from '../../constants/themes';
import { darkThemeEditorial, lightThemeEditorial } from '../editorial/palette';
import { darkThemeTerminal, lightThemeTerminal } from '../terminal/palette';

const REQUIRED_KEYS = [
  'primary', 'secondary', 'accent',
  'cardBg', 'cardBorder', 'glassCard', 'glassTabBar', 'glassOverlay',
  'success', 'glowBcv', 'highlight', 'glowParalelo',
  'info', 'glowEuro', 'warning', 'glowGasolina',
  'bcvLunes', 'glowBcvLunes',
  'textPrimary', 'textSecondary', 'textMuted',
  'inputBg', 'inputBorder',
  'tabBar', 'tabBarBorder',
  'onAccent', 'barTrack', 'dimmed',
  'flagYellow', 'flagBlue', 'flagRed',
];

const PALETTES = [
  ['original/dark', darkTheme], ['original/light', lightTheme],
  ['editorial/dark', darkThemeEditorial], ['editorial/light', lightThemeEditorial],
  ['terminal/dark', darkThemeTerminal], ['terminal/light', lightThemeTerminal],
];

describe.each(PALETTES)('paleta %s', (_name, palette) => {
  it.each(REQUIRED_KEYS)('expone la clave %s', (key) => {
    expect(palette).toHaveProperty(key);
    expect(typeof palette[key]).toBe('string');
  });
});
