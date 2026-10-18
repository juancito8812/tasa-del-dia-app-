// Tests por estilo (Q1) del HistoryChart compartido: el par de colores de serie
// es el delta visual que se conserva de cada copia por tema.
import React from 'react';
import TestRenderer from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import HistoryChart, { THEME_STYLES, getSeriesColors, LEGEND_TOKENS } from '../HistoryChart';
import { useTheme } from '../../context/ThemeContext';
import { darkTheme as darkThemeOriginal } from '../../constants/themes';
import { darkThemeEditorial } from '../../ui/editorial/palette';
import { darkThemeFintech } from '../../ui/fintech/palette';
import { darkThemeTerminal } from '../../ui/terminal/palette';

jest.mock('../../context/ThemeContext', () => ({ useTheme: jest.fn() }));

const chartInfo = {
  labels: ['06/21', '06/20', '06/19'],
  data: [[80, 79, 78], [95, 94, 93]],
};

/** Colores de las barras del primer grupo (una por serie). */
function barColors(renderer) {
  return renderer.root
    .findAllByType('View')
    .map((v) => StyleSheet.flatten(v.props.style))
    .filter((s) => s && s.borderRadius === 4 && s.backgroundColor && s.opacity === 0.85)
    .slice(0, 2)
    .map((s) => s.backgroundColor);
}

/** Colores de los puntos de la leyenda. */
function legendColors(renderer) {
  return renderer.root
    .findAllByType('View')
    .map((v) => StyleSheet.flatten(v.props.style))
    .filter((s) => s && s.borderRadius === 2 && s.width === 10)
    .map((s) => s.backgroundColor);
}

function render(uiStyle, C) {
  useTheme.mockReturnValue({ uiStyle, colors: C });
  let renderer;
  TestRenderer.act(() => {
    renderer = TestRenderer.create(<HistoryChart chartInfo={chartInfo} C={C} ratesCount={10} />);
  });
  return renderer;
}

describe('HistoryChart · colores de serie por estilo (Q1)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('original mantiene los colores semánticos [success, highlight]', () => {
    const C = darkThemeOriginal;
    expect(barColors(render('original', C))).toEqual([C.success, C.highlight]);
  });

  it('fintech mantiene los colores semánticos [success, highlight]', () => {
    const C = darkThemeFintech;
    expect(barColors(render('fintech', C))).toEqual([C.success, C.highlight]);
  });

  it('editorial usa el par monocromo [textPrimary, textMuted] (delta deliberado)', () => {
    const C = darkThemeEditorial;
    expect(barColors(render('editorial', C))).toEqual([C.textPrimary, C.textMuted]);
  });

  it('terminal usa el par monocromo [textPrimary, dimmed] (delta deliberado)', () => {
    const C = darkThemeTerminal;
    expect(barColors(render('terminal', C))).toEqual([C.textPrimary, C.dimmed]);
  });

  it('la leyenda conserva SIEMPRE los colores con significado (success/highlight)', () => {
    for (const [uiStyle, C] of [
      ['original', darkThemeOriginal],
      ['editorial', darkThemeEditorial],
      ['fintech', darkThemeFintech],
      ['terminal', darkThemeTerminal],
    ]) {
      expect(legendColors(render(uiStyle, C))).toEqual([C.success, C.highlight]);
    }
  });

  it('getSeriesColors traduce las claves del tema a la paleta activa', () => {
    expect(getSeriesColors('editorial', darkThemeEditorial)).toEqual([
      darkThemeEditorial.textPrimary,
      darkThemeEditorial.textMuted,
    ]);
    expect(getSeriesColors('terminal', darkThemeTerminal)).toEqual([
      darkThemeTerminal.textPrimary,
      darkThemeTerminal.dimmed,
    ]);
    expect(getSeriesColors('original', darkThemeOriginal)).toEqual([
      darkThemeOriginal.success,
      darkThemeOriginal.highlight,
    ]);
    // Estilo desconocido → par con significado (fallback del registro).
    expect(getSeriesColors('no-existe', darkThemeOriginal)).toEqual([
      darkThemeOriginal.success,
      darkThemeOriginal.highlight,
    ]);
  });

  it('solo editorial y terminal se apartan del par con significado', () => {
    const conSignificado = Object.entries(THEME_STYLES)
      .filter(([, t]) => t.series.join() === LEGEND_TOKENS.join())
      .map(([style]) => style)
      .sort();
    expect(conSignificado).toEqual(['fintech', 'original']);
  });

  it('fintech adelgaza los pesos y aplica familia mono, los demás no', () => {
    useTheme.mockReturnValue({ uiStyle: 'fintech', colors: darkThemeFintech });
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <HistoryChart chartInfo={chartInfo} C={darkThemeFintech} ratesCount={10} />
      );
    });
    const barLabel = renderer.root
      .findAllByType('Text')
      .map((t) => StyleSheet.flatten(t.props.style))
      .find((s) => s && s.fontSize === 9 && s.marginTop === 4);
    expect(barLabel.fontWeight).toBe('500');
    expect(THEME_STYLES.fintech.fonts.barLabel).toBe('monoMedium');
    expect(THEME_STYLES.original.fonts).toBeUndefined();
  });
});
