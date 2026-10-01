// 🎨 Tasa del Día — Paleta FINTECH
// Definida a mano a partir de tokens CSS (--v3-*), oct 2026:
//   --v3-bg #fbfaf7 · --v3-ink #1b1b1a · --v3-line #eceae3 · --v3-field #f6f5f1
//   --v3-vino #7a1f2b · --v3-ok #2d8a4e · --v3-danger #c0392b · --v3-yellow #ffd93d
//   Panel oscuro #14130f/#1b1916 con filas rgba(255,255,255,.035) y fila BCV amarilla.
// Light = la página clara (crema + vino); Dark = el panel hero "EN VIVO" del sitio.

export const darkThemeFintech = {
  // Backgrounds — panel oscuro cálido del hero
  primary: '#14130F', // --v3-dark
  secondary: '#1B1916', // celda .rc-stat del panel
  accent: '#262219',

  // Glass — filas .rc-row del sitio
  cardBg: 'rgba(255, 255, 255, 0.035)',
  cardBorder: 'rgba(255, 255, 255, 0.06)',
  glassCard: 'rgba(255, 255, 255, 0.05)',
  glassTabBar: 'rgba(20, 19, 15, 0.95)',
  glassOverlay: 'rgba(255, 255, 255, 0.04)',

  // 🟡 BCV — la fila amarilla del hero (.rc-row.bcv)
  success: '#FFD93D', // --v3-yellow
  glowBcv: 'rgba(255, 217, 61, 0.16)',

  // 🟢 Paralelo — verde "subida" (.rc-val.up)
  highlight: '#74D99A',
  glowParalelo: 'rgba(116, 217, 154, 0.16)',

  // 🟣 Euro — púrpura de acento del sitio
  info: '#C9A6FF',
  glowEuro: 'rgba(201, 166, 255, 0.16)',

  // 🔴 Binance P2P — coral de "bajada" (.rc-val.down)
  warning: '#EE8888',
  glowGasolina: 'rgba(238, 136, 136, 0.16)',

  // 🟢 BCV Lunes — verde "EN VIVO" del punto .rc-live
  bcvLunes: '#58D488',
  glowBcvLunes: 'rgba(88, 212, 136, 0.16)',

  // Textos
  textPrimary: '#FFFFFF',
  textSecondary: '#B6B4AC',
  textMuted: '#8A8881',

  // Texto sobre botón/acento (los acentos dark son pastel → texto oscuro)
  onAccent: '#14130F',

  // Inputs
  inputBg: 'rgba(255, 255, 255, 0.07)',
  inputBorder: 'rgba(255, 255, 255, 0.14)',

  // Tab bar
  tabBar: '#14130F',
  tabBarBorder: 'rgba(255, 255, 255, 0.08)',

  // Auxiliares compartidos
  barTrack: 'rgba(255, 255, 255, 0.10)',
  dimmed: '#8A8881',

  // Venezuela flag accent (dentro de la paleta del sitio)
  flagYellow: '#FFD93D',
  flagBlue: '#8A8881',
  flagRed: '#EE8888',
};

export const lightThemeFintech = {
  // Backgrounds — la página clara (crema)
  primary: '#FBFAF7', // --v3-bg
  secondary: '#F6F5F1', // --v3-field
  accent: '#ECEAE3', // --v3-line

  // Glass — tarjetas blancas con borde línea
  cardBg: '#FFFFFF', // --v3-panel
  cardBorder: '#ECEAE3', // --v3-line
  glassCard: 'rgba(255, 255, 255, 0.9)',
  glassTabBar: 'rgba(251, 250, 247, 0.95)',
  glassOverlay: 'rgba(0, 0, 0, 0.02)',

  // 🟡 BCV — dorado legible sobre crema (variante oscura de --v3-yellow)
  success: '#A67C00',
  glowBcv: 'rgba(166, 124, 0, 0.12)',

  // 🟢 Paralelo — verde-sobre-claro del sitio (chip: #1f6b3b sobre #e8f2eb)
  highlight: '#1F6B3B',
  glowParalelo: 'rgba(45, 138, 78, 0.12)', // --v3-ok

  // 🟣 Euro — púrpura oscurecido para contraste (base #c9a6ff)
  info: '#7C4DBE',
  glowEuro: 'rgba(124, 77, 190, 0.12)',

  // 🔴 Binance P2P — --v3-danger
  warning: '#C0392B',
  glowGasolina: 'rgba(192, 57, 43, 0.12)',

  // 🍷 BCV Lunes — --v3-vino, el acento principal de la página clara
  bcvLunes: '#7A1F2B',
  glowBcvLunes: 'rgba(122, 31, 43, 0.12)',

  // Textos
  textPrimary: '#1B1B1A', // --v3-ink
  textSecondary: '#54534E',
  textMuted: '#8A8881',

  // Texto sobre botón primario (vino/verdes/rojos → blanco)
  onAccent: '#FFFFFF',

  // Inputs
  inputBg: '#F6F5F1', // --v3-field
  inputBorder: '#E1DFD6',

  // Tab bar
  tabBar: '#FBFAF7',
  tabBarBorder: '#ECEAE3',

  // Auxiliares compartidos
  barTrack: '#ECEAE3',
  dimmed: '#8A8881',

  // Venezuela flag accent
  flagYellow: '#FFD93D',
  flagBlue: '#8A8881',
  flagRed: '#C0392B',
};
