// 🎨 Tasa del Día — Tema Monocromo (rama experimental feature/ui-monocromo)
// Solo 2 colores: negro y blanco (grises derivados de opacidad).
// Todas las claves semánticas apuntan al acento monocromo; la distinción
// entre tasas la dan el icono + la etiqueta de cada tarjeta.

export const darkTheme = {
  // Backgrounds
  primary: '#000000',
  secondary: '#101010',
  accent: '#1a1a1a',

  // Glass
  cardBg: 'rgba(255, 255, 255, 0.05)',
  cardBorder: 'rgba(255, 255, 255, 0.12)',

  glassCard: 'rgba(255, 255, 255, 0.06)',
  glassTabBar: 'rgba(0, 0, 0, 0.9)',
  glassOverlay: 'rgba(255, 255, 255, 0.03)',

  // Acento único (blanco) — antes: BCV esmeralda, Paralelo ámbar, Euro azul...
  success: '#ffffff',
  glowBcv: 'rgba(255, 255, 255, 0.18)',

  highlight: '#ffffff',
  glowParalelo: 'rgba(255, 255, 255, 0.18)',

  info: '#ffffff',
  glowEuro: 'rgba(255, 255, 255, 0.18)',

  warning: '#ffffff',
  glowGasolina: 'rgba(255, 255, 255, 0.18)',

  bcvLunes: '#ffffff',
  glowBcvLunes: 'rgba(255, 255, 255, 0.18)',

  // Textos
  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#6b6b6b',

  // Texto sobre acento (botones/iconos blancos)
  onAccent: '#000000',

  // Inputs
  inputBg: 'rgba(255, 255, 255, 0.06)',
  inputBorder: 'rgba(255, 255, 255, 0.18)',

  // Tab bar
  tabBar: '#000000',
  tabBarBorder: 'rgba(255, 255, 255, 0.1)',

  // Terminal
  barTrack: '#222222',
  dimmed: '#888888',

  // Venezuela flag accent (monocromo)
  flagYellow: '#e0e0e0',
  flagBlue: '#8a8a8a',
  flagRed: '#b0b0b0',
};

export const lightTheme = {
  // Backgrounds
  primary: '#ffffff',
  secondary: '#f5f5f5',
  accent: '#e8e8e8',

  // Glass
  cardBg: '#ffffff',
  cardBorder: 'rgba(0, 0, 0, 0.12)',

  glassCard: 'rgba(255, 255, 255, 0.9)',
  glassTabBar: 'rgba(255, 255, 255, 0.95)',
  glassOverlay: 'rgba(0, 0, 0, 0.02)',

  // Acento único (negro)
  success: '#000000',
  glowBcv: 'rgba(0, 0, 0, 0.1)',

  highlight: '#000000',
  glowParalelo: 'rgba(0, 0, 0, 0.1)',

  info: '#000000',
  glowEuro: 'rgba(0, 0, 0, 0.1)',

  warning: '#000000',
  glowGasolina: 'rgba(0, 0, 0, 0.1)',

  bcvLunes: '#000000',
  glowBcvLunes: 'rgba(0, 0, 0, 0.1)',

  // Textos
  textPrimary: '#000000',
  textSecondary: '#555555',
  textMuted: '#999999',

  // Texto sobre acento (botones/iconos negros)
  onAccent: '#ffffff',

  // Inputs
  inputBg: '#f0f0f0',
  inputBorder: 'rgba(0, 0, 0, 0.15)',

  // Tab bar
  tabBar: '#ffffff',
  tabBarBorder: 'rgba(0, 0, 0, 0.08)',

  // Terminal
  barTrack: '#e5e5e5',
  dimmed: '#777777',

  // Venezuela flag accent (monocromo)
  flagYellow: '#555555',
  flagBlue: '#aaaaaa',
  flagRed: '#888888',
};