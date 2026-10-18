// Tests por estilo (Q1) de la HistoryScreen compartida: header, chips, CTA y
// listado resuelven sus deltas visuales con THEME_STYLES en vez de copias.
import React from 'react';
import TestRenderer from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import HistoryScreen, { THEME_STYLES } from '../HistoryScreen';
import { useTheme } from '../../context/ThemeContext';
import useHistoryData from '../../hooks/useHistoryData';
import { FONT } from '../../ui/fintech/fonts';
import { darkTheme as darkThemeOriginal } from '../../constants/themes';
import { darkThemeEditorial } from '../../ui/editorial/palette';
import { darkThemeFintech } from '../../ui/fintech/palette';
import { darkThemeTerminal } from '../../ui/terminal/palette';

jest.mock('../../context/ThemeContext', () => ({ useTheme: jest.fn() }));
jest.mock('../../hooks/useHistoryData', () => ({
  __esModule: true,
  default: jest.fn(),
  formatDateKey: (key) => key,
}));
jest.mock('../../components/HistoryChart', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('mock-history-chart') };
});
jest.mock('../../components/DateDetailCard', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('mock-date-detail-card') };
});
jest.mock('../../ui/fintech/fonts', () => {
  const actual = jest.requireActual('../../ui/fintech/fonts');
  return { ...actual, useFintechFonts: () => actual.FONT };
});

const RATE = (dateKey, extra = {}) => ({
  dateKey, bcv: 80.5, paralelo: 95.2, binance_p2p: 92, euro: 85.3, ...extra,
});

function hookState(overrides = {}) {
  return {
    last10: [RATE('2026-06-21'), RATE('2026-06-20', { manual: true })],
    ratesData: [RATE('2026-06-21'), RATE('2026-06-20', { manual: true })],
    selectedDateKey: null,
    selectedData: null,
    chartInfo: null,
    copiedField: null,
    customDateText: '',
    showCustomInput: true,
    handleSelectDate: () => {},
    setShowCustomInput: () => {},
    setCustomDateText: () => {},
    handleCustomDate: () => {},
    handleCopy: () => {},
    handleCopyAll: () => {},
    ...overrides,
  };
}

function render(uiStyle, C, state) {
  useTheme.mockReturnValue({ uiStyle, colors: C });
  useHistoryData.mockReturnValue(state ?? hookState());
  let renderer;
  TestRenderer.act(() => {
    renderer = TestRenderer.create(<HistoryScreen />);
  });
  return renderer;
}

const flatten = (node) => StyleSheet.flatten(node.props.style) || {};
const allTexts = (r) => r.root.findAllByType('Text');
/** Estilos aplanados de TODOS los nodos (incluye TouchableOpacity resueltos). */
const stylesOf = (r) =>
  r.root
    .findAll(() => true)
    .map((n) => n.props && n.props.style)
    .filter(Boolean)
    .map((s) => StyleSheet.flatten(s) || {});
const textsWith = (r, value) => allTexts(r).filter((t) => t.props.children === value);
const textStyle = (r, value) => flatten(allTexts(r).find((t) => t.props.children === value));

describe('HistoryScreen · deltas por estilo (Q1)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('original: marca con logo, label sin dos puntos, chips sin corchetes y CTA "Ver"', () => {
    const C = darkThemeOriginal;
    const r = render('original', C);
    expect(textsWith(r, 'Historial')).toHaveLength(1);
    expect(textsWith(r, 'Últimos 10 días')).toHaveLength(1);
    expect(textsWith(r, 'Ver')).toHaveLength(1);
    expect(textsWith(r, '[')).toHaveLength(0);
    // logo del header (caja de 32px) presente
    expect(stylesOf(r).some((s) => s.width === 32 && s.borderRadius === 10)).toBe(true);
    // CTA: fondo info y texto blanco literal
    const button = stylesOf(r).find((s) => s.backgroundColor === C.info && s.borderRadius === 12);
    expect(button).toBeTruthy();
    expect(textStyle(r, 'Ver').color).toBe('#fff');
  });

  it('editorial: el CTA usa C.onAccent en vez del blanco literal', () => {
    const C = darkThemeEditorial;
    const r = render('editorial', C);
    expect(textStyle(r, 'Ver').color).toBe(C.onAccent);
    expect(THEME_STYLES.editorial.accent).toBe('onAccent');
  });

  it('fintech: radios 13, CTA highlight y tipografías geométricas', () => {
    const C = darkThemeFintech;
    const r = render('fintech', C);
    expect(textStyle(r, 'Historial').fontFamily).toBe(FONT.sansSemiBold);
    expect(textStyle(r, 'Historial').fontWeight).toBe('600');
    expect(textStyle(r, 'Últimos 10 días').fontFamily).toBe(FONT.monoMedium);
    // chips con radio 13 y borde fino (base: 12 / 1.5)
    const chip = stylesOf(r).find((s) => s.borderRadius === 13 && s.paddingVertical === 10);
    expect(chip.borderWidth).toBe(1);
    // CTA en highlight con acento del tema
    expect(stylesOf(r).some((s) => s.backgroundColor === C.highlight && s.borderRadius === 13)).toBe(true);
    expect(textStyle(r, 'Ver').color).toBe(C.onAccent);
    // filas de la lista con radio 13
    expect(stylesOf(r).some((s) => s.borderRadius === 13 && s.padding === 14)).toBe(true);
  });

  it('terminal: prompt, título en mayúsculas, chips con corchetes y CTA "> VER"', () => {
    const C = darkThemeTerminal;
    const r = render('terminal', C, hookState({ chartInfo: { labels: ['06/21'], data: [[80]] } }));
    expect(textsWith(r, '>')).toHaveLength(1);
    expect(textsWith(r, 'HISTORIAL')).toHaveLength(1);
    expect(textsWith(r, 'Últimos 10 días:')).toHaveLength(1);
    expect(textsWith(r, '> VER')).toHaveLength(1);
    // corchetes: 2 chips × '[' y ']'
    expect(textsWith(r, '[')).toHaveLength(2);
    expect(textsWith(r, ']')).toHaveLength(2);
    // sin logo de header
    expect(stylesOf(r).some((s) => s.width === 32 && s.borderRadius === 10)).toBe(false);
    // CTA relleno con textPrimary y sin radio (tema de consola)
    const button = stylesOf(r).find((s) => s.backgroundColor === C.textPrimary && s.paddingHorizontal === 14);
    expect(button.borderRadius).toBe(0);
    expect(textStyle(r, '> VER').color).toBe(C.onAccent);
    // etiqueta de manual en mayúsculas y en dimmed
    expect(textsWith(r, 'MANUAL')).toHaveLength(1);
    expect(textStyle(r, 'MANUAL').color).toBe(C.dimmed);
    // item de lista sin fondo; contenedor del gráfico punteado y sin radio
    expect(stylesOf(r).some((s) => s.backgroundColor === 'transparent' && s.padding === 12)).toBe(true);
    expect(stylesOf(r).some((s) => s.padding === 12 && s.borderStyle === 'dashed')).toBe(true);
  });

  it('terminal: estado vacío con icono 44 y texto dimmed', () => {
    const C = darkThemeTerminal;
    const r = render(
      'terminal',
      C,
      hookState({ last10: [], ratesData: [], selectedDateKey: null, showCustomInput: false })
    );
    const emptyIcon = r.root
      .findAll((n) => n.props.name === 'calendar-outline' && n.props.size === 44)
      .map((n) => n.props);
    expect(emptyIcon.length).toBeGreaterThanOrEqual(1);
    expect(emptyIcon[0].color).toBe(C.dimmed);
    // el base usa 48 / textMuted
    const base = render(
      'original',
      darkThemeOriginal,
      hookState({ last10: [], ratesData: [], selectedDateKey: null, showCustomInput: false })
    );
    const baseIcon = base.root.findAll((n) => n.props.name === 'calendar-outline' && n.props.size === 48)[0].props;
    expect(baseIcon.color).toBe(darkThemeOriginal.textMuted);
  });

  it('los 4 estilos comparten el mismo módulo (no quedan copias por tema)', () => {
    const styles = ['original', 'editorial', 'fintech', 'terminal'];
    styles.forEach((style) => expect(THEME_STYLES[style]).toBeDefined());
    const C = darkThemeOriginal;
    const renders = styles.map((s) => render(s, C));
    renders.forEach((r) => expect(allTexts(r).length).toBeGreaterThan(0));
  });
});
